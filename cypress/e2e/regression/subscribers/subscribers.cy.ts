import { selectors } from '../../../support/selectors';

describe('Regression - Subscribers', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.stubDashboard();
    cy.stubSubscribers();

    cy.visit('/subscriber', {
      onBeforeLoad(window) {
        window.localStorage.setItem(
          'splitfy.auth.session',
          JSON.stringify({
            token: 'mock-jwt-token-e2e',
            tokenType: 'Bearer',
            expiresInMs: 3_600_000,
            expiresAt: Date.now() + 3_600_000,
            userId: 'c0d3x-1111-4c7a-8f2b-111111111111',
            email: 'admin@splitfy.app',
            profile: 'ADMIN',
          }),
        );
      },
    });

    cy.wait('@subscribersList');
    cy.get(selectors.subscribers.page).should('be.visible');
  });

  it('lists subscribers and opens details with month change', () => {
    cy.get('[data-cy="subscribers-card"]').should('have.length.at.least', 1);
    cy.get('[data-cy="subscribers-detail-1"]').click();

    cy.wait('@subscriberBilling');
    cy.get(selectors.subscribers.detailModal).should('be.visible');
    cy.get('[data-cy="subscribers-detail-reference-month"]').clear().type('2026-03');
    cy.get('[data-cy="subscribers-detail-reference-month"]').blur();

    cy.wait('@subscriberBilling');
  });

  it('creates and edits a subscriber profile', () => {
    cy.intercept('POST', '**/api/subscribers', {
      statusCode: 200,
      body: {
        id: 99,
        name: 'Novo Assinante',
        email: 'novo@splitfy.app',
        associatedPlatforms: [],
      },
    }).as('createSubscriber');

    cy.intercept('PUT', '**/api/subscribers/99', {
      statusCode: 200,
      body: {
        id: 99,
        name: 'Novo Assinante Editado',
        email: 'novo-editado@splitfy.app',
        associatedPlatforms: [],
      },
    }).as('updateSubscriber');

    cy.get(selectors.subscribers.createButton).click();
    cy.get('[data-cy="subscribers-edit-form"]').should('be.visible');
    cy.get('[data-cy="subscribers-edit-name"]').clear().type('Novo Assinante');
    cy.get('[data-cy="subscribers-edit-email"]').clear().type('novo@splitfy.app');
    cy.get('[data-cy="subscribers-edit-save"]').click();

    cy.wait('@createSubscriber').its('response.statusCode').should('eq', 200);
    cy.contains('[data-cy="subscribers-card"] h3', 'Novo Assinante').should('be.visible');

    cy.get('[data-cy="subscribers-detail-99"]').click();
    cy.wait('@subscriberBilling');
    cy.get('[data-cy="subscribers-edit-button"]').click();
    cy.get('[data-cy="subscribers-edit-profile-option"]').click();
    cy.get('[data-cy="subscribers-edit-name"]').clear().type('Novo Assinante Editado');
    cy.get('[data-cy="subscribers-edit-email"]').clear().type('novo-editado@splitfy.app');
    cy.get('[data-cy="subscribers-edit-save"]').click();

    cy.wait('@updateSubscriber').its('response.statusCode').should('eq', 200);
    cy.contains('[data-cy="subscribers-card"] h3', 'Novo Assinante Editado').should('be.visible');
  });

  it('edits subscriptions and deletes a subscriber', () => {
    cy.intercept('POST', '**/api/subscribers/*/associate', { statusCode: 200, body: {} }).as('associatePlatform');
    cy.intercept('DELETE', '**/api/subscribers/2', { statusCode: 200, body: {} }).as('deleteSubscriber');

    cy.get('[data-cy="subscribers-detail-2"]').click();
    cy.wait('@subscriberBilling');
    cy.get('[data-cy="subscribers-edit-button"]').click();
    cy.get('[data-cy="subscribers-edit-subscriptions-option"]').click();

    cy.wait('@subscriberDetails');
    cy.wait('@subscriberSubscriptions');
    cy.wait('@platformsList');
    cy.get(selectors.subscribers.subscriptionsModal).should('be.visible');

    cy.get('[data-cy="subscribers-add-platform-2"]').click();
    cy.get('[data-cy="subscribers-save-subscriptions"]').click();
    cy.wait('@associatePlatform').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy="subscribers-close-subscriptions"]').click();

    cy.get('[data-cy="subscribers-delete-button"]').click();
    cy.get(selectors.subscribers.deleteModal).should('be.visible');
    cy.get('[data-cy="subscribers-delete-confirm"]').click();

    cy.wait('@deleteSubscriber').its('response.statusCode').should('eq', 200);
    cy.contains('[data-cy="subscribers-card"] h3', 'Bruno Lima').should('not.exist');
  });
});
