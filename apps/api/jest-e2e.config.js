/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  testRegex: 'test/.*\\.e2e-spec\\.ts$',
  watchman: false,
  testTimeout: 60000,
  maxWorkers: 1,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.e2e.json' }],
  },
  moduleNameMapper: {
    '^@carservice/shared-types$':
      '<rootDir>/../../packages/shared-types/src/index.ts',
  },
  testEnvironment: 'node',
};
