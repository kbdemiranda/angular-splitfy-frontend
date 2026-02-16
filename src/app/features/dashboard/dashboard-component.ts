import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardKpiResponse } from '../../shared/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss',
  standalone: false,
})
export class DashboardComponent implements OnInit {
  kpis: DashboardKpiResponse | null = null;

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.dashboardService.getKpis().subscribe((kpis) => {
      this.kpis = kpis;
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        void this.router.navigate(['/login']);
      },
      error: () => {
        this.authService.clearSession();
        void this.router.navigate(['/login']);
      },
    });
  }
}
