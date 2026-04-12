import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenStorage: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, TokenStorageService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorageService);
  });

  afterEach(() => httpMock.verify());

  it('logs in, enriches session and persists it', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);
    const loginPromise = firstValueFrom(service.login({ email: 'admin@splitfy.local', password: 'admin' }));

    httpMock.expectOne('/auth/login').flush({
      token: 'abc',
      tokenType: 'Bearer',
      expiresInMs: 60000,
      userId: '1',
      email: 'admin@splitfy.local',
      profile: 'ADMIN',
    });

    await expect(loginPromise).resolves.toMatchObject({
      token: 'abc',
      expiresAt: 61000,
    });

    expect(tokenStorage.getToken()).toBe('abc');
    nowSpy.mockRestore();
  });

  it('clears expired sessions and returns null from getSession', () => {
    tokenStorage.setSession({
      token: 'abc',
      tokenType: 'Bearer',
      expiresInMs: 1,
      userId: '1',
      email: 'a@a.com',
      profile: 'ADMIN',
      expiresAt: Date.now() - 10,
    });

    expect(service.getSession()).toBeNull();
    expect(tokenStorage.getSession()).toBeNull();
  });

  it('logs out and clears local session', async () => {
    tokenStorage.setSession({
      token: 'abc',
      tokenType: 'Bearer',
      expiresInMs: 1000,
      userId: '1',
      email: 'a@a.com',
      profile: 'ADMIN',
      expiresAt: Date.now() + 1000,
    });

    const logoutPromise = firstValueFrom(service.logout());
    httpMock.expectOne('/auth/logout').flush({});

    await expect(logoutPromise).resolves.toBeUndefined();
    expect(tokenStorage.getSession()).toBeNull();
  });

  it('returns active session and delegated auth state', () => {
    tokenStorage.setSession({
      token: 'abc',
      tokenType: 'Bearer',
      expiresInMs: 1000,
      userId: '1',
      email: 'a@a.com',
      profile: 'ADMIN',
      expiresAt: Date.now() + 10000,
    });

    expect(service.getSession()).toMatchObject({ token: 'abc' });
    expect(service.isAuthenticated()).toBe(true);
  });
});
