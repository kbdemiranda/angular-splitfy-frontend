import { ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { LoginComponent } from './login-component';

describe('LoginComponent', () => {
  const setup = (isAuthenticated = false) => {
    const authService = {
      isAuthenticated: jest.fn().mockReturnValue(isAuthenticated),
      login: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;
    const router = { navigate: jest.fn().mockResolvedValue(true) } as unknown as Router;
    const ngZone = { run: (cb: () => void) => cb() } as NgZone;
    const cdr = { detectChanges: jest.fn() } as unknown as ChangeDetectorRef;

    const component = new LoginComponent(new FormBuilder(), authService, router, ngZone, cdr);
    return { component, authService, router, cdr };
  };

  it('redirects from constructor when user is already authenticated', () => {
    const { router } = setup(true);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('marks form as touched when invalid', () => {
    const { component, authService } = setup(false);
    component.form.patchValue({ email: 'invalid', password: '' });

    component.submit();

    expect(authService.login).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('logs in and redirects on success', () => {
    const { component, authService, router, cdr } = setup(false);
    (authService.login as jest.Mock).mockReturnValue(of({}));

    component.form.patchValue({ email: 'admin@splitfy.local', password: 'admin' });
    component.submit();

    expect(authService.login).toHaveBeenCalled();
    expect(component.submitting).toBe(false);
    expect(component.invalidLogin).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(cdr.detectChanges).toHaveBeenCalled();
  });

  it('shows invalid login on error', () => {
    const { component, authService, cdr } = setup(false);
    (authService.login as jest.Mock).mockReturnValue(throwError(() => new Error('401')));

    component.form.patchValue({ email: 'admin@splitfy.local', password: 'wrong' });
    component.submit();

    expect(component.invalidLogin).toBe(true);
    expect(component.submitting).toBe(false);
    expect(cdr.detectChanges).toHaveBeenCalled();
  });
});
