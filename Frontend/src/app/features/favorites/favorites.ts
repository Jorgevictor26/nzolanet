import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SocialState } from '../../core/social-state';

@Component({
  selector: 'app-favorites',
  imports: [RouterLink],
  templateUrl: './favorites.html'
})
export class Favorites {
  constructor(protected readonly socialState: SocialState) {}

  protected removeWorkspacePostFavorite(): void {
    this.socialState.isWorkspacePostFavorite.set(false);
  }
}
