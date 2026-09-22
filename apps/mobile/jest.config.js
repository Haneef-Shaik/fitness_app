/** jest-expo runs tests in the Expo/React Native module world, not plain Node. */
// React Native and Expo ship untranspiled Flow/ESM, so their sources must go
// through babel. jest-expo's own allow-list assumes a flat node_modules and is
// therefore inert under pnpm, whose real paths look like:
//
//   node_modules/.pnpm/@react-native+js-polyfills@0.76.9/node_modules/@react-native/js-polyfills/...
//
// The first `node_modules/` is followed by `.pnpm/`, which the preset's pattern
// does not allow, so every RN source was being skipped and Jest choked on Flow
// syntax. The pattern below skips the `.pnpm/` segment and tests the *inner*
// `node_modules/`, which carries the real package name in both layouts.
const RN_FAMILY = [
  '(?:jest-)?react-native',
  '@react-native(?:-community)?',
  'expo',   // expo, expo-router, expo-constants, expo-secure-store, …
  '@expo',  // @expo/*, @expo-google-fonts/*
  'react-navigation',
  '@react-navigation',
  '@tanstack',
  '@shopify',
  '@testing-library',
].join('|');

module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    `node_modules/(?!\\.pnpm/)(?!(?:${RN_FAMILY}))`,
    'node_modules/react-native-reanimated/plugin/',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@volt/domain$': '<rootDir>/../../packages/domain/src/index.ts',
    '^@volt/api-types$': '<rootDir>/../../packages/api-types/src/index.ts',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageReporters: ['text-summary', 'lcov'],
};
