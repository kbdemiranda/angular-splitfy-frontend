import { selectors } from '../../../support/selectors';

describe('Regression - Billing charges', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.stubDashboard();
    cy.stubBilling();

    cy.visit('/billing-charges', {
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
    cy.get(selectors.billing.page).should('be.visible');
  });

  it('opens billing details and sends individual charge', () => {
    cy.get('[data-cy="billing-open-details-1"]').click();

    cy.wait('@billingDetails');
    cy.get(selectors.billing.detailModal).should('be.visible');
    cy.get('[data-cy="billing-send-charge"]').click();

    cy.wait('@sendBillingEmail').its('response.statusCode').should('eq', 200);
    cy.contains('Cobrança enviada para o e-mail cadastrado.').should('be.visible');
  });

  it('validates bulk charge form and submits successfully', () => {
    cy.get('[data-cy="billing-open-bulk-charge"]').click();
    cy.get(selectors.billing.bulkModal).should('be.visible');

    cy.get('[data-cy="billing-bulk-submit"]').click();
    cy.contains('Selecione ao menos um assinante.').should('be.visible');

    cy.get('[data-cy="billing-bulk-subscriber-1"]').check({ force: true });
    cy.get('[data-cy="billing-bulk-submit"]').click();
    cy.contains('Informe ao menos um e-mail de destino.').should('be.visible');

    cy.get('[data-cy="billing-bulk-emails"]').clear().type('finance@splitfy.app');
    cy.get('[data-cy="billing-bulk-submit"]').click();

    cy.wait('@sendBillingEmail').its('response.statusCode').should('eq', 200);
    cy.contains('Cobrança enviada').should('be.visible');
  });

  it('validates register payment and submits successfully', () => {
    cy.get('[data-cy="billing-open-details-1"]').click();
    cy.wait('@billingDetails');

    cy.get('[data-cy="billing-open-register-payment"]').click();
    cy.get(selectors.billing.registerModal).should('be.visible');

    cy.get('[data-cy="billing-register-submit"]').click();
    cy.contains('Selecione ao menos uma plataforma.').should('be.visible');

    cy.get('[data-cy="billing-register-platform-1"]').check({ force: true });
    cy.get('[data-cy="billing-register-submit"]').click();

    cy.wait('@registerPayment').its('response.statusCode').should('eq', 200);
    cy.contains('Pagamento registrado com sucesso.').should('be.visible');
  });
});
