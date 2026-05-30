import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SocialState } from '../../core/social-state';
import { Preferences } from '../../core/preferences';

@Component({
  selector: 'app-feed',
  imports: [RouterLink],
  templateUrl: './feed.html'
})
export class Feed {
  protected readonly isComposerOpen = signal(false);
  protected readonly likedPostIds = signal<Set<number>>(new Set());
  protected readonly followedProfileIds = signal<Set<number>>(new Set());

  constructor(
    protected readonly socialState: SocialState,
    protected readonly prefs: Preferences
  ) {}

  protected openComposer(): void {
    this.isComposerOpen.set(true);
  }

  protected closeComposer(): void {
    this.isComposerOpen.set(false);
  }

  protected toggleWorkspacePostFavorite(): void {
    this.socialState.toggleWorkspacePostFavorite();
  }

  protected isPostLiked(postId: number): boolean {
    return this.likedPostIds().has(postId);
  }

  protected togglePostLike(postId: number): void {
    this.likedPostIds.update((postIds) => {
      const nextPostIds = new Set(postIds);
      nextPostIds.has(postId) ? nextPostIds.delete(postId) : nextPostIds.add(postId);
      return nextPostIds;
    });
  }

  protected isFollowingProfile(profileId: number): boolean {
    return this.followedProfileIds().has(profileId);
  }

  protected toggleSuggestedFollow(profileId: number): void {
    this.followedProfileIds.update((profileIds) => {
      const nextProfileIds = new Set(profileIds);
      nextProfileIds.has(profileId) ? nextProfileIds.delete(profileId) : nextProfileIds.add(profileId);
      return nextProfileIds;
    });
  }
}
