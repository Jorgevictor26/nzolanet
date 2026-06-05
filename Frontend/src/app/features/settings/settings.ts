import { Component } from '@angular/core';
import { Feedback } from '../../core/feedback';
import { LanguageCode, Preferences } from '../../core/preferences';

@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.html'
})
export class Settings {
  constructor(
    private readonly feedback: Feedback,
    protected readonly prefs: Preferences
  ) {}

}
