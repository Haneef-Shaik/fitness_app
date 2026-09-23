/**
 * Refresh tokens live in the device keychain, never AsyncStorage.
 *
 * The specs originally put the refresh token in an httpOnly cookie — a native app
 * cannot use those, so SecureStore plus rotation + family revocation is what
 * replaces that protection (docs/02 §8).
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH = 'volt.refresh_token';

// SecureStore has no web implementation; web falls back to localStorage, which is
// acceptable only because web is a development surface, not the shipping platform.
const web = Platform.OS === 'web';

export async function setRefreshToken(token: string): Promise<void> {
  try {
    if (web) localStorage.setItem(REFRESH, token);
    else await SecureStore.setItemAsync(REFRESH, token);
  } catch { /* storage can be unavailable; the session simply won't survive a restart */ }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return web ? localStorage.getItem(REFRESH) : await SecureStore.getItemAsync(REFRESH);
  } catch { return null; }
}

export async function clearRefreshToken(): Promise<void> {
  try {
    if (web) localStorage.removeItem(REFRESH);
    else await SecureStore.deleteItemAsync(REFRESH);
  } catch { /* nothing to do */ }
}

/**
 * The signed-in account's id, kept beside the refresh token.
 *
 * Needed offline: a session restored without reaching the server still has to
 * know whose unfinished workout and queue are on the device (G10), or the
 * logger — which must work offline (I10) — would have nowhere to write.
 */
const ACCOUNT = 'volt.account_id';

export async function setAccountId(id: string): Promise<void> {
  try {
    if (web) localStorage.setItem(ACCOUNT, id);
    else await SecureStore.setItemAsync(ACCOUNT, id);
  } catch { /* see setRefreshToken */ }
}

export async function getAccountId(): Promise<string | null> {
  try {
    return web ? localStorage.getItem(ACCOUNT) : await SecureStore.getItemAsync(ACCOUNT);
  } catch { return null; }
}

export async function clearAccountId(): Promise<void> {
  try {
    if (web) localStorage.removeItem(ACCOUNT);
    else await SecureStore.deleteItemAsync(ACCOUNT);
  } catch { /* nothing to do */ }
}
