/**
 * Supabase — for signing in, and nothing else (docs/14-SUPABASE.md).
 *
 * The app never reads or writes a table through Supabase: every write has to
 * pass the FitLog API's rules (the outbox, idempotency, the workout
 * invariants), and the Data API is closed to the public keys anyway. What this
 * client does is Supabase Auth: email and password, Google, Apple, the links in
 * confirmation and reset emails, refreshing the session and signing out. The
 * access token it holds is what `api.ts` sends to the FitLog API.
 *
 * **The session lives in the device keychain** (SecureStore), like the refresh
 * token before it. Android's keystore-backed store is only promised up to about
 * 2 KB a value and a session — tokens plus the user and its identities — can
 * be larger, so it is stored in chunks.
 *
 * **PKCE**, so a link from an email is useless anywhere but the phone that asked
 * for it: a `fitlog://` link another app intercepted carries a code, not a
 * session.
 */
import 'react-native-url-polyfill/auto';
import { createClient, type Session, type SupportedStorage } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

function defaultUrl(): string {
  // Inlined at build time, like EXPO_PUBLIC_API_URL (see api.ts).
  const fromEnv = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (fromEnv) return fromEnv;
  // Development: the local stack (`pnpm supabase start`) on the laptop Metro runs on.
  const host = Platform.OS === 'web' ? 'localhost' : Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:54321`;
}

export const SUPABASE_URL = defaultUrl();
/** The PUBLISHABLE key: public by design, it only lets an app ask Supabase Auth to sign in. */
export const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

/** Where every email link returns: app/auth/callback.tsx. */
export const AUTH_CALLBACK = 'fitlog://auth/callback';

/** SecureStore allows ~2048 bytes a value on Android; stay clear of it. */
const CHUNK = 1800;
const web = Platform.OS === 'web';

async function read(key: string): Promise<string | null> {
  return web ? globalThis.localStorage?.getItem(key) ?? null : SecureStore.getItemAsync(key);
}
async function write(key: string, value: string): Promise<void> {
  if (web) globalThis.localStorage?.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}
async function remove(key: string): Promise<void> {
  if (web) globalThis.localStorage?.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
}

/** A value split across `<key>.0`, `<key>.1`, … with the count at `<key>.n`. */
export const chunkedSecureStore: SupportedStorage = {
  async getItem(key) {
    try {
      const count = Number(await read(`${key}.n`));
      if (!count) return null;
      const parts = await Promise.all(Array.from({ length: count }, (_, i) => read(`${key}.${i}`)));
      return parts.some((p) => p === null) ? null : parts.join('');
    } catch {
      return null; // the keychain can be unavailable; the session then does not survive a restart
    }
  },
  async setItem(key, value) {
    try {
      const old = Number(await read(`${key}.n`)) || 0;
      const count = Math.max(1, Math.ceil(value.length / CHUNK));
      for (let i = 0; i < count; i++) await write(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
      await write(`${key}.n`, String(count));
      for (let i = count; i < old; i++) await remove(`${key}.${i}`);
    } catch { /* see getItem */ }
  },
  async removeItem(key) {
    try {
      const count = Number(await read(`${key}.n`)) || 0;
      for (let i = 0; i < count; i++) await remove(`${key}.${i}`);
      await remove(`${key}.n`);
    } catch { /* nothing to do */ }
  },
};

/** Where supabase-js keeps the session, under `chunkedSecureStore`. */
export const STORAGE_KEY = 'fitlog.supabase';

/**
 * The stored sign-in, read without asking Supabase anything. An offline cold
 * start needs it (O10): supabase-js's own `getSession()` first tries to refresh
 * an expired token, retrying for ~25 s with no signal before it answers.
 */
export async function readStoredSession(): Promise<Session | null> {
  try {
    const raw = await chunkedSecureStore.getItem(STORAGE_KEY);
    const session = raw ? (JSON.parse(raw) as Session) : null;
    return session?.access_token ? session : null;
  } catch {
    return null;
  }
}

/**
 * Forgets this device's sign-in without asking Supabase. `signOut()` cannot
 * when the token has expired and there is no signal — it returns an error and
 * keeps the session, which would sign the same person back in at the next
 * online launch.
 */
export async function forgetStoredSession(): Promise<void> {
  await chunkedSecureStore.removeItem(STORAGE_KEY);
  await chunkedSecureStore.removeItem(`${STORAGE_KEY}-code-verifier`);
  await chunkedSecureStore.removeItem(`${STORAGE_KEY}-user`);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY || 'missing-key', {
  auth: {
    storage: chunkedSecureStore,
    storageKey: STORAGE_KEY,
    persistSession: true,
    // Refreshed while the app is in front (app/_layout.tsx starts and stops it
    // with AppState, as Supabase's React Native guide says).
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
