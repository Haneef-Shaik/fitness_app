// Coverage covers all of src/ except the tests, so files no test imports count as uncovered. Scope and thresholds live in
// coverage-thresholds.json, which the QA-9 ratchet (scripts/quality) reads from Git history as data: they only rise.
const coverage = require('./coverage-thresholds.json');

module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.[jt]s?(x)'],
  // Jest 29 refuses to write inline snapshots with Prettier 3, the root devDependency; null writes them without Prettier.
  prettierPath: null,
  clearMocks: true,
  collectCoverageFrom: coverage.collectCoverageFrom,
  coverageThreshold: { global: coverage.global },
  coverageReporters: ['text-summary', 'json-summary', ['text', { file: 'coverage.txt' }]],
};
