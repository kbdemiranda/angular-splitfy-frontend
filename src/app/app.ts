import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly publicRoutes = ['/login', '/register'];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.themeService.init();
  }

  get showNavbar(): boolean {
    return this.authService.isAuthenticated() && !this.publicRoutes.some((route) => this.router.url.startsWith(route));
  }
}
