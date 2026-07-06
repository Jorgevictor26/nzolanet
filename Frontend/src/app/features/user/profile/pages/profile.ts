import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth, CurrentUser } from '../../../../core/services/auth';
import { Feedback } from '../../../../core/services/feedback';
import { Posts, ReportReason } from '../../../../core/services/posts';
import { Preferences } from '../../../../core/services/preferences';
import { SocialState } from '../../../../core/services/social-state';
import { Users } from '../../../../core/services/users';
import { ContentFilterTabs, ContentFilterValue } from '../../../../shared/components/content-filter-tabs';
import { ProfileHeroCard } from '../../../../shared/components/profile-hero-card';
import { ProfileListItemViewModel } from '../../../../shared/components/profile-list-item-card';
import { ProfileListModalComponent } from '../../../../shared/components/profile-list-modal';
import { ProfileMediaGrid } from '../../../../shared/components/profile-media-grid';
import { ProfileSuggestionsCard } from '../../../../shared/components/profile-suggestions-card';
import {
  hasProfileAvatar,
  httpErrorMessage,
  mapCommentToProfileComment,
  mapPostToProfileMediaItem,
  mapUserToProfileListItem,
  profileAvatarUrl,
  profileCoverUrl,
  profileInitials,
  profileUsername
} from '../../../../shared/profile/profile-presenters';
import { ProfileComment, ProfileContentFilter, ProfileListModal, ProfileMediaItem } from '../../../../shared/profile/profile-view-models';

const reportReasons: ReportReason[] = [
  'Discurso de Ódio',
  'Spam/Publicidade',
  'Linguagem Imprópria',
  'Assédio',
  'Conteúdo Falso'
];

