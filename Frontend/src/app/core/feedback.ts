import { Injectable, signal } from '@angular/core';

export type FeedbackTone = 'success' | 'info';

export type FeedbackMessage = {
  id: number;
  text: string;
  tone: FeedbackTone;
};

@Injectable({
  providedIn: 'root'
})
export class Feedback {
  readonly messages = signal<FeedbackMessage[]>([]);

  show(text: string, tone: FeedbackTone = 'success'): void {
    const id = Date.now();

    this.messages.update((messages) => [...messages, { id, text, tone }]);
    window.setTimeout(() => this.dismiss(id), 2600);
  }

  dismiss(id: number): void {
    this.messages.update((messages) => messages.filter((message) => message.id !== id));
  }
}
