export const API_ROUTES = {
  authLogin: '/auth/login',
  authLogout: '/auth/logout',
  dashboardKpis: '/dashboard/kpis',
  platforms: '/platforms',
  platformById: (id: number | string) => `/platforms/${id}`,
  subscribers: '/subscribers',
  subscriberById: (id: number | string) => `/subscribers/${id}`,
  subscriberSubscriptions: (id: number | string) => `/subscribers/${id}/subscriptions`,
  subscriberBilling: (id: number | string) => `/billing/${id}`,
  paymentConfirmations: '/subscribers/payments/confirmations',
  approvePaymentConfirmation: (id: number | string) => `/subscribers/payments/confirmations/${id}/approve`,
  pendingPaymentConfirmations: '/subscribers/payments/confirmations/pending',
} as const;
