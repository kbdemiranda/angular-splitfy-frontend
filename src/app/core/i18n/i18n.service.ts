import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  LANGUAGE_OPTIONS,
  STORAGE_KEY,
  TRANSLATIONS,
} from './translations';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly languageSubject = new BehaviorSubject<AppLanguage>(this.resolveInitialLanguage());
  readonly language$ = this.languageSubject.asObservable();

  constructor() {
    this.applyLanguage(this.languageSubject.value);
  }

  get currentLanguage(): AppLanguage {
    return this.languageSubject.value;
  }

  get languages() {
    return LANGUAGE_OPTIONS;
  }

  setLanguage(language: AppLanguage): void {
    if (!TRANSLATIONS[language]) {
      return;
    }

    this.languageSubject.next(language);
    this.applyLanguage(language);
    localStorage.setItem(STORAGE_KEY, language);
  }

  translate(key: string, params?: Record<string, string | number>): string {
    const language = this.languageSubject.value;
    const fallback = TRANSLATIONS[DEFAULT_LANGUAGE][key] ?? key;
    const template = TRANSLATIONS[language][key] ?? fallback;

    if (!params) {
      return template;
    }

    return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_value, token: string) => {
      const paramValue = params[token];
      return paramValue === undefined || paramValue === null ? '' : String(paramValue);
    });
  }

  localeForIntl(): string {
    return this.currentLanguage;
  }

  private resolveInitialLanguage(): AppLanguage {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (this.isSupportedLanguage(stored)) {
      return stored;
    }

    const browserLanguage = navigator.language?.toLowerCase() ?? '';
    if (browserLanguage.startsWith('pt')) {
      return 'pt-BR';
    }
    if (browserLanguage.startsWith('es')) {
      return 'es-419';
    }
    if (browserLanguage.startsWith('en')) {
      return 'en';
    }

    return DEFAULT_LANGUAGE;
  }

  private isSupportedLanguage(value: string | null): value is AppLanguage {
    return !!value && (value === 'pt-BR' || value === 'en' || value === 'es-419');
  }

  private applyLanguage(language: AppLanguage): void {
    document.documentElement.lang = language;
  }
}
