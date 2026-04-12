import type { Config } from 'jest';
import presets from 'jest-preset-angular/presets/index.js';

const { createCjsPreset } = presets as { createCjsPreset: () => Config };

const config: Config = {
  ...createCjsPreset(),
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/jest',
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/app/app-module.ts',
    '!src/app/app-routing-module.ts',
    '!src/app/core/interceptors/mock-backend.interceptor.ts',
    '!src/app/features/common/coming-soon/coming-soon-component.ts',
    '!src/app/features/subscribers/subscribers-data.ts',
    '!src/app/core/i18n/translations.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};

export default config;
