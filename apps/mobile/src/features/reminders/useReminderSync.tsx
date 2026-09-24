/**
 * Keeps the scheduled reminders in step with what they depend on (B-04, G10).
 *
 * The workout reminder follows the program's days and the check-in reminder
 * follows the next check-in; both move without the Reminders screen being
 * opened — a check-in moves the next one a week on. So whenever either changes,
 * the set is re-applied. Never prompts: without permission it does nothing.
 */
import React, { useEffect } from 'react';
import { useSession } from '@/lib/session';
import { getPref } from '@/lib/prefs';
import { plannedReminders, type ReminderKey } from './plan';
import { applyReminders, hasPermission } from './schedule';
import { REMINDERS_PREF, useReminderContext } from './useReminderContext';

export function useReminderSync(): void {
  const ctx = useReminderContext();
  const key = `${[...ctx.programWeekdays].sort().join(',')}|${ctx.nextCheckin ?? ''}`;
  useEffect(() => {
    let live = true;
    void (async () => {
      const on = await getPref<Partial<Record<ReminderKey, boolean>>>(REMINDERS_PREF, {});
      if (!Object.values(on).some(Boolean) || !live || !(await hasPermission())) return;
      await applyReminders(plannedReminders(on, ctx));
    })().catch(() => { /* the Reminders screen reports failures; this retries on the next change */ });
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
  return status === 'ready' ? <Sync /> : null;
}
