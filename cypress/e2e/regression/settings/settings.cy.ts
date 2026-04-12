import { selectors } from '../../../support/selectors';

describe('Regression - Settings', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();

    cy.fixture('settings/users-page.json').then((usersPage) => {
      cy.intercept('GET', '**/api/users*', {
        statusCode: 200,
        body: usersPage,
      }).as('usersList');
    });

    cy.fixture('settings/schedule.json').then((schedule) => {
      cy.intercept('GET', '**/api/email-schedules/kpi-summary', {
        statusCode: 200,
        body: schedule,
      }).as('scheduleLoad');
    });

    cy.intercept('POST', '**/api/users', {
      statusCode: 200,
      body: {
        id: 100,
        name: 'Novo Usuário',
        email: 'novo.usuario@splitfy.app',
        profileName: 'USER',
        profile: 'Usuário',
        active: true,
        receivesDashboardEmail: false,
      },
    }).as('createUser');

    cy.intercept('PUT', '**/api/email-schedules/kpi-summary', {
      statusCode: 200,
      body: {
        scheduleKey: 'KPI_SUMMARY',
        enabled: true,
        timezone: 'America/Sao_Paulo',
        occurrences: [
          {
            dayOfWeek: 1,
            executionTime: '09:00',
          },
          {
            dayOfWeek: 3,
            executionTime: '15:30',
          },
        ],
      },
    }).as('saveSchedule');

    cy.visit('/settings', {
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

    cy.wait('@usersList');
    cy.wait('@scheduleLoad');
    cy.get(selectors.settings.page).should('be.visible');
  });

  it('creates user from settings admin panel', () => {
    cy.get('[data-cy="settings-users-create"]').click();
    cy.get('[data-cy="settings-create-user-modal"]').should('be.visible');

    cy.get('[data-cy="settings-create-user-name"]').type('Novo Usuário');
    cy.get('[data-cy="settings-create-user-email"]').type('novo.usuario@splitfy.app');
    cy.get('[data-cy="settings-create-user-password"]').type('senha-super-segura');
    cy.get('[data-cy="settings-create-user-submit"]').click();

    cy.wait('@createUser').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy="settings-create-user-modal"]').should('not.exist');
  });

  it('updates KPI schedule', () => {
    cy.get('[data-cy="settings-schedule-card"]').should('be.visible');
    cy.get('[data-cy="settings-schedule-timezone"]').clear().type('America/Sao_Paulo');
    cy.get('[data-cy="settings-schedule-save"]').click();

    cy.wait('@saveSchedule').its('response.statusCode').should('eq', 200);
  });
});
