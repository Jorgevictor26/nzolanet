import { Component, signal } from '@angular/core';
import { SocialState } from '../../core/social-state';

@Component({
  selector: 'app-feed',
  imports: [],
  templateUrl: './feed.html'
})
export class Feed {
  protected readonly isComposerOpen = signal(false);

  constructor(protected readonly socialState: SocialState) {}

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
