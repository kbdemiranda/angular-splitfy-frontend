import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import { UserCreateRequest } from '../../../shared/models/users.model';

@Component({
  selector: 'app-register',
  templateUrl: './register-component.html',
  styleUrl: './register-component.scss',
  standalone: false,
})
export class RegisterComponent {
  readonly form: FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
    password: FormControl<string>;
    confirmPassword: FormControl<string>;
  }>;

  submitting = false;
  success = false;
  errorMessage: string | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.form = this.formBuilder.nonNullable.group(
      {
        name: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: [this.passwordsMatchValidator] },
    );

    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/dashboard']);
    }
  }

  submit(): void {
    if (this.submitting) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.submitting = true;
    this.errorMessage = null;

    this.usersService
      .create(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.success = true;
          setTimeout(() => {
            void this.router.navigate(['/login']);
          }, 1200);
        },
        error: () => {
          this.errorMessage = 'register.error_default';
        },
      });
  }

  private buildPayload(): UserCreateRequest {
    const { name, email, password } = this.form.getRawValue();
    return {
      name: name.trim(),
      email: email.trim(),
      password,
      profileName: 'USER',
      enabled: true,
    };
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    if (!(control instanceof FormGroup)) {
      return null;
    }

    const group = control;
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
  }
}
