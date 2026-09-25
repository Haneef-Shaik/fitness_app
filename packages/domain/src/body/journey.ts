/**
 * A goal as a journey: milestones a quarter of the way apart, which of them
 * the latest check-in has reached, and when the target should be hit.
 *
 * Added in G10 from the owner's review. The projection uses the pace actually
 * achieved once there is at least a week of data, and the pace the user chose
 * before that; going the wrong way gets no date at all rather than a made-up
 * one. Dates are calendar dates (YYYY-MM-DD) handled in UTC so no timezone can
 * move them.
 */
import { goalProgress } from './progress';

export interface JourneyInput {
  start: number;
  target: number;
  direction: 'up' | 'down';
  startDate: string;
  /** Chosen pace, units per week, positive. */
  weeklyRate: number | null;
  /** The latest check-in, or null before the first. */
  current: number | null;
  /** The server's local date (I7). */
  today: string;
}

export interface Milestone { value: number; fraction: number; reached: boolean }

export interface Journey {
  milestones: Milestone[];
  next: Milestone | null;
  done: boolean;
  /** 0..1, or null when there is no check-in to measure — null is not zero. */
  progress: number | null;
  remaining: number | null;
  /** `steady`: a week or more with no change at all — not the same as going the wrong way. */
  pace: 'planned' | 'actual' | 'steady' | 'off-track' | 'unknown';
  actualWeeklyRate: number | null;
  projectedDate: string | null;
}

const STEPS = [0.25, 0.5, 0.75, 1];
const DAY_MS = 86_400_000;

const toUtc = (d: string) => {
  const [y, m, day] = d.split('-').map(Number);
  return Date.UTC(y!, m! - 1, day!);
};
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const addWeeks = (date: string, weeks: number) => iso(toUtc(date) + Math.round(weeks * 7) * DAY_MS);
const round = (n: number) => Math.round(n * 100) / 100;

export function goalJourney(g: JourneyInput): Journey {
  const total = Math.abs(g.target - g.start);
  const sign = g.direction === 'down' ? -1 : 1;
  const passed = (value: number) =>
    g.current != null && (g.direction === 'down' ? g.current <= value : g.current >= value);

  const milestones = STEPS.map((fraction) => {
    const value = round(g.start + sign * total * fraction);
    return { value, fraction, reached: passed(value) };
  });
  const next = milestones.find((m) => !m.reached) ?? null;
  const done = g.current != null && next === null;

  const progress = g.current == null
    ? null
    : goalProgress({ start: g.start, target: g.target, current: g.current, direction: g.direction });
  const remaining = g.current == null ? null : round(Math.max(0, sign * (g.target - g.current)));

  const weeks = (toUtc(g.today) - toUtc(g.startDate)) / (7 * DAY_MS);
  const moved = g.current == null ? 0 : sign * (g.current - g.start);   // positive = the right way

  if (g.current != null && weeks >= 1) {
    const rate = moved / weeks;
    if (rate === 0 && !done) {
      return { milestones, next, done, progress, remaining, pace: 'steady',
               actualWeeklyRate: 0, projectedDate: null };
    }
    if (rate <= 0) {
      return { milestones, next, done, progress, remaining, pace: 'off-track',
               actualWeeklyRate: round(rate), projectedDate: null };
    }
    return { milestones, next, done, progress, remaining, pace: 'actual', actualWeeklyRate: rate,
             projectedDate: done ? g.today : addWeeks(g.today, remaining! / rate) };
  }

  if (g.weeklyRate != null && g.weeklyRate > 0) {
    return { milestones, next, done, progress, remaining, pace: 'planned', actualWeeklyRate: null,
             projectedDate: addWeeks(g.startDate, total / g.weeklyRate) };
  }
  return { milestones, next, done, progress, remaining, pace: 'unknown',
           actualWeeklyRate: null, projectedDate: null };
}
