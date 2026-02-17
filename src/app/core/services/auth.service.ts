import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { API_ROUTES } from '../constants/api-routes';
import { AuthSession, LoginRequest, LoginResponse } from '../../shared/models/auth.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionSubject: BehaviorSubject<AuthSession | null>;
  readonly session$: Observable<AuthSession | null>;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenStorage: TokenStorageService,
  ) {
    this.sessionSubject = new BehaviorSubject<AuthSession | null>(this.tokenStorage.getSession());
    this.session$ = this.sessionSubject.asObservable();
  }

  login(payload: LoginRequest): Observable<AuthSession> {
    return this.http.post<LoginResponse>(API_ROUTES.authLogin, payload).pipe(
      map((response) => ({
        ...response,
        expiresAt: Date.now() + response.expiresInMs,
      })),
      tap((session) => this.setSession(session)),
    );
  }

  logout(): Observable<void> {
    return this.http.post(API_ROUTES.authLogout, null).pipe(
      tap(() => this.clearSession()),
      map(() => void 0),
    );
  }

  clearSession(): void {
    this.tokenStorage.clearSession();
    this.sessionSubject.next(null);
  }

  isAuthenticated(): boolean {
    return this.tokenStorage.isAuthenticated();
  }

  getSession(): AuthSession | null {
    const session = this.tokenStorage.getSession();

    if (!session || session.expiresAt <= Date.now()) {
      this.clearSession();
      return null;
    }

    return session;
  }

  private setSession(session: AuthSession): void {
    this.tokenStorage.setSession(session);
    this.sessionSubject.next(session);
  }
}
