import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Auth } from '../../../../core/services/auth';
import { Feedback } from '../../../../core/services/feedback';
import { Posts } from '../../../../core/services/posts';
import { Preferences } from '../../../../core/services/preferences';
import { ApiUser, Users } from '../../../../core/services/users';
import { ContentFilterTabs, ContentFilterValue } from '../../../../shared/components/content-filter-tabs';
import { ProfileHeroCard } from '../../../../shared/components/profile-hero-card';
import { ProfileListItemViewModel } from '../../../../shared/components/profile-list-item-card';
import { ProfileListModalComponent } from '../../../../shared/components/profile-list-modal';
import { ProfileMediaGrid } from '../../../../shared/components/profile-media-grid';
import { ProfileSuggestionsCard } from '../../../../shared/components/profile-suggestions-card';
import {
  hasProfileAvatar,
  httpErrorMessage,
  mapPostToProfileMediaItem,
  mapUserToProfileListItem,
  profileAvatarUrl,
  profileCoverUrl,
  profileInitials,
  profileUsername
} from '../../../../shared/profile/profile-presenters';
import { ProfileContentFilter, ProfileListModal, ProfileMediaItem } from '../../../../shared/profile/profile-view-models';

@Component({
  selector: 'app-visitor-profile',
  imports: [
    ContentFilterTabs,
    ProfileHeroCard,
    ProfileListModalComponent,
    ProfileMediaGrid,
    ProfileSuggestionsCard
  ],
  templateUrl: './visitor-profile.html'
})
export class VisitorProfile implements OnInit, OnDestroy {
  private routeSubscription?: Subscription;

  protected readonly profile = signal<ApiUser | null>(null);
  protected readonly profileError = signal<string | null>(null);
  protected readonly isLoadingProfile = signal(false);
  protected readonly isLoadingPosts = signal(false);
  protected readonly isFollowInFlight = signal(false);
  protected readonly activeModal = signal<ProfileListModal>(null);
  protected readonly activeMediaItemId = signal<number | null>(null);
  protected readonly activeContentFilter = signal<ProfileContentFilter>('posts');
  protected readonly followers = signal<ProfileListItemViewModel[]>([]);
  protected readonly following = signal<ProfileListItemViewModel[]>([]);
  protected readonly followersCount = signal(0);
  protected readonly followingCount = signal(0);
  protected readonly postsCount = signal(0);
  protected readonly suggestedProfiles = signal<ProfileListItemViewModel[]>([]);
  protected readonly mediaItems = signal<ProfileMediaItem[]>([]);

  protected readonly filteredMediaItems = computed(() => {
    const filter = this.activeContentFilter();
    return filter === 'posts' ? this.mediaItems() : this.mediaItems().filter((item) => item.kind === filter);
  });
  protected readonly activeMediaItem = computed(() =>
    this.mediaItems().find((item) => item.id === this.activeMediaItemId()) ?? null
  );
  protected readonly contentTabs = computed(() => [
    { value: 'posts' as const, label: this.prefs.t('posts') },
    { value: 'photos' as const, label: this.prefs.t('photos') },
    { value: 'videos' as const, label: this.prefs.t('videos') }
  ]);
  protected readonly profileId = computed(() => this.profile()?.id ?? null);
  protected readonly isFollowing = computed(() => Boolean(this.profile()?.is_followed_by_viewer));
  protected readonly profilePrivacyLabel = computed(() =>
    this.profile()?.privacy === 'private' ? this.prefs.t('privateProfile') : this.prefs.t('publicProfile')
  );

