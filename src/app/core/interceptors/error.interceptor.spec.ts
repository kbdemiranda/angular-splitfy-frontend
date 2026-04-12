import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { ErrorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';

describe('ErrorInterceptor', () => {
  it('clears session and redirects on unauthorized non-login requests', (done) => {
    const authService = { clearSession: jest.fn() } as unknown as AuthService;
    const router = {
      url: '/dashboard',
      navigate: jest.fn().mockResolvedValue(true),
    } as unknown as Router;
    const interceptor = new ErrorInterceptor(authService, router);
    const next = {
      handle: jest.fn().mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
      ),
    };

    interceptor.intercept(new HttpRequest('GET', '/users'), next as never).subscribe({
      error: (error) => {
        expect(error.status).toBe(401);
        expect(authService.clearSession).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      },
    });
  });

  it('does not redirect when unauthorized happens on login request', (done) => {
    const authService = { clearSession: jest.fn() } as unknown as AuthService;
    const router = {
      url: '/login',
      navigate: jest.fn().mockResolvedValue(true),
    } as unknown as Router;
    const interceptor = new ErrorInterceptor(authService, router);
    const next = {
      handle: jest.fn().mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
      ),
    };

    interceptor.intercept(new HttpRequest('POST', '/auth/login'), next as never).subscribe({
      error: () => {
        expect(authService.clearSession).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
