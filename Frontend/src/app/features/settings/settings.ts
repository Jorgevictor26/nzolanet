import { Component } from '@angular/core';
import { LanguageCode, Preferences } from '../../core/preferences';

@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.html'
})
export class Settings {
  constructor(protected readonly prefs: Preferences) {}

  protected changeLanguage(value: string): void {
    this.prefs.setLanguage(value === 'en' ? 'en' : 'pt');
  }

  protected changeTheme(value: string): void {
    this.prefs.setTheme(value === 'dark' ? 'dark' : 'light');
  }

  protected currentLanguage(): LanguageCode {
    return this.prefs.language();
  }

  protected currentTheme(): 'light' | 'dark' {
    return this.prefs.isDarkMode() ? 'dark' : 'light';
  }
}
