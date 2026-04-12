import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import { RegisterComponent } from './register-component';

describe('RegisterComponent', () => {
  const setup = (isAuthenticated = false) => {
    const usersService = {
      create: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    const authService = {
      isAuthenticated: jest.fn().mockReturnValue(isAuthenticated),
    } as unknown as AuthService;

    const router = {
      navigate: jest.fn().mockResolvedValue(true),
    } as unknown as Router;

    const component = new RegisterComponent(new FormBuilder(), usersService, authService, router);
    return { component, usersService, router };
  };

  it('redirects authenticated users from constructor', () => {
    const { router } = setup(true);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('validates password mismatch and invalid form submit', () => {
    const { component, usersService } = setup(false);

    component.form.patchValue({
      name: 'John Doe',
      email: 'john@example.com',
      password: '12345678',
      confirmPassword: '87654321',
    });

    expect(component.form.valid).toBe(false);
    expect(component.form.errors).toEqual({ passwordMismatch: true });

    component.submit();
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('creates user and redirects to login on success', () => {
    jest.useFakeTimers();
    const { component, usersService, router } = setup(false);
    (usersService.create as jest.Mock).mockReturnValue(of({ ok: true }));

    component.form.patchValue({
      name: '  John Doe  ',
      email: 'john@example.com',
      password: '12345678',
      confirmPassword: '12345678',
    });

    component.submit();

    expect(usersService.create).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      password: '12345678',
      profileName: 'USER',
      enabled: true,
    });
    expect(component.success).toBe(true);

    jest.runAllTimers();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    jest.useRealTimers();
  });

  it('shows default error when create fails', () => {
    const { component, usersService } = setup(false);
    (usersService.create as jest.Mock).mockReturnValue(throwError(() => new Error('failed')));

    component.form.patchValue({
      name: 'John Doe',
      email: 'john@example.com',
      password: '12345678',
      confirmPassword: '12345678',
    });

    component.submit();

    expect(component.errorMessage).toBe('register.error_default');
    expect(component.submitting).toBe(false);
  });
});
