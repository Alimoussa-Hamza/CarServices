/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  watchman: false,
  setupFiles: ['<rootDir>/jest.setup.ts'],
  // RNTL / jest-expo component tests: TEST-02 (cahier M11) — pure unit tests for S01/S02
  testMatch: ['**/__tests__/**/*.(spec|test).ts'],
};
