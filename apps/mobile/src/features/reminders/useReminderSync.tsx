/**
 * Keeps the scheduled reminders in step with what they depend on (B-04, G10).
 *
 * The workout reminder follows the program's days, the check-in reminder
 * follows the next check-in, and a day's weigh-in, meal or workout reminder is
 * dropped once that day's is logged. All of it moves without the Reminders
 * screen being opened, so whenever any of it changes — or the app comes back
 * on a new day or in a new time zone — the set is re-applied. Never prompts:
 * without permission it does nothing.
 */
import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useSession } from '@/lib/session';
import { getPref } from '@/lib/prefs';
import { phoneClock, plannedReminders, type ReminderKey } from './plan';
import { applyPlan, applyReminders, hasPermission } from './schedule';
import { REMINDERS_PREF, useReminderContext } from './useReminderContext';

/**
 * The phone's date and UTC offset, read again whenever the app comes back to
 * the foreground: a new day moves the window on, and a new time zone moves
 * every reminder, which is set as a fixed moment.
 */
function usePhoneDay(): string {
  const read = () => `${phoneClock().today}${new Date().getTimezoneOffset()}`;
  const [day, setDay] = useState(read);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setDay(read());
    });
    return () => sub.remove();
  }, []);
  return day;
}

export function useReminderSync(): void {
  const ctx = useReminderContext();
  const day = usePhoneDay();
  const key = [
    ctx.ready,
    [...ctx.programWeekdays].sort().join(','),
    ctx.nextCheckin ?? '',
    ctx.logged ? `${ctx.logged.date}:${ctx.logged.kinds.join(',')}` : '',
    day,
  ].join('|');
  useEffect(() => {
    if (!ctx.ready) return undefined;
    let live = true;
    // Planned when its turn in the queue comes, from the switches as they are then.
    applyPlan(async () => {
      const on = await getPref<Partial<Record<ReminderKey, boolean>>>(REMINDERS_PREF, {});
      if (!live || !Object.values(on).some(Boolean) || !(await hasPermission())) return null;
      return plannedReminders(on, ctx, phoneClock());
    }).catch(() => { /* the Reminders screen reports failures; this retries on the next change */ });
    return () => { live = false; };
    // `key` is the part of the context that changes what is scheduled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

function Sync(): null {
  useReminderSync();
  return null;
}

/** Mounted once in the shell; only a signed-in account has reminders to keep in step. */
export function ReminderSync(): React.JSX.Element | null {
  const { status } = useSession();
  useEffect(() => {
    // Signing out takes the account's reminders off the phone; the next
    // account's are set when it signs in.
    if (status === 'signed-out') applyReminders([]).catch(() => { /* retried on the next sign-out */ });
  }, [status]);
  return status === 'ready' ? <Sync /> : null;
}
