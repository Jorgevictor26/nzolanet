import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth, CurrentUser } from '../../core/auth';
import { Feedback } from '../../core/feedback';
import { Preferences } from '../../core/preferences';
import { ApiPost, Posts } from '../../core/posts';
import { SocialState } from '../../core/social-state';
import { ApiUser, Users } from '../../core/users';

type ProfileListModal = 'followers' | 'following' | null;

type ProfileListItem = {
  id: number;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  isFollowing: boolean;
};

type ProfileContentFilter = 'posts' | 'photos' | 'videos' | 'tagged';

type ProfileMediaItem = {
  id: number;
  kind: ProfileContentFilter;
  text: string;
  image?: string;
  video?: string;
  alt: string;
  likesCount: number;
  commentsCount: number;
  time: string;
};

type ProfileComment = {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
};

@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink],
  templateUrl: './profile.html'
})
export class Profile implements OnInit {
  constructor(
    protected readonly auth: Auth,
    private readonly feedback: Feedback,
    private readonly postsService: Posts,
    protected readonly prefs: Preferences,
    protected readonly socialState: SocialState,
    private readonly users: Users
  ) {}

  protected readonly isProfileEditorOpen = signal(false);
  protected readonly isSavingProfile = signal(false);
  protected readonly profileError = signal<string | null>(null);
  protected readonly editName = signal('');
  protected readonly editUsername = signal('');
  protected readonly editPhoneNumber = signal('');
  protected readonly editBio = signal('');
  protected readonly editPrivacy = signal<'public' | 'private'>('public');
  protected readonly isLoadingPosts = signal(false);
  protected readonly activeModal = signal<ProfileListModal>(null);
  protected readonly activeMediaItemId = signal<number | null>(null);
  protected readonly activeContentFilter = signal<ProfileContentFilter>('posts');
  protected readonly likedPostIds = signal<Set<number>>(new Set());
  protected readonly profileComments = signal<Record<number, ProfileComment[]>>({});
  protected readonly followers = signal<ProfileListItem[]>([]);
  protected readonly following = signal<ProfileListItem[]>([]);
  protected readonly followersCount = signal(0);
  protected readonly followingCount = signal(0);
  protected readonly suggestedProfiles = signal<ProfileListItem[]>([]);
  protected readonly mediaItems = signal<ProfileMediaItem[]>([]);
  protected readonly filteredMediaItems = computed(() => {
    const filter = this.activeContentFilter();
    const items = this.mediaItems();

    if (filter === 'posts') {
      return items;
    }

    if (filter === 'tagged') {
      return [];
    }

    return items.filter((item) => item.kind === filter);
  });
  protected readonly activeMediaItem = computed(() =>
    this.mediaItems().find((item) => item.id === this.activeMediaItemId()) ?? null
  );
  protected readonly activeMediaItemComments = computed(() => {
    const itemId = this.activeMediaItemId();
    return itemId ? this.profileComments()[itemId] ?? [] : [];
  });
  protected readonly postsCount = computed(() => this.mediaItems().length);
  protected readonly currentUser = computed(() => this.auth.currentUser());

  ngOnInit(): void {
    this.auth.me().subscribe({
      next: ({ data }) => {
        this.syncEditor(data);
        this.loadUserPosts(data.id);
        this.loadProfileLists(data.id);
        this.loadSuggestions();
      },
      error: (error: unknown) => this.profileError.set(this.errorMessage(error))
    });
  }

  protected openProfileEditor(): void {
    const user = this.currentUser();

    if (user) {
      this.syncEditor(user);
    }

    this.profileError.set(null);
    this.isProfileEditorOpen.set(true);
  }

  protected closeProfileEditor(): void {
    this.isProfileEditorOpen.set(false);
  }

  protected saveProfile(): void {
    this.profileError.set(null);
    this.isSavingProfile.set(true);
    this.auth.updateProfile({
      name: this.editName().trim(),
      username: this.normalizeUsername(this.editUsername()),
      phone_number: this.editPhoneNumber().trim() || null,
      bio: this.editBio().trim() || null,
      privacy: this.editPrivacy()
    }).subscribe({
      next: () => {
        this.isSavingProfile.set(false);
        this.isProfileEditorOpen.set(false);
        this.feedback.show('Perfil atualizado.');
      },
      error: (error: unknown) => {
        this.isSavingProfile.set(false);
        this.profileError.set(this.errorMessage(error));
      }
    });
  }

  protected chooseProfilePhoto(input: HTMLInputElement): void {
    input.click();
  }

  protected changeProfilePhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const photo = input.files?.[0];

