import { Component, OnInit } from '@angular/core';
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

  constructor(private readonly dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getKpis().subscribe((kpis) => {
      this.kpis = kpis;
    });
  }

}
