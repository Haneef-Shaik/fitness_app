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
