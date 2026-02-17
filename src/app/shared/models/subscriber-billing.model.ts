export interface SubscriberBillingItem {
  serviceId: number;
  serviceName: string;
  billingCycle: string;
  serviceCurrency: string;
  serviceMonthlyAmount: number;
  participantsCount: number;
  userMonthlyShare: number;
  serviceMonthlyAmountOriginal: number | null;
  userMonthlyShareOriginal: number | null;
  exchangeRateToBrl: number | null;
  exchangeRateDate: string | null;
  paymentStatus: string;
}

export interface SubscriberBillingResponse {
  userId: number;
  referenceMonth: string;
  items: SubscriberBillingItem[];
  totalMonthlyDue: number;
  currency: string;
}
