import { Component, signal } from '@angular/core';
import { Preferences } from '../../core/preferences';

@Component({
  selector: 'app-visitor-profile',
  imports: [],
  templateUrl: './visitor-profile.html'
})
export class VisitorProfile {
  protected readonly isFollowing = signal(false);

  constructor(protected readonly prefs: Preferences) {}

  protected toggleFollow(): void {
    this.isFollowing.update((value) => !value);
  }
}
