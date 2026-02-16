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

  get totalStatusAmount(): number {
    if (!this.kpis) {
      return 0;
    }

    return this.kpis.totalPaid + this.kpis.totalPending + this.kpis.totalUnpaid;
  }

  get paidPercentage(): number {
    if (!this.kpis || this.totalStatusAmount === 0) {
      return 0;
    }

    return (this.kpis.totalPaid / this.totalStatusAmount) * 100;
  }

  get pendingPercentage(): number {
    if (!this.kpis || this.totalStatusAmount === 0) {
      return 0;
    }

    return (this.kpis.totalPending / this.totalStatusAmount) * 100;
  }

  get unpaidPercentage(): number {
    if (!this.kpis || this.totalStatusAmount === 0) {
      return 0;
    }

    return (this.kpis.totalUnpaid / this.totalStatusAmount) * 100;
  }

  get donutBackground(): string {
    if (!this.kpis || this.totalStatusAmount === 0) {
      return 'conic-gradient(#e2e8f0 0deg 360deg)';
    }

    const paidAngle = (this.kpis.totalPaid / this.totalStatusAmount) * 360;
    const pendingAngle = (this.kpis.totalPending / this.totalStatusAmount) * 360;
    const pendingStart = paidAngle;
    const pendingEnd = paidAngle + pendingAngle;

    return `conic-gradient(#16a34a 0deg ${paidAngle}deg, #f59e0b ${pendingStart}deg ${pendingEnd}deg, #ef4444 ${pendingEnd}deg 360deg)`;
  }

  get pendingByUsers(): Array<{ userName: string; pendingAmount: number; totalAmount: number }> {
    return [
      { userName: 'Ana', pendingAmount: 100, totalAmount: 100 },
      { userName: 'Alex', pendingAmount: 20.1, totalAmount: 20.1 },
      { userName: 'Carlos', pendingAmount: 20.1, totalAmount: 10.1 },
    ];
  }
}
