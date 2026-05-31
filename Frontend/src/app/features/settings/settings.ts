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

  protected changeLanguage(value: string): void {
    this.prefs.setLanguage(value === 'en' ? 'en' : 'pt');
    this.feedback.show('Idioma atualizado.');
  }

  protected changeTheme(value: string): void {
    this.prefs.setTheme(value === 'dark' ? 'dark' : 'light');
    this.feedback.show('Tema atualizado.');
  }

  protected currentLanguage(): LanguageCode {
    return this.prefs.language();
  }

  protected currentTheme(): 'light' | 'dark' {
    return this.prefs.isDarkMode() ? 'dark' : 'light';
  }
}
