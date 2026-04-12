import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    service = new TokenStorageService();
  });

  it('stores and retrieves session and token', () => {
    const session = {
      token: 'abc',
      tokenType: 'Bearer',
      expiresInMs: 1000,
      userId: '1',
      email: 'a@a.com',
      profile: 'ADMIN' as const,
      expiresAt: Date.now() + 1000,
    };

    service.setSession(session);

    expect(service.getSession()).toEqual(session);
    expect(service.getToken()).toBe('abc');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('handles corrupted storage and expired sessions', () => {
    localStorage.setItem('splitfy.auth.session', '{bad json');
    expect(service.getSession()).toBeNull();

    service.setSession({
      token: 'abc',
      tokenType: 'Bearer',
      expiresInMs: 1,
      userId: '1',
      email: 'a@a.com',
      profile: 'ADMIN',
      expiresAt: Date.now() - 1,
    });

    expect(service.isAuthenticated()).toBe(false);
    service.clearSession();
    expect(service.getToken()).toBeNull();
  });
});
