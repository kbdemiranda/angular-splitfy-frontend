import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  Cloud,
  LayoutDashboard,
  LogOut,
  LucideAngularModule,
  LucideIconData,
  Menu,
  Settings,
  Users,
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIconData;
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar-component.html',
  styleUrl: './navbar-component.scss',
  standalone: false,
})
export class NavbarComponent {
  readonly icons = {
    menu: Menu,
    logout: LogOut,
  };

  readonly navItems: NavItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      path: '/users',
      label: 'Assinantes',
      icon: Users,
    },
    {
      path: '/platforms',
      label: 'Plataformas',
      icon: Cloud,
    },
    {
      path: '/settings',
      label: 'Configurações',
      icon: Settings,
    },
  ];

  isMenuOpen = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.closeMenu();
        void this.router.navigate(['/login']);
      },
      error: () => {
        this.authService.clearSession();
        this.closeMenu();
        void this.router.navigate(['/login']);
      },
    });
  }
}

export const LUCIDE_ICONS = LucideAngularModule.pick({
  Menu,
  LogOut,
  LayoutDashboard,
  Users,
  Cloud,
  Settings,
});
