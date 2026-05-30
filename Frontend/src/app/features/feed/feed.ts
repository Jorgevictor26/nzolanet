import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-feed',
  imports: [],
  templateUrl: './feed.html'
})
export class Feed {
  protected readonly isComposerOpen = signal(false);

  protected openComposer(): void {
    this.isComposerOpen.set(true);
  }

  protected closeComposer(): void {
    this.isComposerOpen.set(false);
  }
}
