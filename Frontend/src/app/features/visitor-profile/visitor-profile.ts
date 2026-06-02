import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Feedback } from '../../core/feedback';
import { Preferences } from '../../core/preferences';
import { ApiPost, Posts } from '../../core/posts';
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

@Component({
  selector: 'app-visitor-profile',
  imports: [RouterLink],
  templateUrl: './visitor-profile.html'
})
export class VisitorProfile implements OnInit {
  private routeSubscription?: Subscription;
  protected readonly profile = signal<ApiUser | null>(null);
  protected readonly profileError = signal<string | null>(null);
  protected readonly isLoadingProfile = signal(false);
  protected readonly isLoadingPosts = signal(false);
  protected readonly isFollowInFlight = signal(false);
  protected readonly activeModal = signal<ProfileListModal>(null);
  protected readonly activeMediaItemId = signal<number | null>(null);
  protected readonly activeContentFilter = signal<ProfileContentFilter>('posts');
  protected readonly followers = signal<ProfileListItem[]>([]);
  protected readonly following = signal<ProfileListItem[]>([]);
  protected readonly followersCount = signal(0);
  protected readonly followingCount = signal(0);
  protected readonly postsCount = signal(0);
  protected readonly suggestedProfiles = signal<ProfileListItem[]>([]);
  protected readonly mediaItems = signal<ProfileMediaItem[]>([]);
  protected readonly filteredMediaItems = computed(() => {
    const filter = this.activeContentFilter();
    const items = this.mediaItems();

    return filter === 'posts'
      ? items
      : filter === 'tagged'
        ? []
        : items.filter((item) => item.kind === filter);
  });
  protected readonly activeMediaItem = computed(() =>
    this.mediaItems().find((item) => item.id === this.activeMediaItemId()) ?? null
  );

  protected readonly profileId = computed(() => this.profile()?.id ?? null);
  protected readonly isFollowing = computed(() => Boolean(this.profile()?.is_followed_by_viewer));

  constructor(
    private readonly feedback: Feedback,
    private readonly posts: Posts,
    protected readonly prefs: Preferences,
    private readonly route: ActivatedRoute,
    private readonly users: Users
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const profileId = Number(params.get('id'));

      this.resetProfileState();

      if (!Number.isInteger(profileId) || profileId <= 0) {
        this.profileError.set('Abre um perfil de utilizador válido para seguir ou deixar de seguir.');
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
                followers_count: currentProfile.followers_count + (nextIsFollowing ? 1 : -1)
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
      this.users.unfollow(profile.id).subscribe({
        next: onSuccess,
        error: onError
      });
      return;
    }

    this.users.follow(profile.id).subscribe({
      next: onSuccess,
      error: onError
    });
  }

  protected setContentFilter(filter: ProfileContentFilter): void {
    this.activeContentFilter.set(filter);
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
    return user?.profile_photo ? `/storage/${user.profile_photo}` : 'https://i.pravatar.cc/180?img=32';
  }

  protected username(user: ApiUser | null = this.profile()): string {
    if (user?.username) {
      return `@${user.username}`;
    }

    return user ? `@utilizador${user.id}` : '@utilizador';
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
        this.mediaItems.set(data.map((post) => this.mapPostToMediaItem(post)));
        this.postsCount.set(meta.total);
        this.isLoadingPosts.set(false);
      },
      error: (error: unknown) => {
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
        const mappedProfiles = data.map((user) => this.mapUserToListItem(user));
        list === 'followers' ? this.followers.set(mappedProfiles) : this.following.set(mappedProfiles);
        list === 'followers' ? this.followersCount.set(meta.total) : this.followingCount.set(meta.total);
      },
      error: (error: unknown) => this.profileError.set(this.errorMessage(error))
    });
  }

  private loadSuggestions(excludeUserId: number): void {
    this.users.suggestions(5, excludeUserId).subscribe({
      next: ({ data }) => this.suggestedProfiles.set(data.map((user) => this.mapUserToListItem(user))),
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
      this.loadProfileList('following');
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

  private mapUserToListItem(user: ApiUser): ProfileListItem {
    return {
      id: user.id,
      name: user.name,
      username: this.username(user),
      avatar: this.profilePhotoUrl(user),
      bio: user.bio ?? 'Ainda sem biografia.',
      isFollowing: user.is_followed_by_viewer
    };
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
