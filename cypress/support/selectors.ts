export const selectors = {
  auth: {
    form: '[data-cy="login-form"]',
    email: '[data-cy="login-email"]',
    password: '[data-cy="login-password"]',
    submit: '[data-cy="login-submit"]',
    error: '[data-cy="login-error"]',
  },
  dashboard: {
    page: '[data-cy="dashboard-page"]',
  },
  subscribers: {
    page: '[data-cy="subscribers-page"]',
    createButton: '[data-cy="subscribers-create-button"]',
    detailModal: '[data-cy="subscribers-detail-modal"]',
    editForm: '[data-cy="subscribers-edit-form"]',
    subscriptionsModal: '[data-cy="subscribers-subscriptions-modal"]',
    deleteModal: '[data-cy="subscribers-delete-modal"]',
  },
  billing: {
    page: '[data-cy="billing-page"]',
    detailModal: '[data-cy="billing-detail-modal"]',
    bulkModal: '[data-cy="billing-bulk-modal"]',
    registerModal: '[data-cy="billing-register-payment-modal"]',
  },
  settings: {
    page: '[data-cy="settings-page"]',
    usersCard: '[data-cy="settings-users-card"]',
    scheduleCard: '[data-cy="settings-schedule-card"]',
  },
};
