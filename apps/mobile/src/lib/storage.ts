/**
 * What the app keeps in the device keychain beside Supabase's session
 * (lib/supabase.ts stores that itself, in chunks).
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore has no web implementation; web falls back to localStorage, which is
// acceptable only because web is a development surface, not the shipping platform.
const web = Platform.OS === 'web';

/**
 * The signed-in account's id, kept beside the session.
 *
 * Needed offline: a session restored without reaching the server still has to
 * know whose unfinished workout and queue are on the device (G10), or the
 * logger — which must work offline (I10) — would have nowhere to write.
 */
const ACCOUNT = 'fitlog.account_id';

export async function setAccountId(id: string): Promise<void> {
  try {
    if (web) localStorage.setItem(ACCOUNT, id);
    else await SecureStore.setItemAsync(ACCOUNT, id);
  } catch { /* storage can be unavailable; the id is then asked for again online */ }
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
