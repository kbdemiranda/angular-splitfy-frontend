import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  it('allows route activation when user is authenticated', () => {
    const authService = { isAuthenticated: jest.fn().mockReturnValue(true) } as unknown as AuthService;
    const router = { createUrlTree: jest.fn() } as unknown as Router;

    const guard = new AuthGuard(authService, router);

    expect(guard.canActivate()).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects to login when user is not authenticated', () => {
    const urlTree = { redirected: true } as unknown as ReturnType<Router['createUrlTree']>;
    const authService = { isAuthenticated: jest.fn().mockReturnValue(false) } as unknown as AuthService;
    const router = { createUrlTree: jest.fn().mockReturnValue(urlTree) } as unknown as Router;

    const guard = new AuthGuard(authService, router);

    expect(guard.canActivate()).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
