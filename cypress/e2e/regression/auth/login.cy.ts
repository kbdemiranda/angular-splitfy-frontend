import { selectors } from '../../../support/selectors';

describe('Auth - Login page', () => {
  const EMAIL_INVALID_MESSAGE = /E-mail inválido\.|Invalid e-mail\./i;
  const LOGIN_INVALID_MESSAGE = /Login inválido|Invalid login/i;
  const LOGIN_LOADING_LABEL = /Entrando|Signing in/i;

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
    cy.get('body').should('not.have.descendants', '[part="backdrop"]');
  });

  it('shows form validation and keeps submit disabled while form is invalid', () => {
    cy.get(selectors.auth.submit).should('be.enabled');
    cy.get(selectors.auth.email).clear().type('invalid-email').blur();
    cy.get(selectors.auth.submit).click({ force: true });

    cy.get(selectors.auth.form).within(() => {
      cy.contains(EMAIL_INVALID_MESSAGE).should('be.visible');
    });
    cy.location('pathname').should('eq', '/login');
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
      delay: 5_000,
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

    cy.get(selectors.auth.submit)
      .should('be.disabled')
      .invoke('text')
      .should('match', LOGIN_LOADING_LABEL);
    cy.wait('@loginRequest');
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
    cy.get(selectors.auth.error).should('be.visible').invoke('text').should('match', LOGIN_INVALID_MESSAGE);
    cy.location('pathname').should('eq', '/login');
  });
});
