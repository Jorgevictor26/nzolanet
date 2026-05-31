import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SocialState {
  readonly isWorkspacePostFavorite = signal(false);
  readonly favoritePostIds = signal<Set<number>>(new Set());
  readonly sharedPostIds = signal<Set<number>>(new Set());
  readonly bazedPostIds = signal<Set<number>>(new Set());

  toggleWorkspacePostFavorite(): void {
    this.isWorkspacePostFavorite.update((isFavorite) => !isFavorite);
  }

  isPostShared(postId: number): boolean {
    return this.sharedPostIds().has(postId);
  }

  sharePost(postId: number): void {
    this.sharedPostIds.update((postIds) => new Set(postIds).add(postId));
  }

  isPostFavorite(postId: number): boolean {
    return this.favoritePostIds().has(postId);
  }

  togglePostFavorite(postId: number): boolean {
    const nextIsFavorite = !this.favoritePostIds().has(postId);

    this.favoritePostIds.update((postIds) => {
      const nextPostIds = new Set(postIds);
      nextIsFavorite ? nextPostIds.add(postId) : nextPostIds.delete(postId);
      return nextPostIds;
    });

    return nextIsFavorite;
  }

  hasPostBaze(postId: number): boolean {
    return this.bazedPostIds().has(postId);
  }

  togglePostBaze(postId: number): boolean {
    const nextHasBaze = !this.bazedPostIds().has(postId);

    this.bazedPostIds.update((postIds) => {
      const nextPostIds = new Set(postIds);
      nextHasBaze ? nextPostIds.add(postId) : nextPostIds.delete(postId);
      return nextPostIds;
    });

    return nextHasBaze;
  }
}
