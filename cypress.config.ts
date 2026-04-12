import { defineConfig } from 'cypress';

export default defineConfig({
  allowCypressEnv: false,
  defaultCommandTimeout: 8_000,
  requestTimeout: 10_000,
  responseTimeout: 20_000,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  reporter: 'spec',
  video: true,
  screenshotOnRunFailure: true,

  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost:4242',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents() {
      return {};
    },
  },
});
