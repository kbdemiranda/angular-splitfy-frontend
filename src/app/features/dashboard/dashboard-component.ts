import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardDebtorItem, DashboardKpiResponse } from '../../shared/models/dashboard.model';
import { finalize } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss',
  standalone: false,
})
export class DashboardComponent implements OnInit {
  kpis: DashboardKpiResponse | null = null;
  isLoading = false;
  selectedReferenceMonth = this.getCurrentMonth();
  debtorPageSize = 5;
  currentDebtorPage = 1;

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly i18nService: I18nService,
  ) {}

  ngOnInit(): void {
    this.loadKpis(this.selectedReferenceMonth);
  }

  loadPreviousMonth(): void {
    this.selectedReferenceMonth = this.shiftMonth(this.selectedReferenceMonth, -1);
    this.loadKpis(this.selectedReferenceMonth);
  }

  loadNextMonth(): void {
    this.selectedReferenceMonth = this.shiftMonth(this.selectedReferenceMonth, 1);
    this.loadKpis(this.selectedReferenceMonth);
  }

  onReferenceMonthChange(referenceMonth: string): void {
    if (!referenceMonth) {
      return;
    }

    this.selectedReferenceMonth = referenceMonth;
    this.loadKpis(referenceMonth);
  }

  goToPreviousDebtorsPage(): void {
    if (this.currentDebtorPage <= 1) {
      return;
    }

    this.currentDebtorPage -= 1;
  }

  goToNextDebtorsPage(): void {
    if (this.currentDebtorPage >= this.totalDebtorPages) {
      return;
    }

    this.currentDebtorPage += 1;
  }

  private loadKpis(referenceMonth: string): void {
    this.isLoading = true;

    this.dashboardService
      .getKpis(referenceMonth)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (kpis) => {
          this.kpis = {
            ...kpis,
            debtors: kpis.debtors ?? [],
          };
          this.selectedReferenceMonth = kpis.referenceMonth || this.selectedReferenceMonth;
          this.currentDebtorPage = 1;
          this.changeDetectorRef.markForCheck();
        },
      });
  }

  get referenceMonthLabel(): string {
    const [year, month] = this.selectedReferenceMonth.split('-').map(Number);

    if (!year || !month) {
      return this.selectedReferenceMonth;
    }

    return new Intl.DateTimeFormat(this.i18nService.localeForIntl(), { month: 'long', year: 'numeric' }).format(
      new Date(year, month - 1, 1),
    );
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

  get totalDebtorPages(): number {
    if (!this.kpis?.debtors?.length) {
      return 1;
    }

    return Math.ceil(this.kpis.debtors.length / this.debtorPageSize);
  }

  get debtorCount(): number {
    return this.kpis?.debtors?.length ?? 0;
  }

  get debtorsPageItems(): DashboardDebtorItem[] {
    if (!this.kpis?.debtors?.length) {
      return [];
    }

    const startIndex = (this.currentDebtorPage - 1) * this.debtorPageSize;
    return this.kpis.debtors.slice(startIndex, startIndex + this.debtorPageSize);
  }

  private getCurrentMonth(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  }

  private shiftMonth(referenceMonth: string, offset: number): string {
    const [year, month] = referenceMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    const shiftedMonth = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${date.getFullYear()}-${shiftedMonth}`;
  }
}
