import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SocialState {
  readonly isWorkspacePostFavorite = signal(false);

  toggleWorkspacePostFavorite(): void {
    this.isWorkspacePostFavorite.update((isFavorite) => !isFavorite);
  }
}
