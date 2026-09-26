/**
 * D10: what signs someone in lives in the device keychain, never in plain
 * storage — the account id beside it (storage.ts), and Supabase's session in
 * chunks small enough for Android's keystore (supabase.ts).
 */
import * as SecureStore from 'expo-secure-store';
import { clearAccountId, getAccountId, setAccountId } from '../storage';

const { chunkedSecureStore } = jest.requireActual('../supabase') as typeof import('../supabase');
const store = (SecureStore as unknown as { __store: Map<string, string> }).__store;

beforeEach(() => {
  jest.clearAllMocks();
  store.clear();
});

describe('account id', () => {
  it('round-trips through SecureStore', async () => {
    await setAccountId('acct-1');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('fitlog.account_id', 'acct-1');
    await expect(getAccountId()).resolves.toBe('acct-1');
    await clearAccountId();
    await expect(getAccountId()).resolves.toBeNull();
  });

  it('survives storage being unavailable rather than crashing the app', async () => {
    // A locked keychain must cost the user a lookup, not the launch.
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('keychain locked'));
    await expect(setAccountId('acct-1')).resolves.toBeUndefined();
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('keychain locked'));
    await expect(getAccountId()).resolves.toBeNull();
    (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error('keychain locked'));
    await expect(clearAccountId()).resolves.toBeUndefined();
  });
});

describe('the Supabase session in the keychain', () => {
  it('stores a small session in one piece', async () => {
    await chunkedSecureStore.setItem('s', '{"a":1}');
    expect(store.get('s.n')).toBe('1');
    await expect(chunkedSecureStore.getItem('s')).resolves.toBe('{"a":1}');
  });

  it('splits a large one into pieces under Android’s ~2 KB limit, and rejoins it', async () => {
    const big = 'x'.repeat(4000);
    await chunkedSecureStore.setItem('s', big);
    expect(store.get('s.n')).toBe('3');
    for (const [k, v] of store) if (k !== 's.n') expect(v.length).toBeLessThanOrEqual(1800);
    await expect(chunkedSecureStore.getItem('s')).resolves.toBe(big);
  });

  it('removes the pieces a shorter session no longer needs', async () => {
    await chunkedSecureStore.setItem('s', 'x'.repeat(4000));
    await chunkedSecureStore.setItem('s', 'short');
    expect([...store.keys()].sort()).toEqual(['s.0', 's.n']);
    await expect(chunkedSecureStore.getItem('s')).resolves.toBe('short');
  });

  it('is nothing when never stored, removed, or missing a piece', async () => {
    await expect(chunkedSecureStore.getItem('s')).resolves.toBeNull();
    await chunkedSecureStore.setItem('s', 'x'.repeat(4000));
    store.delete('s.1');
    await expect(chunkedSecureStore.getItem('s')).resolves.toBeNull();
    await chunkedSecureStore.removeItem('s');
    expect(store.size).toBe(0);
  });

  it('fails soft when the keychain is locked: signed out, not crashed', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('locked'));
    await expect(chunkedSecureStore.getItem('s')).resolves.toBeNull();
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('locked'));
    await expect(chunkedSecureStore.setItem('s', 'v')).resolves.toBeUndefined();
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('locked'));
    await expect(chunkedSecureStore.removeItem('s')).resolves.toBeUndefined();
  });
});
