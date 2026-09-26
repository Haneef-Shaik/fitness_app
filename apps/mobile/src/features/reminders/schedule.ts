/**
 * B-04 · setting the reminders on the phone (G10).
 *
 * Local notifications only: nothing leaves the device, and nothing needs a
 * push service. The whole set is replaced on every change — cancel all, then
 * schedule what `plannedReminders` says — so a reminder switched off or a day
 * dropped from the program can never keep firing. Changes are applied one at
 * a time, so two of them can never interleave into a mixture of both.
 *
 * `expo-notifications` is required lazily, as the store and file system are:
 * a static import of a native module breaks every test that merely imports a
 * screen that mentions reminders.
 */
import { Platform } from 'react-native';
import { reminderData } from '@/features/notifications/route';
import type { PlannedReminder, Trigger } from './plan';

type NotificationsModule = typeof import('expo-notifications');

function notifications(): NotificationsModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as NotificationsModule;
}

/** Android's channel for reminders: silenced in the phone's settings without silencing anything else. */
export const REMINDER_CHANNEL = 'reminders';

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

/** A date on the phone's own clock — `new Date(y, m, d, …)` is local time. */
function triggerFor(t: Trigger, N: NotificationsModule) {
  const [y, m, d] = t.date.split('-').map(Number) as [number, number, number];
  return {
    type: N.SchedulableTriggerInputTypes.DATE,
    date: new Date(y, m - 1, d, t.hour, t.minute),
    channelId: REMINDER_CHANNEL,
  };
}

/** Shown even while the app is open: `showWhileOpen`, set at start-up by `NotificationTaps`. */
async function replaceAll(list: readonly PlannedReminder[]): Promise<number> {
  const N = notifications();
  // Only once there is something to put in it: a signed-out phone clearing
  // reminders it never had should not grow a "Reminders" entry in Settings.
  if (Platform.OS === 'android' && list.length > 0) {
    await N.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'Reminders',
      description: 'Workouts, weigh-ins, meals and check-ins you asked to be reminded of.',
      importance: N.AndroidImportance.DEFAULT,
    });
  }
  await N.cancelAllScheduledNotificationsAsync();
  // One that fails must not take the rest with it: everything was just cancelled.
  const failures: unknown[] = [];
  for (const r of list) {
    try {
      await N.scheduleNotificationAsync({
        identifier: r.id,
        content: { title: r.title, body: r.body, data: reminderData(r.kind) },
        trigger: triggerFor(r.trigger, N) as never,
      });
    } catch (e) {
      failures.push(e);
    }
  }
  if (failures.length > 0) throw failures[0];
  return list.length;
}

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job);
  queue = run.catch(() => undefined);
  return run;
}

/** Replace every scheduled reminder with this set. Returns how many were set. */
export function applyReminders(list: readonly PlannedReminder[]): Promise<number> {
  if (Platform.OS === 'web') return Promise.resolve(0);
  return enqueue(() => replaceAll(list));
}

/**
 * Plan when this change's turn comes, not before: the switches and the clock
 * it reads are then current, so a change queued behind another cannot undo it
 * with what it read earlier. A plan of `null` leaves the phone as it is.
 */
export function applyPlan(plan: () => Promise<readonly PlannedReminder[] | null>): Promise<number | null> {
  if (Platform.OS === 'web') return Promise.resolve(null);
  return enqueue(async () => {
    const list = await plan();
    return list ? replaceAll(list) : null;
  });
}
