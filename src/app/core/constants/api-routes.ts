export const API_ROUTES = {
  authLogin: '/auth/login',
  authLogout: '/auth/logout',
  dashboardKpis: '/dashboard/kpis',
  subscriberBilling: (id: number | string) => `/subscribers/${id}/billing`,
  paymentConfirmations: '/subscribers/payments/confirmations',
  approvePaymentConfirmation: (id: number | string) => `/subscribers/payments/confirmations/${id}/approve`,
  pendingPaymentConfirmations: '/subscribers/payments/confirmations/pending',
} as const;
