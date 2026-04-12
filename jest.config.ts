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
    '!src/app/core/i18n/translations.ts',
  ],
};

export default config;
