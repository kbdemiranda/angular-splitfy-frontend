describe('Login page', () => {
  const emailInput = '[data-cy="login-email"]';
  const passwordInput = '[data-cy="login-password"]';
  const submitButton = '[data-cy="login-submit"]';

  const validCredentials = {
    email: 'admin@splitfy.app',
    password: '123456',
  };

  const invalidCredentials = {
    email: 'invalid@splitfy.app',
    password: 'wrong-password',
  };

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/login');
  });

  it('logs in successfully and redirects to dashboard', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'mock-jwt-token-e2e',
        tokenType: 'Bearer',
        expiresInMs: 3_600_000,
        userId: 'c0d3x-1111-4c7a-8f2b-111111111111',
        email: validCredentials.email,
        profile: 'ADMIN',
      },
    }).as('loginRequest');

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

    cy.get(emailInput).should('be.visible').clear().type(validCredentials.email);
    cy.get(passwordInput).should('be.visible').clear().type(validCredentials.password, { log: false });
    cy.get(submitButton).should('be.enabled').click();

    cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);
    cy.wait('@dashboardKpis');
    cy.location('pathname').should('eq', '/dashboard');
  });

  it('shows an error message for invalid login', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' },
    }).as('loginRequest');

    cy.get(emailInput).should('be.visible').clear().type(invalidCredentials.email);
    cy.get(passwordInput).should('be.visible').clear().type(invalidCredentials.password, { log: false });
    cy.get(submitButton).should('be.enabled').click();

    cy.wait('@loginRequest').its('response.statusCode').should('eq', 401);
    cy.get('[data-cy="login-error"]').should('be.visible').and('contain', 'Login inválido');
    cy.location('pathname').should('eq', '/login');
  });
});
