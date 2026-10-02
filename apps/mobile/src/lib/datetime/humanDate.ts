/**
 * "Today", "Yesterday", "Sun 20 Sep" — a server `local_date` written the way
 * a person says it.
 *
 * `relative: false` always names the day — for a heading that sits beside a
 * relative label and would otherwise repeat it.
 *
 * Both inputs are CALENDAR dates (I7): they are parsed as UTC noon and
 * compared as days, so the phone's timezone can never move one. Anything
 * that is not a `YYYY-MM-DD` comes back untouched rather than as "Invalid Date".
 */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 86_400_000;

function parseDay(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const at = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
  return Number.isNaN(at.getTime()) ? null : at;
}

export function humanDate(
  localDate: string,
  today: string,
  { relative = true }: { relative?: boolean } = {},
): string {
  const day = parseDay(localDate);
  const now = parseDay(today);
  if (!day || !now) return localDate;

  const diff = Math.round((now.getTime() - day.getTime()) / DAY_MS);
  if (relative && diff === 0) return 'Today';
  if (relative && diff === 1) return 'Yesterday';
  if (relative && diff === -1) return 'Tomorrow';

  const base = `${DAYS[day.getUTCDay()]} ${day.getUTCDate()} ${MONTHS[day.getUTCMonth()]}`;
  return day.getUTCFullYear() === now.getUTCFullYear() ? base : `${base} ${day.getUTCFullYear()}`;
}
