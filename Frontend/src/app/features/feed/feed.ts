import { Component, signal } from '@angular/core';
import { SocialState } from '../../core/social-state';
import { Preferences } from '../../core/preferences';

@Component({
  selector: 'app-feed',
  imports: [],
  templateUrl: './feed.html'
})
export class Feed {
  protected readonly isComposerOpen = signal(false);

  constructor(
    protected readonly socialState: SocialState,
    protected readonly prefs: Preferences
  ) {}

  protected openComposer(): void {
    this.isComposerOpen.set(true);
  }

  protected closeComposer(): void {
    this.isComposerOpen.set(false);
  }

  protected toggleWorkspacePostFavorite(): void {
    this.socialState.toggleWorkspacePostFavorite();
  }
}
