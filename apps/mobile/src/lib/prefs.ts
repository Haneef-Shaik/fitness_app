/**
 * Device preferences — small, non-secret, per-installation.
 *
 * **Not `storage.ts`.** That module is the keychain, and the keychain is for
 * secrets: putting "which measurements do I want on my progress screen" in it
 * would be slower, semantically wrong, and would make a real secret harder to
 * find among the noise.
 *
 * **Not the server either.** A preference like this needs no round trip, no
 * column and no migration, and syncing it would mean a user's second device
 * silently changing their first.
 *
 * A JSON file via `expo-file-system`, which the uploads already depend on.
 * Every read falls back rather than throwing: a corrupt or missing file is a
 * reason to use the default, never a reason for a screen to render nothing.
 *
 * **`expo-file-system` is required lazily**, for the reason G7 found with
 * `expo-sqlite`: a static import puts a native module in the graph of every
 * screen that so much as mentions a preference, and under Jest that throws
 * before a single assertion runs. Loading it on first use keeps the cost where
 * the use is, and a test that never touches a preference never touches it.
 */
import { Platform } from 'react-native';

const web = Platform.OS === 'web';

function fs(): typeof import('expo-file-system') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-file-system') as typeof import('expo-file-system');
}

async function readAll(): Promise<Record<string, unknown>> {
  try {
    if (web) {
      const raw = localStorage.getItem('volt.prefs');
      return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    }
    const file = fs();
    const path = `${file.documentDirectory ?? ''}volt-prefs.json`;
    const info = await file.getInfoAsync(path);
    if (!info.exists) return {};
    return JSON.parse(await file.readAsStringAsync(path)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function getPref<T>(key: string, fallback: T): Promise<T> {
  const all = await readAll();
  return key in all ? (all[key] as T) : fallback;
}

export async function setPref(key: string, value: unknown): Promise<void> {
  try {
    const next = { ...(await readAll()), [key]: value };
    const body = JSON.stringify(next);
    if (web) localStorage.setItem('volt.prefs', body);
    else {
      const file = fs();
      await file.writeAsStringAsync(`${file.documentDirectory ?? ''}volt-prefs.json`, body);
    }
  } catch {
    // A preference that cannot be saved is a preference that does not persist.
    // It is not worth failing a screen over.
  }
}
