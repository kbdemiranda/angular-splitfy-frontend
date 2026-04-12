import { HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { AuthTokenInterceptor } from './auth-token.interceptor';
import { TokenStorageService } from '../services/token-storage.service';

describe('AuthTokenInterceptor', () => {
  it('does not add auth header to login request', (done) => {
    const tokenStorage = { getToken: jest.fn().mockReturnValue('abc') } as unknown as TokenStorageService;
    const interceptor = new AuthTokenInterceptor(tokenStorage);
    const next = { handle: jest.fn().mockReturnValue(of(new HttpResponse({ status: 200 }))) };

    interceptor.intercept(new HttpRequest('POST', '/auth/login'), next as never).subscribe(() => {
      const req = (next.handle as jest.Mock).mock.calls[0][0] as HttpRequest<unknown>;
      expect(req.headers.has('Authorization')).toBe(false);
      done();
    });
  });

  it('adds auth header when token exists and request is not login', (done) => {
    const tokenStorage = { getToken: jest.fn().mockReturnValue('token-123') } as unknown as TokenStorageService;
    const interceptor = new AuthTokenInterceptor(tokenStorage);
    const next = { handle: jest.fn().mockReturnValue(of(new HttpResponse({ status: 200 }))) };

    interceptor.intercept(new HttpRequest('GET', '/users'), next as never).subscribe(() => {
      const req = (next.handle as jest.Mock).mock.calls[0][0] as HttpRequest<unknown>;
      expect(req.headers.get('Authorization')).toBe('Bearer token-123');
      done();
    });
  });

  it('keeps request unchanged when token is absent', (done) => {
    const tokenStorage = { getToken: jest.fn().mockReturnValue(null) } as unknown as TokenStorageService;
    const interceptor = new AuthTokenInterceptor(tokenStorage);
    const next = { handle: jest.fn().mockReturnValue(of(new HttpResponse({ status: 200 }))) };

    interceptor.intercept(new HttpRequest('GET', '/users'), next as never).subscribe(() => {
      const req = (next.handle as jest.Mock).mock.calls[0][0] as HttpRequest<unknown>;
      expect(req.headers.has('Authorization')).toBe(false);
      done();
    });
  });
});
