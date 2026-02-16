import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss',
})
export class App {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  get showNavbar(): boolean {
    return this.authService.isAuthenticated() && !this.router.url.startsWith('/login');
  }
}
