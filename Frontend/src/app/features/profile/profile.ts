import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html'
})
export class Profile {
  protected readonly isProfileEditorOpen = signal(false);

  protected openProfileEditor(): void {
    this.isProfileEditorOpen.set(true);
  }

  protected closeProfileEditor(): void {
    this.isProfileEditorOpen.set(false);
  }
}
