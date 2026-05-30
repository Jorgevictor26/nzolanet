import { Component, signal } from '@angular/core';
import { Preferences } from '../../core/preferences';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html'
})
export class Profile {
  constructor(protected readonly prefs: Preferences) {}

  protected readonly isProfileEditorOpen = signal(false);

  protected openProfileEditor(): void {
    this.isProfileEditorOpen.set(true);
  }

  protected closeProfileEditor(): void {
    this.isProfileEditorOpen.set(false);
  }
}
