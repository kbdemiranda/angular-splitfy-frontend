import { Injectable } from '@angular/core';
import { AuthSession } from '../../shared/models/auth.model';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly storageKey = 'splitfy.auth.session';

  getSession(): AuthSession | null {
    const value = localStorage.getItem(this.storageKey);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as AuthSession;
    } catch {
      this.clearSession();
      return null;
    }
  }

  setSession(session: AuthSession): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  clearSession(): void {
    localStorage.removeItem(this.storageKey);
  }

  getToken(): string | null {
    return this.getSession()?.token ?? null;
  }

  isAuthenticated(): boolean {
    const session = this.getSession();
    if (!session) {
      return false;
    }

    return session.expiresAt > Date.now();
  }
}
