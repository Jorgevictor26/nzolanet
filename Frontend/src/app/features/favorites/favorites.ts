import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SocialState } from '../../core/social-state';
import { Preferences } from '../../core/preferences';

@Component({
  selector: 'app-favorites',
  imports: [RouterLink],
  templateUrl: './favorites.html'
})
export class Favorites {
  constructor(
    protected readonly socialState: SocialState,
    protected readonly prefs: Preferences
  ) {}

  protected removeWorkspacePostFavorite(): void {
    this.socialState.isWorkspacePostFavorite.set(false);
  }
}
