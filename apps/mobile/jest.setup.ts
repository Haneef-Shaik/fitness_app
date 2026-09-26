import { notifyManager } from '@tanstack/react-query';

// TanStack batches cache notifications through a setTimeout. Under jest-expo that
// timer keeps the worker alive after the last assertion — the run hung rather than
// failed — and it also fires React updates outside act(), producing warnings that
// look like test bugs but are not. A synchronous scheduler removes both.
notifyManager.setScheduler((cb) => cb());

// RTL 13 registers its matchers on import; there is no separate extend-expect entry.
// expo-constants reads a native manifest that does not exist under Jest. The LAN
// host derivation in src/lib/api.ts depends on it, so tests set it explicitly.
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: {} } }));

// SecureStore is a native module; the token tests drive it through this double.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    setItemAsync: jest.fn(async (k: string, v: string) => { store.set(k, v); }),
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    deleteItemAsync: jest.fn(async (k: string) => { store.delete(k); }),
    __store: store,
  };
});

// Sentry's SDK reaches for its native module (RNSentry) on import. The suite
// never has a DSN, so the app never initialises it; this double lets the
// crash-reporting tests assert what the app asks of the SDK.
jest.mock('@sentry/react-native', () => ({
  __esModule: true,
  init: jest.fn(),
  wrap: jest.fn((component: unknown) => component),
  captureException: jest.fn(),
}));

// Icons load a native font module, which Jest does not have. A stand-in that
// renders the icon's name keeps screens renderable and lets a test assert which
// icon is shown (e.g. the filled one on the active tab).
jest.mock('@expo/vector-icons/Ionicons', () => {
  const { Text } = jest.requireActual('react-native');
  const React = jest.requireActual('react');
  const Icon = ({ name, testID }: { name: string; testID?: string }) =>
    React.createElement(Text, { testID: testID ?? `icon-${name}` }, name);
  return { __esModule: true, default: Icon };
});

// Supabase Auth (docs/14): the steerable fake in src/lib/__mocks__/supabase.ts —
// no test reaches a network — reset to "nobody signed in" before each test.
jest.mock('@/lib/supabase');
beforeEach(() => {
  (jest.requireMock('@/lib/supabase') as typeof import('@/lib/__mocks__/supabase')).fakeAuth.reset();
});