@Component({
  selector: 'app-profile',
  imports: [
    FormsModule,
    ContentFilterTabs,
    ProfileHeroCard,
    ProfileListModalComponent,
    ProfileMediaGrid,
    ProfileSuggestionsCard
  ],
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
  protected readonly editProfilePhotoFile = signal<File | null>(null);
  protected readonly editCoverPhotoFile = signal<File | null>(null);
  protected readonly editProfilePhotoPreview = signal<string | null>(null);
  protected readonly editCoverPhotoPreview = signal<string | null>(null);
  protected readonly isLoadingPosts = signal(false);
  protected readonly isLoadingProfileComments = signal(false);
  protected readonly isSubmittingProfileComment = signal(false);
  protected readonly reportingCommentIds = signal<Set<number>>(new Set());
  protected readonly activeModal = signal<ProfileListModal>(null);
  protected readonly activeMediaItemId = signal<number | null>(null);
  protected readonly activeContentFilter = signal<ProfileContentFilter>('posts');
  protected readonly likedPostIds = signal<Set<number>>(new Set());
  protected readonly likingPostIds = signal<Set<number>>(new Set());
  protected readonly loadedProfileCommentPostIds = signal<Set<number>>(new Set());
  protected readonly profileComments = signal<Record<number, ProfileComment[]>>({});
  protected readonly followers = signal<ProfileListItemViewModel[]>([]);
  protected readonly following = signal<ProfileListItemViewModel[]>([]);
  protected readonly followersCount = signal(0);
  protected readonly followingCount = signal(0);
  protected readonly suggestedProfiles = signal<ProfileListItemViewModel[]>([]);
  protected readonly mediaItems = signal<ProfileMediaItem[]>([]);

  protected readonly filteredMediaItems = computed(() => {
    const filter = this.activeContentFilter();
    return filter === 'posts' ? this.mediaItems() : this.mediaItems().filter((item) => item.kind === filter);
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
  protected readonly profilePrivacyLabel = computed(() =>
    this.currentUser()?.privacy === 'private' ? this.prefs.t('privateProfile') : this.prefs.t('publicProfile')
  );
  protected readonly contentTabs = computed(() => [
    { value: 'posts' as const, label: this.prefs.t('posts') },
    { value: 'photos' as const, label: this.prefs.t('photos') },
    { value: 'videos' as const, label: this.prefs.t('videos') }
  ]);

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
    this.clearPendingProfileImages();
  }

  protected saveProfile(): void {
    this.profileError.set(null);
    this.isSavingProfile.set(true);
    this.auth.updateProfile({
      name: this.editName().trim(),
      username: this.normalizeUsername(this.editUsername()),
      phone_number: this.editPhoneNumber().trim() || null,
      bio: this.editBio().trim() || null,
      privacy: this.editPrivacy(),
      profile_photo_file: this.editProfilePhotoFile(),
      cover_photo_file: this.editCoverPhotoFile()
    }).subscribe({
      next: () => {
        this.isSavingProfile.set(false);
        this.isProfileEditorOpen.set(false);
        this.clearPendingProfileImages();
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
    this.setPendingImage(photo, this.editProfilePhotoFile, this.editProfilePhotoPreview);
    input.value = '';
  }

  protected changeCoverPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const photo = input.files?.[0];

    if (!photo) {
      return;
    }

    this.profileError.set(null);
    this.setPendingImage(photo, this.editCoverPhotoFile, this.editCoverPhotoPreview);
    input.value = '';
  }

  protected profilePhotoUrl(user: CurrentUser | null = this.currentUser()): string {
    return profileAvatarUrl(user);
  }

  protected hasProfilePhoto(user: CurrentUser | null = this.currentUser()): boolean {
    return hasProfileAvatar(user);
  }

  protected profileInitials(user: CurrentUser | null = this.currentUser()): string {
    return profileInitials(user);
  }

  protected coverPhotoUrl(user: CurrentUser | null = this.currentUser()): string | null {
    return profileCoverUrl(user);
  }

  protected username(user: CurrentUser | null = this.currentUser()): string {
    return profileUsername(user);
  }

  protected setContentFilter(filter: ContentFilterValue): void {
    if (filter === 'posts' || filter === 'photos' || filter === 'videos') {
      this.activeContentFilter.set(filter);
      this.feedback.show('Filtro do perfil aplicado.', 'info');
    }
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
    this.loadProfileComments(itemId);
  }

  protected closeMediaItem(): void {
    this.activeMediaItemId.set(null);
  }

  protected isPostLiked(postId: number): boolean {
    return this.likedPostIds().has(postId);
  }

  protected togglePostLike(postId: number): void {
    if (this.likingPostIds().has(postId)) {
      return;
    }

    const wasLiked = this.isPostLiked(postId);
    this.likingPostIds.update((postIds) => new Set(postIds).add(postId));

    const request = wasLiked ? this.postsService.unlike(postId) : this.postsService.like(postId);
    request.subscribe({
      next: ({ data }) => {
        const updatedItem = mapPostToProfileMediaItem(data);
        this.mediaItems.update((items) =>
          items.map((item) => (item.id === postId ? updatedItem : item))
        );
        this.setPostLiked(postId, updatedItem.isLikedByViewer);
        this.removeLikingPost(postId);
        this.feedback.show(
          updatedItem.isLikedByViewer ? 'Deste baze nesta publicação.' : 'Baze removido.',
          updatedItem.isLikedByViewer ? 'success' : 'info'
        );
      },
      error: (error: unknown) => {
        this.removeLikingPost(postId);
        this.profileError.set(this.errorMessage(error));
      }
    });
  }

  protected sharePost(postId: number): void {
    const isShared = this.socialState.togglePostShare(postId);
    this.feedback.show(isShared ? 'Publicação partilhada.' : 'Partilha removida.', isShared ? 'success' : 'info');
  }

  protected isPostSaved(postId: number): boolean {
    return this.socialState.isPostFavorite(postId);
  }

  protected togglePostFavorite(postId: number): void {
    const isFavorite = this.socialState.togglePostFavorite(postId);
    this.feedback.show(isFavorite ? 'Publicação guardada nos favoritos.' : 'Publicação removida dos favoritos.', isFavorite ? 'success' : 'info');
  }

  protected submitProfileComment(input: HTMLTextAreaElement): void {
    const postId = this.activeMediaItemId();
    const content = input.value.trim();

    if (!postId || !content || this.isSubmittingProfileComment()) {
      return;
    }

    this.isSubmittingProfileComment.set(true);
    this.profileError.set(null);
    this.postsService.createComment(postId, content).subscribe({
      next: ({ data }) => {
        this.profileComments.update((comments) => ({
          ...comments,
          [postId]: [...(comments[postId] ?? []), mapCommentToProfileComment(data)]
        }));
        this.updateMediaItemCount(postId, 'commentsCount', 1);
        input.value = '';
        this.isSubmittingProfileComment.set(false);
        this.feedback.show('Comentário publicado.');
      },
      error: (error: unknown) => {
        this.profileError.set(this.errorMessage(error));
        this.isSubmittingProfileComment.set(false);
      }
    });
  }

  protected reportProfileComment(comment: ProfileComment): void {
    if (this.canManageProfileComment(comment)) {
      this.feedback.show('Não podes denunciar o teu próprio comentário.', 'info');
      return;
    }

    if (this.isProfileCommentReporting(comment.id)) {
      return;
    }

    const reason = this.chooseReportReason();

    if (!reason) {
      return;
    }

    this.reportingCommentIds.update((commentIds) => new Set(commentIds).add(comment.id));
    this.postsService.reportComment(comment.id, reason).subscribe({
      next: () => {
        this.reportingCommentIds.update((commentIds) => {
          const nextCommentIds = new Set(commentIds);
          nextCommentIds.delete(comment.id);
          return nextCommentIds;
        });
        this.feedback.show('Denúncia submetida com sucesso.', 'success');
      },
      error: (error: unknown) => {
        this.reportingCommentIds.update((commentIds) => {
          const nextCommentIds = new Set(commentIds);
          nextCommentIds.delete(comment.id);
          return nextCommentIds;
        });
        this.profileError.set(this.errorMessage(error));
      }
    });
  }

  protected canManageProfileComment(comment: ProfileComment): boolean {
    return this.auth.currentUser()?.id === comment.userId;
  }

  protected canReportProfileComment(comment: ProfileComment): boolean {
    return !this.canManageProfileComment(comment);
  }

  protected isProfileCommentReporting(commentId: number): boolean {
    return this.reportingCommentIds().has(commentId);
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
          .map((user) => mapUserToProfileListItem(user))
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
        const mappedProfiles = data.map((user) => mapUserToProfileListItem(user));
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
      this.users.unfollow(profileId).subscribe({ next: onSuccess, error: onError });
      return;
    }

    this.users.follow(profileId).subscribe({ next: onSuccess, error: onError });
  }

  private loadUserPosts(userId: number): void {
    this.isLoadingPosts.set(true);
    this.postsService.byUser(userId, 50).subscribe({
      next: (response) => {
        this.mediaItems.set(response.data.map((post) => mapPostToProfileMediaItem(post)));
        this.syncLikedPosts(response.data);
        this.isLoadingPosts.set(false);
      },
      error: (error: unknown) => {
        this.profileError.set(this.errorMessage(error));
        this.isLoadingPosts.set(false);
      }
    });
  }

  private loadProfileComments(postId: number): void {
    if (this.loadedProfileCommentPostIds().has(postId)) {
      return;
    }

    this.isLoadingProfileComments.set(true);
    this.profileError.set(null);
    this.postsService.comments(postId).subscribe({
      next: ({ data, meta }) => {
        this.profileComments.update((comments) => ({
          ...comments,
          [postId]: data.map((comment) => mapCommentToProfileComment(comment))
        }));
        this.updateMediaItemCountTo(postId, 'commentsCount', meta.total);
        this.loadedProfileCommentPostIds.update((postIds) => new Set(postIds).add(postId));
        this.isLoadingProfileComments.set(false);
      },
      error: (error: unknown) => {
        this.profileError.set(this.errorMessage(error));
        this.isLoadingProfileComments.set(false);
      }
    });
  }

  private updateMediaItemCount(postId: number, key: 'likesCount' | 'commentsCount', amount: number): void {
    this.mediaItems.update((items) =>
      items.map((item) =>
        item.id === postId ? { ...item, [key]: Math.max(0, item[key] + amount) } : item
      )
    );
  }

  private updateMediaItemCountTo(postId: number, key: 'likesCount' | 'commentsCount', value: number): void {
    this.mediaItems.update((items) =>
      items.map((item) =>
        item.id === postId ? { ...item, [key]: Math.max(0, value) } : item
      )
    );
  }

  private syncLikedPosts(posts: { id: number; is_liked_by_viewer: boolean }[]): void {
    this.likedPostIds.set(new Set(posts.filter((post) => post.is_liked_by_viewer).map((post) => post.id)));
  }

  private setPostLiked(postId: number, isLiked: boolean): void {
    this.likedPostIds.update((postIds) => {
      const nextPostIds = new Set(postIds);
      isLiked ? nextPostIds.add(postId) : nextPostIds.delete(postId);
      return nextPostIds;
    });
  }

  private removeLikingPost(postId: number): void {
    this.likingPostIds.update((postIds) => {
      const nextPostIds = new Set(postIds);
      nextPostIds.delete(postId);
      return nextPostIds;
    });
  }

  private chooseReportReason(): ReportReason | null {
    const options = reportReasons.map((reason, index) => `${index + 1}. ${reason}`).join('\n');
    const selectedOption = window.prompt(`Escolhe o motivo da denúncia:\n${options}`);

    if (!selectedOption) {
      return null;
    }

    const selectedIndex = Number(selectedOption.trim()) - 1;

    if (Number.isInteger(selectedIndex) && reportReasons[selectedIndex]) {
      return reportReasons[selectedIndex];
    }

    const typedReason = reportReasons.find((reason) => reason.toLowerCase() === selectedOption.trim().toLowerCase());

    if (typedReason) {
      return typedReason;
    }

    this.feedback.show('Motivo de denúncia inválido.', 'info');
    return null;
  }

  private syncEditor(user: CurrentUser): void {
    this.editName.set(user.name);
    this.editUsername.set(user.username ?? '');
    this.editPhoneNumber.set(user.phone_number ?? '');
    this.editBio.set(user.bio ?? '');
    this.editPrivacy.set(user.privacy);
    this.clearPendingProfileImages();
  }

  private setPendingImage(
    file: File,
    fileSignal: { set(value: File | null): void },
    previewSignal: { set(value: string | null): void; (): string | null }
  ): void {
    if (!file.type.startsWith('image/')) {
      this.profileError.set('Escolhe uma imagem válida para o perfil.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      this.profileError.set('A imagem deve ter no máximo 4MB.');
      return;
    }

    const previousPreview = previewSignal();
    if (previousPreview) {
      URL.revokeObjectURL(previousPreview);
    }

    fileSignal.set(file);
    previewSignal.set(URL.createObjectURL(file));
  }

  private clearPendingProfileImages(): void {
    const previews = [this.editProfilePhotoPreview(), this.editCoverPhotoPreview()];
    previews.forEach((preview) => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    });

    this.editProfilePhotoFile.set(null);
    this.editCoverPhotoFile.set(null);
    this.editProfilePhotoPreview.set(null);
    this.editCoverPhotoPreview.set(null);
  }

  private normalizeUsername(username: string): string | null {
    const normalizedUsername = username.trim().replace(/^@+/, '');

    return normalizedUsername || null;
  }

  private errorMessage(error: unknown): string {
    return httpErrorMessage(error);
  }
}
