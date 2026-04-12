import { selectors } from '../../../support/selectors';

describe('Auth - Access control', () => {
  const sessionStorageKey = 'splitfy.auth.session';

  const buildSession = (expiresAt = Date.now() + 3_600_000) => ({
    token: 'mock-jwt-token-e2e',
    tokenType: 'Bearer',
    expiresInMs: 3_600_000,
    expiresAt,
    userId: 'c0d3x-1111-4c7a-8f2b-111111111111',
    email: 'admin@splitfy.app',
    profile: 'ADMIN',
  });

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('redirects unauthenticated users to login when accessing a protected route', () => {
    cy.visit('/dashboard');

    cy.location('pathname').should('eq', '/login');
    cy.get(selectors.auth.form).should('be.visible');
  });

  it('redirects users with expired session to login', () => {
    cy.visit('/dashboard', {
      onBeforeLoad(window) {
        window.localStorage.setItem(sessionStorageKey, JSON.stringify(buildSession(Date.now() - 120_000)));
      },
    });

    cy.location('pathname').should('eq', '/login');
  });

  it('allows authenticated users to access dashboard', () => {
    cy.stubDashboard();

    cy.visit('/dashboard', {
      onBeforeLoad(window) {
        window.localStorage.setItem(sessionStorageKey, JSON.stringify(buildSession()));
      },
    });

    cy.wait('@dashboardKpis');
    cy.location('pathname').should('eq', '/dashboard');
    cy.get(selectors.dashboard.page).should('be.visible');
    cy.get('[data-cy="navbar"]').should('be.visible');
  });

  it('clears session and redirects to login on global 401', () => {
    cy.on('uncaught:exception', (error) => {
      if (error.message.includes('401 Unauthorized')) {
        return false;
      }
      return true;
    });

    cy.intercept('GET', '**/api/dashboard/kpis*', {
      statusCode: 401,
      body: { message: 'Unauthorized' },
    }).as('dashboard401');

    cy.visit('/dashboard', {
      onBeforeLoad(window) {
        window.localStorage.setItem(sessionStorageKey, JSON.stringify(buildSession()));
      },
    });

    cy.wait('@dashboard401');
    cy.location('pathname').should('eq', '/login');
    cy.window().its('localStorage').invoke('getItem', sessionStorageKey).should('be.null');
  });

  it('logs out from desktop navigation', () => {
    cy.stubDashboard();
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
    cy.stubDashboard();
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