    if (!photo) {
      return;
    }

    this.profileError.set(null);
    this.auth.changeProfilePhoto(photo).subscribe({
      next: () => this.feedback.show('Foto de perfil atualizada.'),
      error: (error: unknown) => this.profileError.set(this.errorMessage(error))
    });
    input.value = '';
  }

  protected profilePhotoUrl(user: CurrentUser | null = this.currentUser()): string {
    return user?.profile_photo ? `/storage/${user.profile_photo}` : 'https://i.pravatar.cc/180?img=47';
  }

  protected username(user: CurrentUser | null = this.currentUser()): string {
    if (user?.username) {
      return `@${user.username}`;
    }

    return user?.email ? `@${user.email.split('@')[0]}` : '@utilizador';
  }

  protected setContentFilter(filter: ProfileContentFilter): void {
    this.activeContentFilter.set(filter);
    this.feedback.show('Filtro do perfil aplicado.', 'info');
  }

  protected openModal(modal: Exclude<ProfileListModal, null>): void {
    this.activeModal.set(modal);
    const userId = this.currentUser()?.id;

    if (userId) {
      this.loadProfileList(userId, modal);
    }
  }

  protected closeModal(): void {
    this.activeModal.set(null);
  }

  protected openMediaItem(itemId: number): void {
    this.activeMediaItemId.set(itemId);
  }

  protected closeMediaItem(): void {
    this.activeMediaItemId.set(null);
  }

  protected isPostLiked(postId: number): boolean {
    return this.likedPostIds().has(postId);
  }

  protected togglePostLike(postId: number): void {
    const wasLiked = this.isPostLiked(postId);
    this.likedPostIds.update((postIds) => {
      const nextPostIds = new Set(postIds);
      nextPostIds.has(postId) ? nextPostIds.delete(postId) : nextPostIds.add(postId);
      return nextPostIds;
    });
    this.updateMediaItemCount(postId, 'likesCount', wasLiked ? -1 : 1);
    this.feedback.show(this.isPostLiked(postId) ? 'Deste baze nesta publicacao.' : 'Baze removido.', this.isPostLiked(postId) ? 'success' : 'info');
  }

  protected sharePost(postId: number): void {
    const isShared = this.socialState.togglePostShare(postId);
    this.feedback.show(isShared ? 'Publicacao partilhada.' : 'Partilha removida.', isShared ? 'success' : 'info');
  }

  protected isPostSaved(postId: number): boolean {
    return this.socialState.isPostFavorite(postId);
  }

  protected togglePostFavorite(postId: number): void {
    const isFavorite = this.socialState.togglePostFavorite(postId);
    this.feedback.show(isFavorite ? 'Publicacao guardada nos favoritos.' : 'Publicacao removida dos favoritos.', isFavorite ? 'success' : 'info');
  }

  protected submitProfileComment(input: HTMLTextAreaElement): void {
    const postId = this.activeMediaItemId();
    const text = input.value.trim();

    if (!postId || !text) {
      return;
    }

    const user = this.currentUser();
    const comment: ProfileComment = {
      id: Date.now(),
      author: user?.name ?? 'Utilizador',
      avatar: this.profilePhotoUrl(user),
      text,
      time: 'Agora'
    };

    this.profileComments.update((comments) => ({
      ...comments,
      [postId]: [...(comments[postId] ?? []), comment]
    }));
    this.updateMediaItemCount(postId, 'commentsCount', 1);
    input.value = '';
    this.feedback.show('Comentario publicado.');
  }

  protected toggleFollowerFollow(profileId: number): void {
    this.toggleListProfileFollow(profileId, 'followers');
  }

  protected unfollowProfile(profileId: number): void {
    this.toggleListProfileFollow(profileId, 'following');
  }

  protected toggleSuggestedFollow(profileId: number): void {
    this.toggleListProfileFollow(profileId, 'suggested');
  }

  private loadSuggestions(): void {
    this.users.suggestions(5).subscribe({
      next: ({ data }) => this.suggestedProfiles.set(
        data
          .filter((user) => !user.is_followed_by_viewer)
          .map((user) => this.mapUserToListItem(user))
      ),
      error: (error: unknown) => this.profileError.set(this.errorMessage(error))
    });
  }

  private loadProfileLists(userId: number): void {
    this.loadProfileList(userId, 'followers');
    this.loadProfileList(userId, 'following');
  }

  private loadProfileList(userId: number, list: Exclude<ProfileListModal, null>): void {
    const request = list === 'followers' ? this.users.followers(userId) : this.users.following(userId);
    request.subscribe({
      next: ({ data, meta }) => {
        const mappedProfiles = data.map((user) => this.mapUserToListItem(user));
        list === 'followers' ? this.followers.set(mappedProfiles) : this.following.set(mappedProfiles);
        list === 'followers' ? this.followersCount.set(meta.total) : this.followingCount.set(meta.total);
      },
      error: (error: unknown) => this.profileError.set(this.errorMessage(error))
    });
  }

  private toggleListProfileFollow(profileId: number, list: 'followers' | 'following' | 'suggested'): void {
    const source = list === 'followers' ? this.followers : list === 'following' ? this.following : this.suggestedProfiles;
    const profile = source().find((item) => item.id === profileId);

    if (!profile) {
      return;
    }

    const onSuccess = (): void => {
      source.update((profiles) =>
        list === 'suggested' && !profile.isFollowing
          ? profiles.filter((item) => item.id !== profileId)
          : profiles.map((item) => (item.id === profileId ? { ...item, isFollowing: !item.isFollowing } : item))
      );
      this.feedback.show(profile.isFollowing ? 'Perfil removido da lista a seguir.' : 'Perfil seguido.', profile.isFollowing ? 'info' : 'success');

      const userId = this.currentUser()?.id;
      if (userId) {
        this.loadProfileLists(userId);
      }
    };
    const onError = (error: unknown): void => this.profileError.set(this.errorMessage(error));

    if (profile.isFollowing) {
      this.users.unfollow(profileId).subscribe({
        next: onSuccess,
        error: onError
      });
      return;
    }

    this.users.follow(profileId).subscribe({
      next: onSuccess,
      error: onError
    });
  }

  private loadUserPosts(userId: number): void {
    this.isLoadingPosts.set(true);
    this.postsService.feed(50).subscribe({
      next: (response) => {
        this.mediaItems.set(
          response.data
            .filter((post) => post.user_id === userId)
            .map((post) => this.mapPostToMediaItem(post))
        );
        this.isLoadingPosts.set(false);
      },
      error: (error: unknown) => {
        this.profileError.set(this.errorMessage(error));
        this.isLoadingPosts.set(false);
      }
    });
  }

  private mapPostToMediaItem(post: ApiPost): ProfileMediaItem {
    return {
      id: post.id,
      kind: post.video ? 'videos' : post.image ? 'photos' : 'posts',
      text: post.content,
      image: post.image ? `/storage/${post.image}` : undefined,
      video: post.video ? `/storage/${post.video}` : undefined,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      time: this.relativeTime(post.created_at),
      alt: `Publicação de ${post.author.name ?? 'utilizador'}`
    };
  }

  private updateMediaItemCount(postId: number, key: 'likesCount' | 'commentsCount', amount: number): void {
    this.mediaItems.update((items) =>
      items.map((item) =>
        item.id === postId ? { ...item, [key]: Math.max(0, item[key] + amount) } : item
      )
    );
  }

  private mapUserToListItem(user: ApiUser): ProfileListItem {
    return {
      id: user.id,
      name: user.name,
      username: user.username ? `@${user.username}` : `@utilizador${user.id}`,
      avatar: user.profile_photo ? `/storage/${user.profile_photo}` : 'https://i.pravatar.cc/80?img=47',
      bio: user.bio ?? 'Ainda sem biografia.',
      isFollowing: user.is_followed_by_viewer
    };
  }

  private syncEditor(user: CurrentUser): void {
    this.editName.set(user.name);
    this.editUsername.set(user.username ?? '');
    this.editPhoneNumber.set(user.phone_number ?? '');
    this.editBio.set(user.bio ?? '');
    this.editPrivacy.set(user.privacy);
  }

  private normalizeUsername(username: string): string | null {
    const normalizedUsername = username.trim().replace(/^@+/, '');

    return normalizedUsername || null;
  }

  private relativeTime(value: string): string {
    const createdAt = new Date(value).getTime();

    if (Number.isNaN(createdAt)) {
      return 'Agora';
    }

    const seconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d atras`;
    if (hours > 0) return `${hours}h atras`;
    if (minutes > 0) return `${minutes}min atras`;

    return 'Agora';
  }

  private errorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Não foi possível concluir a operação.';
    }

    const validationErrors = error.error?.errors;
    const firstValidationError = validationErrors ? Object.values(validationErrors)[0] : null;

    if (Array.isArray(firstValidationError) && firstValidationError[0]) {
      return String(firstValidationError[0]);
    }

    return error.error?.message || 'Não foi possível concluir a operação.';
  }
}
