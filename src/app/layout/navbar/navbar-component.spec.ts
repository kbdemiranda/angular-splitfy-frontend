import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NavbarComponent } from './navbar-component';

describe('NavbarComponent', () => {
  const setup = () => {
    const authService = {
      logout: jest.fn(),
      clearSession: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;
    const router = { navigate: jest.fn().mockResolvedValue(true) } as unknown as Router;
    const component = new NavbarComponent(authService, router);
    return { component, authService, router };
  };

  it('toggles and closes mobile menu', () => {
    const { component } = setup();

    component.toggleMenu();
    expect(component.isMenuOpen).toBe(true);

    component.closeMenu();
    expect(component.isMenuOpen).toBe(false);
  });

  it('logs out successfully and redirects', () => {
    const { component, authService, router } = setup();
    (authService.logout as jest.Mock).mockReturnValue(of(void 0));

    component.toggleMenu();
    component.logout();

    expect(authService.logout).toHaveBeenCalled();
    expect(component.isMenuOpen).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('clears session and redirects when logout fails', () => {
    const { component, authService, router } = setup();
    (authService.logout as jest.Mock).mockReturnValue(throwError(() => new Error('boom')));

    component.logout();

    expect(authService.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
