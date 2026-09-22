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
  // `forceExit` was carried here from G1 to G3 and is GONE as of G4.
  //
  // G1 attributed the hang to a mounted TanStack mutation observer. That was only
  // half of it: removing Zustand in G3 (D19) took the other half with it, and the
  // suite now goes idle on its own. Verified by deleting the flag and running the
  // full suite three times — 297 passed, exit 0, every time.
  //
  // If it comes back, the diagnosis that worked was bisecting the subscription:
  // a store or query client that keeps a live listener after the last assertion
  // is what stops the worker idling, not anything in the app's own code.
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
    // D18's ratchet: pinned just under the measured remainder, so the gain is
    // locked in and cannot quietly rot. Raise these when you raise the
    // coverage, never to make a red build green.
    //
    // NOT the figure the coverage table prints. Naming a path below REMOVES it
    // from `global`, so the printed 55.66% includes src/lib/query and
    // DataBoundary while this bucket is everything else.
    //
    // Measured remainder, goal by goal:
    //   G4  51.90 / 47.15 / 48.33 / 52.31
    //   G5  54.58 / 50.28 / 50.72 / 55.14
    //   G6  54.97 / 50.03 / 50.84 / 55.40
    // Each goal added screens AND their tests, so the floor rises with the
    // ceiling rather than being held down to accommodate untested code. G6's
    // branch figure barely moved because charts are branch-heavy by nature —
    // the thresholds stay where the measurement is, not where it would be
    // flattering.
    global: { statements: 54, branches: 50, functions: 50, lines: 55 },
    './src/lib/query/': { statements: 90, branches: 80, functions: 90, lines: 90 },
    './src/ui/DataBoundary.tsx': { statements: 95, branches: 90, functions: 95, lines: 95 },
  },
};
