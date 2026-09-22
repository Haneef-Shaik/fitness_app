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
  // KNOWN ISSUE, not masked lightly. A mounted TanStack mutation observer never
  // lets the Jest worker go idle under jest-expo's React Native environment, so
  // the run hangs *after* the last assertion rather than failing. Narrowed to the
  // library and environment, not app code:
  //   - it hangs with a no-op `onSuccess`, so applyInvalidation is not the cause;
  //   - the same applyInvalidation runs without React in invalidation.test.ts and
  //     exits cleanly;
  //   - making notifyManager synchronous (jest.setup.ts) removes the act()
  //     warnings but not the hang.
  // Every test still runs and reports; only process teardown is forced. Worth
  // revisiting in G3, which leans on this harness far harder.
  forceExit: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    // The route files were invisible to coverage until G4, and BOTH of G3's
    // late bugs lived in them — a summary read after the draft was cleared, and
    // a sync dot that said Synced while offline.
    'app/**/*.tsx',
    '!src/**/*.d.ts',
  ],
  coverageReporters: ['text-summary', 'lcov'],

  // The house floor is 80% (charter §5). The client started this goal at 0%, so
  // these are a RATCHET, not the target.
  //
  // Whole project today: 51.7% statements, 52.8% lines, across 290 tests.
  //
  // The figures DROPPED at G4 and that is the gate working, not failing: `app/`
  // was added to the measurement, so the route files stopped being invisible.
  // They were invisible while both of G3's late bugs lived in them.
  //
  // Note how Jest buckets this: a path listed here is REMOVED from `global`, so
  // `global` below measures only what is left over — the pre-existing untested
  // code, src/lib/session.tsx (0%) and src/ui/index.tsx (31%). Its numbers are
  // therefore lower than the project's, and that is not a weaker standard, it is
  // a different denominator. Raising it means testing those two files, which is
  // G2's work.
  //
  // The substrate G1 built is held at 90%+ so newly shared code can never be the
  // thing that drags the number down.
  coverageThreshold: {
    global: { statements: 45, branches: 38, functions: 45, lines: 46 },
    './src/lib/query/': { statements: 90, branches: 80, functions: 90, lines: 90 },
    './src/ui/DataBoundary.tsx': { statements: 95, branches: 90, functions: 95, lines: 95 },
  },
};
