import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Preferences } from '../../core/preferences';

@Component({
  selector: 'app-favorites',
  imports: [RouterLink],
  templateUrl: './favorites.html'
})
export class Favorites {
  constructor(protected readonly prefs: Preferences) {}
}
