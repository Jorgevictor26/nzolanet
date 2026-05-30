import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SocialState {
  readonly isWorkspacePostFavorite = signal(false);
  readonly sharedPostIds = signal<Set<number>>(new Set());

  toggleWorkspacePostFavorite(): void {
    this.isWorkspacePostFavorite.update((isFavorite) => !isFavorite);
  }

  isPostShared(postId: number): boolean {
    return this.sharedPostIds().has(postId);
  }

  sharePost(postId: number): void {
    this.sharedPostIds.update((postIds) => new Set(postIds).add(postId));
  }
}
