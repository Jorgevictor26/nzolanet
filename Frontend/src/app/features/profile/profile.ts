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
      next: ({ data }) => this.suggestedProfiles.set(data.map((user) => this.mapUserToListItem(user))),
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
        profiles.map((item) => (item.id === profileId ? { ...item, isFollowing: !item.isFollowing } : item))
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
      alt: `Publicação de ${post.author.name ?? 'utilizador'}`
    };
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
