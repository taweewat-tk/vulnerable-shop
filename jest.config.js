module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', 'flaky.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!src/**/__tests__/**'],
  coverageReporters: ['text', 'json-summary', 'lcov'],
};
