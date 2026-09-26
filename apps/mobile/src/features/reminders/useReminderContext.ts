/**
 * What the app knows that decides when reminders fire: the active program's
 * days, the next check-in (B-04, G10), and what is already logged today, so
 * today's reminder for it is not sent (K-06).
 */
import { useMemo } from 'react';
import { useCheckins, useDashboard, usePrograms } from '@/lib/query/hooks';
import type { ReminderContext, ReminderKey } from './plan';

/** The device preference holding which reminders are switched on. */
export const REMINDERS_PREF = 'reminders';

export interface ReminderState extends ReminderContext {
  /**
   * The program and the check-ins have both loaded. Until then a plan would
   * have no workout or check-in reminders in it, and applying it would wipe
   * the ones already set — so nothing is applied (offline start, first render).
   */
  ready: boolean;
}

type Dashboard = NonNullable<ReturnType<typeof useDashboard>['data']>;

function loggedOn(board: Dashboard | undefined): ReminderContext['logged'] {
  if (!board?.local_date) return null;
  const kinds: ReminderKey[] = [];
  if (board.training?.sessions_today) kinds.push('workout');
  if (board.body?.today != null) kinds.push('weigh_in');
  if (board.nutrition?.meals_logged) kinds.push('meal_log');
  return { date: board.local_date, kinds };
}

export function useReminderContext(): ReminderState {
  const programs = usePrograms().data;
  const checkins = useCheckins().data;
  const board = useDashboard().data;
  return useMemo(() => {
    const active = (programs ?? []).filter((p) => p.status === 'active');
    const weekdays = active.flatMap((p) => (p.days ?? []).map((d) => d.scheduled_weekday))
      .filter((w): w is number => typeof w === 'number');
    return {
      ready: programs !== undefined && checkins !== undefined,
      programWeekdays: weekdays,
      // Before the first check-in the API says "due today" every day.
      nextCheckin: checkins?.checkins?.length ? checkins.next_due : null,
      logged: loggedOn(board),
    };
  }, [programs, checkins, board]);
}
