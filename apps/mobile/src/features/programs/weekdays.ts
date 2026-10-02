/**
 * A plan day's `scheduled_weekday`, named: 0 = Monday … 6 = Sunday.
 *
 * The API's convention (models/program.py), the starter templates' and the one
 * C-01 and the workout reminders already use (`today.ts`, `reminders/plan.ts`).
 * One list, so a screen cannot label it Sunday-first again.
 */
export const PLAN_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function planWeekdayName(weekday: number | null | undefined): string | null {
  return weekday === null || weekday === undefined ? null : PLAN_WEEKDAYS[weekday] ?? null;
}
