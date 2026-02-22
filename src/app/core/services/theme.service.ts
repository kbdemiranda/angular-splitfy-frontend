import { Injectable } from '@angular/core';

export type ThemeMode = 'dark' | 'light';
export type ThemePalette = 'default' | 'dracula' | 'indigo' | 'emerald' | 'sunset' | 'graphite';

export interface ThemeSettings {
  mode: ThemeMode;
  palette: ThemePalette;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'splitfy.app.theme';

  get current(): ThemeSettings {
    return this.readSettings();
  }

  init(): void {
    this.applyTheme(this.readSettings());
  }

  setTheme(settings: ThemeSettings): void {
    this.persistSettings(settings);
    this.applyTheme(settings);
  }

  private readSettings(): ThemeSettings {
    const fallback: ThemeSettings = { mode: 'dark', palette: 'default' };
    const value = localStorage.getItem(this.storageKey);
    if (!value) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(value) as Partial<ThemeSettings>;
      const mode: ThemeMode = parsed.mode === 'light' ? 'light' : 'dark';
      const palette: ThemePalette = this.isPalette(parsed.palette) ? parsed.palette : 'default';
      return { mode, palette };
    } catch {
      return fallback;
    }
  }

  private persistSettings(settings: ThemeSettings): void {
    localStorage.setItem(this.storageKey, JSON.stringify(settings));
  }

  private applyTheme(settings: ThemeSettings): void {
    document.documentElement.dataset['themeMode'] = settings.mode;
    document.documentElement.dataset['themePalette'] = settings.palette;
    document.documentElement.style.colorScheme = settings.mode;
  }

  private isPalette(value: unknown): value is ThemePalette {
    return (
      value === 'default' ||
      value === 'dracula' ||
      value === 'indigo' ||
      value === 'emerald' ||
      value === 'sunset' ||
      value === 'graphite'
    );
  }
}
