/**
 * H-14's ranges. Dates are calendar dates (YYYY-MM-DD) from the server's
 * "today" (I7), handled in UTC so the phone's own timezone can never move one.
 */
export type RangeKind = 'week' | 'month' | 'quarter' | 'custom';

/** How many days each preset spans, today included. Matches the server's 92-day cap. */
const SPAN: Record<Exclude<RangeKind, 'custom'>, number> = { week: 7, month: 30, quarter: 90 };
export const MAX_DAYS = 92;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parse(d: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) return null;
  const at = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return at.getUTCMonth() === Number(m[2]) - 1 && at.getUTCDate() === Number(m[3]) ? at : null;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: string, n: number) => iso(new Date(parse(d)!.getTime() + n * 86_400_000));
const daysBetween = (a: string, b: string) => Math.round((parse(b)!.getTime() - parse(a)!.getTime()) / 86_400_000) + 1;

export function rangeFor(kind: Exclude<RangeKind, 'custom'>, today: string): { from: string; to: string } {
  return { from: addDays(today, -(SPAN[kind] - 1)), to: today };
}

/** "1 – 21 Sep 2026 · 21 days", with the month and year said once where they are shared. */
export function rangeLabel(from: string, to: string): string {
  const a = parse(from)!;
  const b = parse(to)!;
  const n = daysBetween(from, to);
  const count = `${n} day${n === 1 ? '' : 's'}`;
  const day = (d: Date) => d.getUTCDate();
  const mon = (d: Date) => MONTHS[d.getUTCMonth()];
  const yr = (d: Date) => d.getUTCFullYear();
  if (from === to) return `${day(b)} ${mon(b)} ${yr(b)} · ${count}`;
  const sameYear = yr(a) === yr(b);
  const sameMonth = sameYear && a.getUTCMonth() === b.getUTCMonth();
  const start = sameMonth ? `${day(a)}` : sameYear ? `${day(a)} ${mon(a)}` : `${day(a)} ${mon(a)} ${yr(a)}`;
  return `${start} – ${day(b)} ${mon(b)} ${yr(b)} · ${count}`;
}

/** Why a typed custom range cannot be used, or null when it can. */
export function validCustom(from: string, to: string, today: string): string | null {
  if (!parse(from) || !parse(to)) return 'Use a real date, as YYYY-MM-DD.';
  if (to < from) return 'The range ends before it starts.';
  if (to > today) return 'A range cannot run into the future.';
  if (daysBetween(from, to) > MAX_DAYS) return 'Pick a range of three months or less.';
  return null;
}
