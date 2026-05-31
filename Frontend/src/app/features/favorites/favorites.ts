import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Feedback } from '../../core/feedback';
import { SocialState } from '../../core/social-state';
import { Preferences } from '../../core/preferences';

type FavoriteCollection = 'all' | 'work' | 'inspiration';

@Component({
  selector: 'app-favorites',
  imports: [RouterLink],
  templateUrl: './favorites.html'
})
export class Favorites {
  constructor(
    private readonly feedback: Feedback,
    protected readonly socialState: SocialState,
    protected readonly prefs: Preferences
  ) {}

  protected readonly activeCollection = signal<FavoriteCollection>('all');
  protected readonly visibleFavoriteCount = computed(() => {
    if (!this.socialState.isWorkspacePostFavorite()) {
      return 0;
    }

    return this.activeCollection() === 'inspiration' ? 0 : 1;
  });

  protected setCollection(collection: FavoriteCollection): void {
    this.activeCollection.set(collection);
    this.feedback.show('Coleção selecionada.', 'info');
  }

  protected removeWorkspacePostFavorite(): void {
    this.socialState.isWorkspacePostFavorite.set(false);
    this.feedback.show('Publicação removida dos favoritos.', 'info');
  }
}
