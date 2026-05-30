import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly isComposerOpen = signal(false);
  protected readonly isProfileEditorOpen = signal(false);

  protected openComposer(): void {
    this.isComposerOpen.set(true);
  }

  protected closeComposer(): void {
    this.isComposerOpen.set(false);
  }

  protected openProfileEditor(): void {
    this.isProfileEditorOpen.set(true);
  }

  protected closeProfileEditor(): void {
    this.isProfileEditorOpen.set(false);
  }
}
