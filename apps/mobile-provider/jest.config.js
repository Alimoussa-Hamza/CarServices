/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  watchman: false,
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.(spec|test).ts'],
};
