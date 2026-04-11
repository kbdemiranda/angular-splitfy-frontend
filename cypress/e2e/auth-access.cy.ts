describe('Authentication and access control', () => {
  const sessionStorageKey = 'splitfy.auth.session';

  const buildSession = () => ({
    token: 'mock-jwt-token-e2e',
    tokenType: 'Bearer',
    expiresInMs: 3_600_000,
    expiresAt: Date.now() + 3_600_000,
    userId: 'c0d3x-1111-4c7a-8f2b-111111111111',
    email: 'admin@splitfy.app',
    profile: 'ADMIN',
  });

  const stubDashboard = () => {
    cy.intercept('GET', '**/api/dashboard/kpis*', {
      statusCode: 200,
      body: {
        referenceMonth: '2026-04',
        currency: 'BRL',
        totalDue: 0,
        totalPaid: 0,
        totalPending: 0,
        totalUnpaid: 0,
        delinquencyRate: 0,
        pendingByPlatform: [],
        debtors: [],
      },
    }).as('dashboardKpis');
  };

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('redirects unauthenticated users to login when accessing a protected route', () => {
    cy.visit('/dashboard');

    cy.location('pathname').should('eq', '/login');
    cy.get('[data-cy="login-form"]').should('be.visible');
  });

  it('allows authenticated users to access dashboard', () => {
    stubDashboard();

    cy.visit('/dashboard', {
      onBeforeLoad(window) {
        window.localStorage.setItem(sessionStorageKey, JSON.stringify(buildSession()));
      },
    });

    cy.wait('@dashboardKpis');
    cy.location('pathname').should('eq', '/dashboard');
    cy.get('[data-cy="dashboard-page"]').should('be.visible');
    cy.get('[data-cy="navbar"]').should('be.visible');
  });

  it('logs out from desktop navigation', () => {
    stubDashboard();
    cy.intercept('POST', '**/api/auth/logout', { statusCode: 200, body: {} }).as('logoutRequest');

    cy.visit('/dashboard', {
      onBeforeLoad(window) {
        window.localStorage.setItem(sessionStorageKey, JSON.stringify(buildSession()));
      },
    });

    cy.wait('@dashboardKpis');
    cy.get('[data-cy="navbar-logout-desktop"]').click();

    cy.wait('@logoutRequest').its('response.statusCode').should('eq', 200);
    cy.location('pathname').should('eq', '/login');
    cy.window().its('localStorage').invoke('getItem', sessionStorageKey).should('be.null');
  });

  it('logs out from mobile navigation menu', () => {
    cy.viewport('iphone-x');
    stubDashboard();
    cy.intercept('POST', '**/api/auth/logout', { statusCode: 200, body: {} }).as('logoutRequest');

    cy.visit('/dashboard', {
      onBeforeLoad(window) {
        window.localStorage.setItem(sessionStorageKey, JSON.stringify(buildSession()));
      },
    });

    cy.wait('@dashboardKpis');
    cy.get('[data-cy="navbar-menu-toggle"]').click();
    cy.get('[data-cy="navbar-mobile-menu"]').should('be.visible');
    cy.get('[data-cy="navbar-logout-mobile"]').click();

    cy.wait('@logoutRequest').its('response.statusCode').should('eq', 200);
    cy.location('pathname').should('eq', '/login');
    cy.window().its('localStorage').invoke('getItem', sessionStorageKey).should('be.null');
  });
});