  constructor(
    protected readonly auth: Auth,
    private readonly feedback: Feedback,
    private readonly posts: Posts,
    protected readonly prefs: Preferences,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly users: Users
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const profileId = Number(params.get('id'));

      this.resetProfileState();

      if (!Number.isInteger(profileId) || profileId <= 0) {
        this.router.navigateByUrl('/home');
        return;
      }

      if (profileId === this.auth.currentUser()?.id) {
        this.router.navigateByUrl('/profile');
        return;
      }

      this.loadProfile(profileId);
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  protected toggleFollow(): void {
    const profile = this.profile();

    if (!profile || this.isFollowInFlight()) {
      return;
    }

    this.isFollowInFlight.set(true);
    const onSuccess = (): void => {
      const nextIsFollowing = !profile.is_followed_by_viewer;
      this.profile.update((currentProfile) =>
        currentProfile
          ? {
              ...currentProfile,
              is_followed_by_viewer: nextIsFollowing,
              followers_count: Math.max(0, currentProfile.followers_count + (nextIsFollowing ? 1 : -1))
            }
          : currentProfile
      );
      this.followersCount.update((count) => Math.max(0, count + (nextIsFollowing ? 1 : -1)));
      this.isFollowInFlight.set(false);
      this.feedback.show(nextIsFollowing ? 'Agora estás a seguir este perfil.' : 'Deixaste de seguir este perfil.', nextIsFollowing ? 'success' : 'info');
    };
    const onError = (error: unknown): void => {
      this.isFollowInFlight.set(false);
      this.profileError.set(this.errorMessage(error));
    };

    if (profile.is_followed_by_viewer) {
      this.users.unfollow(profile.id).subscribe({ next: onSuccess, error: onError });
      return;
    }

    this.users.follow(profile.id).subscribe({ next: onSuccess, error: onError });
  }

  protected setContentFilter(filter: ContentFilterValue): void {
    if (filter === 'posts' || filter === 'photos' || filter === 'videos') {
      this.activeContentFilter.set(filter);
    }
  }

  protected openModal(modal: Exclude<ProfileListModal, null>): void {
    this.activeModal.set(modal);
    this.loadProfileList(modal);
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

  protected toggleSuggestedFollow(profileId: number): void {
    this.toggleListProfileFollow(profileId, 'suggested');
  }

  protected toggleFollowerFollow(profileId: number): void {
    this.toggleListProfileFollow(profileId, 'followers');
  }

  protected toggleFollowingFollow(profileId: number): void {
    this.toggleListProfileFollow(profileId, 'following');
  }

  protected profilePhotoUrl(user: ApiUser | null = this.profile()): string {
    return profileAvatarUrl(user);
  }

  protected hasProfilePhoto(user: ApiUser | null = this.profile()): boolean {
    return hasProfileAvatar(user);
  }

  protected profileInitials(user: ApiUser | null = this.profile()): string {
    return profileInitials(user);
  }

  protected coverPhotoUrl(user: ApiUser | null = this.profile()): string | null {
    return profileCoverUrl(user);
  }

  protected username(user: ApiUser | null = this.profile()): string {
    return profileUsername(user);
  }

  private loadProfile(profileId: number): void {
    this.profileError.set(null);
    this.isLoadingProfile.set(true);
    this.users.profile(profileId).subscribe({
      next: ({ data }) => {
        this.profile.set(data);
        this.followersCount.set(data.followers_count);
        this.followingCount.set(data.following_count);
        this.postsCount.set(data.posts_count);
        this.isLoadingProfile.set(false);
        this.loadUserPosts(data.id);
        this.loadProfileList('followers');
        this.loadProfileList('following');
        this.loadSuggestions(data.id);
      },
      error: (error: unknown) => {
        this.profileError.set(this.errorMessage(error));
        this.isLoadingProfile.set(false);
      }
    });
  }

  private resetProfileState(): void {
    this.profile.set(null);
    this.profileError.set(null);
    this.isFollowInFlight.set(false);
    this.activeModal.set(null);
    this.activeMediaItemId.set(null);
    this.activeContentFilter.set('posts');
    this.followers.set([]);
    this.following.set([]);
    this.followersCount.set(0);
    this.followingCount.set(0);
    this.postsCount.set(0);
    this.suggestedProfiles.set([]);
    this.mediaItems.set([]);
  }

  private loadUserPosts(userId: number): void {
    this.isLoadingPosts.set(true);
    this.posts.byUser(userId, 50).subscribe({
      next: ({ data, meta }) => {
        this.mediaItems.set(data.map((post) => mapPostToProfileMediaItem(post)));
        this.postsCount.set(meta.total);
        this.isLoadingPosts.set(false);
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 403) {
          this.mediaItems.set([]);
          this.isLoadingPosts.set(false);
          return;
        }

        this.profileError.set(this.errorMessage(error));
        this.isLoadingPosts.set(false);
      }
    });
  }

  private loadProfileList(list: Exclude<ProfileListModal, null>): void {
    const profileId = this.profileId();

    if (!profileId) {
      return;
    }

    const request = list === 'followers' ? this.users.followers(profileId) : this.users.following(profileId);
    request.subscribe({
      next: ({ data, meta }) => {
        const mappedProfiles = data.map((user) => mapUserToProfileListItem(user));
        list === 'followers' ? this.followers.set(mappedProfiles) : this.following.set(mappedProfiles);
        list === 'followers' ? this.followersCount.set(meta.total) : this.followingCount.set(meta.total);
      },
      error: (error: unknown) => this.profileError.set(this.errorMessage(error))
    });
  }

  private loadSuggestions(excludeUserId: number): void {
    this.users.suggestions(5, excludeUserId).subscribe({
      next: ({ data }) => this.suggestedProfiles.set(
        data
          .filter((user) => !user.is_followed_by_viewer)
          .map((user) => mapUserToProfileListItem(user))
      ),
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
      this.loadProfileList('following');
    };
    const onError = (error: unknown): void => this.profileError.set(this.errorMessage(error));

    if (profile.isFollowing) {
      this.users.unfollow(profileId).subscribe({ next: onSuccess, error: onError });
      return;
    }

    this.users.follow(profileId).subscribe({ next: onSuccess, error: onError });
  }

  private errorMessage(error: unknown): string {
    return httpErrorMessage(error);
  }
}
