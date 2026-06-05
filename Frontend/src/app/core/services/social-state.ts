import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SocialState {
  readonly favoritePostIds = signal<Set<number>>(new Set());
  readonly sharedPostIds = signal<Set<number>>(new Set());

  isPostShared(postId: number): boolean {
    return this.sharedPostIds().has(postId);
  }

  togglePostShare(postId: number): boolean {
    const nextIsShared = !this.sharedPostIds().has(postId);

    this.sharedPostIds.update((postIds) => {
      const nextPostIds = new Set(postIds);
      nextIsShared ? nextPostIds.add(postId) : nextPostIds.delete(postId);
      return nextPostIds;
    });

    return nextIsShared;
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
}
