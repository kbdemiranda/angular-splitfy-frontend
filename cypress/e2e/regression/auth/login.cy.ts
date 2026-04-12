import { selectors } from '../../../support/selectors';

describe('Auth - Login page', () => {
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

  it('shows form validation and keeps submit disabled while form is invalid', () => {
    cy.get(selectors.auth.submit).should('be.enabled');
    cy.get(selectors.auth.email).clear().type('invalid-email').blur();
    cy.get(selectors.auth.password).clear().blur();

    cy.get(selectors.auth.form).within(() => {
      cy.contains('E-mail inválido.').should('be.visible');
      cy.contains('Senha obrigatória.').should('be.visible');
    });
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

    cy.stubDashboard();

    cy.get(selectors.auth.email).clear().type(validCredentials.email);
    cy.get(selectors.auth.password).clear().type(validCredentials.password, { log: false });
    cy.get(selectors.auth.submit).click();

    cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);
    cy.wait('@dashboardKpis');
    cy.location('pathname').should('eq', '/dashboard');
  });

  it('shows loading state while requesting login', () => {
    cy.intercept('POST', '**/api/auth/login', {
      delay: 800,
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

    cy.stubDashboard();

    cy.get(selectors.auth.email).clear().type(validCredentials.email);
    cy.get(selectors.auth.password).clear().type(validCredentials.password, { log: false });
    cy.get(selectors.auth.submit).click();

    cy.get(selectors.auth.submit).should('be.disabled').and('contain', 'Entrando');
    cy.wait('@loginRequest');
    cy.wait('@dashboardKpis');
    cy.location('pathname').should('eq', '/dashboard');
  });

  it('shows an error message for invalid login', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' },
    }).as('loginRequest');

    cy.get(selectors.auth.email).clear().type(invalidCredentials.email);
    cy.get(selectors.auth.password).clear().type(invalidCredentials.password, { log: false });
    cy.get(selectors.auth.submit).click();

    cy.wait('@loginRequest').its('response.statusCode').should('eq', 401);
    cy.get(selectors.auth.error).should('be.visible').and('contain', 'Login inválido');
    cy.location('pathname').should('eq', '/login');
  });
});
