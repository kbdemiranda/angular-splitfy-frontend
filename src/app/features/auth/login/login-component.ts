import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login-component.html',
  styleUrl: './login-component.scss',
  standalone: false,
})
export class LoginComponent {
  readonly form: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }>;

  errorMessage: string | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.form = this.formBuilder.nonNullable.group({
      email: ['admin@splitfy.app', [Validators.required, Validators.email]],
      password: ['123456', [Validators.required]],
    });

    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/dashboard']);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = null;

    this.authService
      .login(this.form.getRawValue())
      .subscribe({
        next: () => {
          void this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.errorMessage = 'Credenciais inválidas.';
        },
      });
  }
}
