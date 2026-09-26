/**
 * B-04 · which reminders to schedule, from the user's switches and what the
 * app knows (G10). Pure, so every rule is tested without a phone; the
 * scheduling itself is `schedule.ts`.
 *
 * Nothing is scheduled that was not switched on, and nothing is invented: no
 * program days means no workout reminder, not one every day.
 *
 * Every reminder is a one-off on a date, set for the next WINDOW_DAYS, never a
 * repeating one: a repeating trigger cannot skip the day the thing was already
 * done, and "weigh in" after the weigh-in is the reminder that gets reminders
 * switched off (K-06, "only if nothing's logged"). Each time the app is opened
 * the window moves on; a phone left unopened for WINDOW_DAYS goes quiet.
 */
export type ReminderKey = 'workout' | 'weigh_in' | 'meal_log' | 'checkin';

/** A day and a time on the phone's own clock. */
export interface Trigger { date: string; hour: number; minute: number }

export interface PlannedReminder {
  id: string;
  /** What it is about, so a tap can open the screen for it. */
  kind: ReminderKey;
  title: string;
  body: string;
  trigger: Trigger;
}

export interface ReminderContext {
  /** The active program's scheduled days, API convention: 0 = Monday … 6 = Sunday. */
  programWeekdays: readonly number[];
  /**
   * The next check-in's date (YYYY-MM-DD), or null with none — including before
   * the first, when "due" is always today and would move on every day.
   */
  nextCheckin: string | null;
  /** What is already logged, and on which day: only today's silences today's reminder. */
  logged: { date: string; kinds: readonly ReminderKey[] } | null;
}

/** The phone's date (YYYY-MM-DD) and minutes past its midnight. */
export interface Clock { today: string; minutes: number }

/**
 * How many days ahead are set. iOS holds at most 64 pending notifications per
 * app: three daily kinds over 14 days plus three for a check-in is 45.
 */
export const WINDOW_DAYS = 14;

/** Days after the first check-in reminder that a check-in still not taken is asked for again. */
export const CHECKIN_FOLLOW_UPS: readonly number[] = [2, 7];

const AT: Record<ReminderKey, { hour: number; minute: number }> = {
  workout: { hour: 17, minute: 0 },
  weigh_in: { hour: 7, minute: 30 },
  meal_log: { hour: 20, minute: 0 },
  checkin: { hour: 8, minute: 0 },
};

const COPY: Record<Exclude<ReminderKey, 'checkin'>, { title: string; body: string }> = {
  workout: { title: 'Workout today', body: 'Your program has a session planned for today.' },
  weigh_in: { title: 'Weigh-in', body: 'Before breakfast is when the number means most.' },
  meal_log: { title: 'Log your meals', body: 'A minute now keeps today’s numbers honest.' },
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Reminders fire on the phone's clock, so "today" is the phone's — not UTC's. */
export function phoneClock(at: Date = new Date()): Clock {
  return {
    today: `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`,
    minutes: at.getHours() * 60 + at.getMinutes(),
  };
}

const addDays = (d: string, n: number): string => {
  const at = new Date(`${d}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() + n);
  return at.toISOString().slice(0, 10);
};

/** 0 = Monday … 6 = Sunday, the API's convention. */
const weekdayOf = (d: string): number => (new Date(`${d}T00:00:00Z`).getUTCDay() + 6) % 7;

/** A reminder closer than this is left out: by the time it is set it may have passed. */
const LEAD_MINUTES = 2;

/** Still to come: a date in the past either fires at once or fails to schedule. */
const ahead = (key: ReminderKey, date: string, clock: Clock): boolean =>
  date > clock.today
  || (date === clock.today && AT[key].hour * 60 + AT[key].minute >= clock.minutes + LEAD_MINUTES);

function daily(key: Exclude<ReminderKey, 'checkin'>, ctx: ReminderContext, clock: Clock): PlannedReminder[] {
  const doneToday = ctx.logged?.date === clock.today && ctx.logged.kinds.includes(key);
  return Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(clock.today, i))
    .filter((date) => ahead(key, date, clock) && !(doneToday && date === clock.today))
    .map((date) => ({ id: `${key}-${date}`, kind: key, ...COPY[key], trigger: { date, ...AT[key] } }));
}

/**
 * The milestone measurements: on the morning the check-in is due, then again
 * while it is still waiting — each counted from the DUE date, so reopening the
 * app never moves them on into a daily nag. Taking the check-in moves the due
 * date, and the set is re-planned. Three reminders, then it stays quiet.
 */
function checkins(ctx: ReminderContext, clock: Clock): PlannedReminder[] {
  const due = ctx.nextCheckin;
  if (!due) return [];
  return [0, ...CHECKIN_FOLLOW_UPS].flatMap((after) => {
    const date = addDays(due, after);
    if (!ahead('checkin', date, clock)) return [];
    return [{
      id: `checkin-${date}`,
      kind: 'checkin' as const,
      title: after === 0 ? 'Check-in due' : 'Check-in still due',
      body: after === 0
        ? 'Weight and measurements — same time of day as last time.'
        : 'Weight and measurements take a couple of minutes, and keep the comparison honest.',
      trigger: { date, ...AT.checkin },
    }];
  });
}

export function plannedReminders(
  on: Partial<Record<ReminderKey, boolean>>,
  ctx: ReminderContext,
  clock: Clock,
): PlannedReminder[] {
  const programDays = new Set(ctx.programWeekdays);
  return [
    ...(on.workout ? daily('workout', ctx, clock).filter((r) => programDays.has(weekdayOf(r.trigger.date))) : []),
    ...(on.weigh_in ? daily('weigh_in', ctx, clock) : []),
    ...(on.meal_log ? daily('meal_log', ctx, clock) : []),
    ...(on.checkin ? checkins(ctx, clock) : []),
  ];
}
