import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
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

  invalidLogin = false;
  submitting = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly ngZone: NgZone,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {
    this.form = this.formBuilder.nonNullable.group({
      email: ['admin@splitfy.local', [Validators.required, Validators.email]],
      password: ['admin', [Validators.required]],
    });

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

    this.invalidLogin = false;
    this.submitting = true;

    this.authService
      .login(this.form.getRawValue())
      .subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.submitting = false;
            this.changeDetectorRef.detectChanges();
            void this.router.navigate(['/dashboard']);
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.invalidLogin = true;
            this.submitting = false;
            this.changeDetectorRef.detectChanges();
          });
        },
      });
  }
}
