/// <reference types="cypress" />

import { selectors } from './selectors';

type SessionProfile = 'ADMIN' | 'USER' | 'VIEWER';

interface SessionSeed {
  token: string;
  tokenType: string;
  expiresInMs: number;
  expiresAt: number;
  userId: string;
  email: string;
  profile: SessionProfile;
}

const SESSION_STORAGE_KEY = 'splitfy.auth.session';

const buildSession = (profile: SessionProfile = 'ADMIN'): SessionSeed => ({
  token: 'mock-jwt-token-e2e',
  tokenType: 'Bearer',
  expiresInMs: 3_600_000,
  expiresAt: Date.now() + 3_600_000,
  userId: 'c0d3x-1111-4c7a-8f2b-111111111111',
  email: 'admin@splitfy.app',
  profile,
});

Cypress.Commands.add('seedSession', (sessionOverride = {}) => {
  const session = { ...buildSession(), ...sessionOverride };

  cy.window().then((window) => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  });
});

Cypress.Commands.add('stubDashboard', () => {
  cy.fixture('auth/dashboard-kpis.json').then((dashboardKpis) => {
    cy.intercept('GET', '**/api/dashboard/kpis*', {
      statusCode: 200,
      body: dashboardKpis,
    }).as('dashboardKpis');
  });
});

Cypress.Commands.add('loginByApiMock', (profile = 'ADMIN') => {
  const session = buildSession(profile);

  cy.intercept('POST', '**/api/auth/login', {
    statusCode: 200,
    body: {
      token: session.token,
      tokenType: session.tokenType,
      expiresInMs: session.expiresInMs,
      userId: session.userId,
      email: session.email,
      profile: session.profile,
    },
  }).as('loginRequest');

  cy.intercept('POST', '**/api/auth/logout', {
    statusCode: 200,
    body: {},
  }).as('logoutRequest');

  cy.stubDashboard();

  cy.visit('/login');
  cy.get(selectors.auth.email).clear().type(session.email);
  cy.get(selectors.auth.password).clear().type('123456', { log: false });
  cy.get(selectors.auth.submit).click();
  cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);
  cy.wait('@dashboardKpis');
  cy.location('pathname').should('eq', '/dashboard');
});

Cypress.Commands.add('stubSubscribers', () => {
  cy.fixture('subscribers/page.json').then((subscribersPage) => {
    cy.intercept('GET', '**/api/subscribers*', {
      statusCode: 200,
      body: subscribersPage,
    }).as('subscribersList');
  });

  cy.fixture('subscribers/detail.json').then((subscriberDetails) => {
    cy.intercept('GET', '**/api/subscribers/*', {
      statusCode: 200,
      body: subscriberDetails,
    }).as('subscriberDetails');
  });

  cy.fixture('subscribers/subscriptions.json').then((subscriberSubscriptions) => {
    cy.intercept('GET', '**/api/subscribers/*/subscriptions*', {
      statusCode: 200,
      body: subscriberSubscriptions,
    }).as('subscriberSubscriptions');
  });

  cy.fixture('subscribers/platforms-page.json').then((platformsPage) => {
    cy.intercept('GET', '**/api/platforms*', {
      statusCode: 200,
      body: platformsPage,
    }).as('platformsList');
  });

  cy.fixture('subscribers/billing.json').then((subscriberBilling) => {
    cy.intercept('GET', '**/api/billing/*', {
      statusCode: 200,
      body: subscriberBilling,
    }).as('subscriberBilling');
  });
});

Cypress.Commands.add('stubBilling', () => {
  cy.fixture('subscribers/page.json').then((subscribersPage) => {
    cy.intercept('GET', '**/api/subscribers*', {
      statusCode: 200,
      body: subscribersPage,
    }).as('subscribersList');
  });

  cy.fixture('billing/subscriber-billing.json').then((billing) => {
    cy.intercept('GET', '**/api/billing/*', {
      statusCode: 200,
      body: billing,
    }).as('billingDetails');
  });

  cy.intercept('POST', '**/api/subscribers/billing/email-summary', {
    statusCode: 200,
    body: {},
  }).as('sendBillingEmail');

  cy.intercept('POST', '**/api/paymnets/subscribers/*', {
    statusCode: 200,
    body: {},
  }).as('registerPayment');
});

Cypress.Commands.add('openSubscriberDetails', (nameOrId) => {
  if (typeof nameOrId === 'number') {
    cy.get(`[data-cy="subscribers-detail-${nameOrId}"]`).click();
    return;
  }

  cy.contains('[data-cy="subscribers-card"] h3', nameOrId)
    .closest('[data-cy="subscribers-card"]')
    .find('[data-cy="subscribers-open-details"]')
    .click();
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginByApiMock(profile?: SessionProfile): Chainable<void>;
      seedSession(sessionOverride?: Partial<SessionSeed>): Chainable<void>;
      stubDashboard(): Chainable<void>;
      stubSubscribers(): Chainable<void>;
      stubBilling(): Chainable<void>;
      openSubscriberDetails(nameOrId: string | number): Chainable<void>;
    }
  }
}

export {};
