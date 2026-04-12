import { selectors } from '../../support/selectors';

describe('Smoke - real backend', () => {
  const email = Cypress.env('SMOKE_EMAIL') || 'admin@splitfy.local';
  const password = Cypress.env('SMOKE_PASSWORD') || 'admin';

  it('logs in and navigates to core authenticated pages', () => {
    cy.visit('/login');

    cy.get(selectors.auth.email).clear().type(email);
    cy.get(selectors.auth.password).clear().type(password, { log: false });
    cy.get(selectors.auth.submit).click();

    cy.location('pathname', { timeout: 20_000 }).should('eq', '/dashboard');
    cy.get(selectors.dashboard.page).should('be.visible');

    cy.get('[data-cy="navbar-link-subscriber"]').click();
    cy.location('pathname').should('eq', '/subscriber');
    cy.get(selectors.subscribers.page).should('be.visible');

    cy.get('[data-cy="navbar-link-billing-charges"]').click();
    cy.location('pathname').should('eq', '/billing-charges');
    cy.get(selectors.billing.page).should('be.visible');
  });
});
