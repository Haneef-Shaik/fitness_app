/**
 * Push registration — so "your meal estimate is ready" reaches the phone.
 *
 * Never asks for permission itself: asking belongs to a moment the user chose
 * (H-07's "Tell me when it's ready", or turning a reminder on), behind L-06's
 * primer. This only registers when permission already exists, and quietly
 * does nothing when it cannot — no permission, no Expo project id yet (the
 * owner links one with `eas init`), web, or no network.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from '@/lib/api';
import { getPref, setPref } from '@/lib/prefs';
import { checkPermission } from '@/features/permissions/primer';

type Notifications = typeof import('expo-notifications');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const notifications = () => require('expo-notifications') as Notifications;

const TOKEN_PREF = 'push.token';

export type PushOutcome = 'registered' | 'no-permission' | 'no-project' | 'unsupported' | 'failed';

function projectId(): string | undefined {
  const c = Constants as unknown as {
    expoConfig?: { extra?: { eas?: { projectId?: string } } };
    easConfig?: { projectId?: string };
  };
  return c?.expoConfig?.extra?.eas?.projectId ?? c?.easConfig?.projectId;
}

export async function registerForPush(): Promise<PushOutcome> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return 'unsupported';
  if ((await checkPermission('notifications')).status !== 'granted') return 'no-permission';
  const id = projectId();
  if (!id) return 'no-project';
  try {
    const token = (await notifications().getExpoPushTokenAsync({ projectId: id })).data;
    await api.put('/devices/push-token', { token, platform: Platform.OS });
    await setPref(TOKEN_PREF, token);
    return 'registered';
  } catch {
    return 'failed';
  }
}

/** On sign-out: this phone stops hearing about the account that left it. */
export async function unregisterPush(): Promise<void> {
  const token = await getPref<string | null>(TOKEN_PREF, null);
  if (!token) return;
  try {
    await api.send('DELETE', '/devices/push-token', { token, platform: Platform.OS });
  } catch { /* best effort — the server also moves a token on the next sign-in */ }
  await setPref(TOKEN_PREF, null);
}
