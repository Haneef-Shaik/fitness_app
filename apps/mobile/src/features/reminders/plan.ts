/**
 * B-04 · which reminders to schedule, from the user's switches and what the
 * app knows (G10). Pure, so every rule is tested without a phone; the
 * scheduling itself is `schedule.ts`.
 *
 * Nothing is scheduled that was not switched on, and nothing is invented: no
 * program days means no workout reminder, not one every day.
 */
export type ReminderKey = 'workout' | 'weigh_in' | 'meal_log' | 'checkin';

export type Trigger =
  | { kind: 'weekly'; weekday: number; hour: number; minute: number }
  | { kind: 'daily'; hour: number; minute: number }
  | { kind: 'date'; date: string; hour: number; minute: number };

export interface PlannedReminder {
  id: string;
  title: string;
  body: string;
  trigger: Trigger;
}

export interface ReminderContext {
  /** The active program's scheduled days, API convention: 0 = Monday … 6 = Sunday. */
  programWeekdays: readonly number[];
  /** The next check-in's date (YYYY-MM-DD), or null with none. */
  nextCheckin: string | null;
  today: string;
}

/** API weekday (0 = Monday) → expo-notifications weekday (1 = Sunday … 7 = Saturday). */
export const toExpoWeekday = (w: number): number => ((w + 1) % 7) + 1;

const nextDay = (d: string) => {
  const at = new Date(`${d}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() + 1);
  return at.toISOString().slice(0, 10);
};

export function plannedReminders(on: Partial<Record<ReminderKey, boolean>>, ctx: ReminderContext): PlannedReminder[] {
  const out: PlannedReminder[] = [];
  if (on.workout) {
    for (const w of [...new Set(ctx.programWeekdays)].sort()) {
      out.push({
        id: `workout-${w}`, title: 'Workout today', body: 'Your program has a session planned for today.',
        trigger: { kind: 'weekly', weekday: toExpoWeekday(w), hour: 17, minute: 0 },
      });
    }
  }
  if (on.weigh_in) {
    out.push({
      id: 'weigh_in', title: 'Weigh-in', body: 'Before breakfast is when the number means most.',
      trigger: { kind: 'daily', hour: 7, minute: 30 },
    });
  }
  if (on.meal_log) {
    out.push({
      id: 'meal_log', title: 'Log your meals', body: 'A minute now keeps today’s numbers honest.',
      trigger: { kind: 'daily', hour: 20, minute: 0 },
    });
  }
  if (on.checkin && ctx.nextCheckin) {
    // A due date already passed becomes tomorrow morning: a reminder in the past never fires.
    const date = ctx.nextCheckin > ctx.today ? ctx.nextCheckin : nextDay(ctx.today);
    out.push({
      id: 'checkin', title: 'Check-in due', body: 'Weight and measurements — same time of day as last time.',
      trigger: { kind: 'date', date, hour: 8, minute: 0 },
    });
  }
  return out;
}
