import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { DashboardService } from '../../core/services/dashboard.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { DashboardComponent } from './dashboard-component';

describe('DashboardComponent', () => {
  const kpiResponse = {
    referenceMonth: '2026-04',
    currency: 'BRL',
    totalDue: 200,
    totalPaid: 100,
    totalPending: 60,
    totalUnpaid: 40,
    delinquencyRate: 50,
    pendingByPlatform: [],
    debtors: [
      {
        subscriberId: 1,
        subscriberName: 'A',
        subscriberEmail: 'a@a.com',
        pendingAmount: 10,
        unpaidAmount: 20,
        totalDebt: 30,
      },
    ],
  };

  const setup = () => {
    const dashboardService = { getKpis: jest.fn().mockReturnValue(of(kpiResponse)) } as unknown as jest.Mocked<DashboardService>;
    const cdr = { markForCheck: jest.fn() } as unknown as ChangeDetectorRef;
    const i18nService = { localeForIntl: jest.fn().mockReturnValue('pt-BR') } as unknown as I18nService;
    const component = new DashboardComponent(dashboardService, cdr, i18nService);
    return { component, dashboardService, cdr };
  };

  it('loads KPIs on init and computes status percentages', () => {
    const { component, dashboardService } = setup();
    component.ngOnInit();

    expect(dashboardService.getKpis).toHaveBeenCalled();
    expect(component.kpis?.referenceMonth).toBe('2026-04');
    expect(component.totalStatusAmount).toBe(200);
    expect(component.paidPercentage).toBe(50);
    expect(component.pendingPercentage).toBe(50);
  });

  it('navigates debtor pagination safely', () => {
    const { component } = setup();
    component.ngOnInit();

    expect(component.totalDebtorPages).toBe(1);
    component.goToPreviousDebtorsPage();
    expect(component.currentDebtorPage).toBe(1);
    component.goToNextDebtorsPage();
    expect(component.currentDebtorPage).toBe(1);
  });

  it('changes month and reloads data', () => {
    const { component, dashboardService } = setup();

    component.onReferenceMonthChange('2026-03');
    component.loadPreviousMonth();
    component.loadNextMonth();

    expect(dashboardService.getKpis).toHaveBeenCalled();
  });

  it('returns default visuals when there is no KPI data', () => {
    const { component } = setup();
    component.kpis = null;

    expect(component.totalStatusAmount).toBe(0);
    expect(component.donutBackground).toContain('conic-gradient');
    expect(component.debtorsPageItems).toEqual([]);
    expect(component.debtorCount).toBe(0);
  });

  it('handles empty reference month change and invalid label parsing', () => {
    const { component, dashboardService } = setup();
    component.onReferenceMonthChange('');
    expect(dashboardService.getKpis).not.toHaveBeenCalled();

    component.selectedReferenceMonth = 'invalid-month';
    expect(component.referenceMonthLabel).toBe('invalid-month');
  });

  it('paginates debtors when there are multiple pages', () => {
    const { component } = setup();
    component.kpis = {
      ...kpiResponse,
      debtors: Array.from({ length: 12 }).map((_, idx) => ({
        subscriberId: idx,
        subscriberName: `S${idx}`,
        subscriberEmail: `s${idx}@a.com`,
        pendingAmount: idx,
        unpaidAmount: idx,
        totalDebt: idx * 2,
      })),
    };
    component.debtorPageSize = 5;
    component.currentDebtorPage = 1;

    expect(component.totalDebtorPages).toBe(3);
    component.goToNextDebtorsPage();
    expect(component.currentDebtorPage).toBe(2);
    expect(component.debtorsPageItems).toHaveLength(5);
    component.goToPreviousDebtorsPage();
    expect(component.currentDebtorPage).toBe(1);
  });
});
