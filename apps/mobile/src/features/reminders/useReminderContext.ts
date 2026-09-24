/**
 * What the app knows that decides when reminders fire: the active program's
 * days and the next check-in (B-04, G10).
 */
import { useMemo } from 'react';
import { useCheckins, usePrograms } from '@/lib/query/hooks';
import type { ReminderContext } from './plan';

/** The device preference holding which reminders are switched on. */
export const REMINDERS_PREF = 'reminders';

export function useReminderContext(): ReminderContext {
  const programs = usePrograms().data;
  const checkins = useCheckins().data;
  return useMemo(() => {
    const active = (programs ?? []).filter((p) => p.status === 'active');
    const weekdays = active.flatMap((p) => (p.days ?? []).map((d) => d.scheduled_weekday))
      .filter((w): w is number => typeof w === 'number');
    return {
      programWeekdays: weekdays,
      nextCheckin: checkins?.next_due ?? null,
      today: checkins?.today ?? new Date().toISOString().slice(0, 10),
    };
  }, [programs, checkins]);
}
