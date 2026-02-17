export const API_ROUTES = {
  authLogin: '/auth/login',
  authLogout: '/auth/logout',
  dashboardKpis: '/dashboard/kpis',
  subscriberBilling: (id: number | string) => `/subscribers/${id}/billing`,
} as const;
