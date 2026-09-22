/**
 * How a session reads on F-01, F-05 and F-06.
 *
 * One formatter, because the three screens describe the same thing and a user
 * moving between them should not meet three different phrasings of "62 min,
 * 8,240 kg". It is also the only place that decides what a session is *called*
 * when it has no name: the exercises it contained.
 */
import type { HistoryItem } from '@volt/api-types';

/** Thousands separators, no decimals — a kg figure with decimals reads as noise. */
export function formatVolume(kg: number | null | undefined): string | null {
  if (kg === null || kg === undefined || kg <= 0) return null;
  return `${Math.round(kg).toLocaleString('en-US')} kg`;
}

/**
 * Minutes, the way the wireframes write a session: "62 min", not "1 h 2 min".
 *
 * A workout is spoken in minutes at any realistic length, so hours only appear
 * past three — by which point the number has stopped being a duration and
 * started being a sign someone left the session open (PRD §7.6).
 */
const MINUTES_BEFORE_HOURS = 180;

export function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.round(seconds / 60);
  if (mins < MINUTES_BEFORE_HOURS) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/**
 * "5 days ago", "Yesterday", "Today".
 *
 * Both dates are read as calendar days, never as instants: the session's day is
 * already the user's local day (I7), so subtracting timestamps would reintroduce
 * exactly the timezone error AC-03 exists to prevent.
 */
export function relativeDay(localDate: string, today: string): string {
  const days = daysBetween(localDate, today);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 0) return localDate;
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'Last week';
  return `${Math.floor(days / 7)} weeks ago`;
}

export function daysBetween(from: string, to: string): number {
  const a = Date.UTC(...ymd(from));
  const b = Date.UTC(...ymd(to));
  return Math.round((b - a) / 86_400_000);
}

function ymd(iso: string): [number, number, number] {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return [y ?? 1970, (m ?? 1) - 1, d ?? 1];
}

export interface SessionSummary {
  title: string;
  headline: string;
  dateLabel: string;
}

export function formatSessionSummary(
  row: Pick<HistoryItem, 'local_date' | 'total_volume_kg' | 'duration_seconds' | 'set_count' | 'exercise_names'>,
  today: string = new Date().toISOString().slice(0, 10),
): SessionSummary {
  const names = row.exercise_names ?? [];
  const title = names.length === 0
    ? 'Empty session'
    : names.length <= 2
      ? names.join(' & ')
      : `${names[0]} +${names.length - 1} more`;

  const bits = [
    `${row.set_count} set${row.set_count === 1 ? '' : 's'}`,
    formatDuration(row.duration_seconds),
    formatVolume(row.total_volume_kg),
  ].filter(Boolean);

  return {
    title,
    headline: bits.join(' · '),
    dateLabel: relativeDay(row.local_date, today),
  };
}
