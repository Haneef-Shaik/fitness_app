module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.[jt]s?(x)'],
  clearMocks: true,
  collectCoverageFrom: ['src/theme/**/*.{ts,tsx}', '!src/theme/**/__tests__/**', 'src/ui/**/*.{ts,tsx}'],
};
