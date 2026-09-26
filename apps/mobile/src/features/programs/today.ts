/**
 * C-01's "TODAY" card: the plan day to offer. Driven by the server's local
 * date (I7) rather than the phone's clock.
 */
import type { PlanDay, Program } from '@fitlog/api-types';

/** 0 = Monday … 6 = Sunday, the backend's convention. Parsed as a calendar
 *  date, so no timezone can move it. */
export function weekdayOf(localDate: string): number {
  const [y, m, d] = localDate.split('-').map(Number);
  const sundayFirst = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
  return (sundayFirst + 6) % 7;
}

export interface Suggestion { program: Program; day: PlanDay; scheduled: boolean }

export function suggestDay(programs: readonly Program[], localDate: string): Suggestion | null {
  const live = programs.filter((p) => p.status === 'active' && (p.days?.length ?? 0) > 0);
  const today = weekdayOf(localDate);
  for (const program of live) {
    const day = program.days!.find((d) => d.scheduled_weekday === today);
    if (day) return { program, day, scheduled: true };
  }
  const first = live[0];
  return first ? { program: first, day: first.days![0]!, scheduled: false } : null;
}
