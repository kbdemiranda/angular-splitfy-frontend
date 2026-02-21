export interface PendingByPlatformItem {
  platformId: number;
  platformName: string;
  pendingCount: number;
  pendingAmount: number;
}

export interface DashboardDebtorItem {
  subscriberId: number;
  subscriberName: string;
  subscriberEmail: string;
  pendingAmount: number;
  unpaidAmount: number;
  totalDebt: number;
}

export interface DashboardKpiResponse {
  referenceMonth: string;
  currency: string;
  totalDue: number;
  totalPaid: number;
  totalPending: number;
  totalUnpaid: number;
  delinquencyRate: number;
  pendingByPlatform: PendingByPlatformItem[];
  debtors: DashboardDebtorItem[];
}
