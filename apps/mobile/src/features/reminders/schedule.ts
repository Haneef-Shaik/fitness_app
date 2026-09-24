/**
 * B-04 · setting the reminders on the phone (G10).
 *
 * Local notifications only: nothing leaves the device, and nothing needs a
 * push service. The whole set is replaced on every change — cancel all, then
 * schedule what `plannedReminders` says — so a reminder switched off or a day
 * dropped from the program can never keep firing.
 *
 * `expo-notifications` is required lazily, as the store and file system are:
 * a static import of a native module breaks every test that merely imports a
 * screen that mentions reminders.
 */
import { Platform } from 'react-native';
import type { PlannedReminder } from './plan';

type NotificationsModule = typeof import('expo-notifications');

function notifications(): NotificationsModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as NotificationsModule;
}

export type Permission = 'granted' | 'denied' | 'undetermined';

/** Whether reminders may be scheduled, without asking. */
export async function hasPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  return (await notifications().getPermissionsAsync()).granted;
}

/** Ask once; a refusal is respected and reported, never re-asked in a loop. */
export async function ensurePermission(): Promise<Permission> {
  if (Platform.OS === 'web') return 'denied';
  const N = notifications();
  const current = await N.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'denied';
  const asked = await N.requestPermissionsAsync();
  return asked.granted ? 'granted' : 'denied';
}

function triggerFor(r: PlannedReminder, N: NotificationsModule) {
  const T = N.SchedulableTriggerInputTypes;
  const t = r.trigger;
  if (t.kind === 'weekly') return { type: T.WEEKLY, weekday: t.weekday, hour: t.hour, minute: t.minute };
  if (t.kind === 'daily') return { type: T.DAILY, hour: t.hour, minute: t.minute };
  const [y, m, d] = t.date.split('-').map(Number) as [number, number, number];
  return { type: T.DATE, date: new Date(y, m - 1, d, t.hour, t.minute) };
}

let displayConfigured = false;

/**
 * Show a reminder even while the app is open. By default a notification that
 * arrives in the foreground is dropped silently — the one time the user is
 * already looking at the phone.
 */
function configureDisplay(N: NotificationsModule): void {
  if (displayConfigured) return;
  displayConfigured = true;
  N.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

/** Replace every scheduled reminder with this set. Returns how many were set. */
export async function applyReminders(list: readonly PlannedReminder[]): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const N = notifications();
  configureDisplay(N);
  await N.cancelAllScheduledNotificationsAsync();
  for (const r of list) {
    await N.scheduleNotificationAsync({
      identifier: r.id,
      content: { title: r.title, body: r.body },
      trigger: triggerFor(r, N) as never,
    });
  }
  return list.length;
}
