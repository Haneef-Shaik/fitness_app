/**
 * Date ranges for the G-screens.
 *
 * Built from LOCAL calendar dates (**I7**) and sent explicitly, so the server
 * never has to guess which day the user is living in. `Date` is used only to
 * step calendar days, never to interpret a time of day.
 */
export interface Range {
  from: string;
  to: string;
}

export function rangeOf(weeks: number, today: Date = new Date()): Range {
  const end = new Date(today);
  const start = new Date(today);
  start.setDate(start.getDate() - weeks * 7);
  return { from: iso(start), to: iso(end) };
}

export function iso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "22 Sep" — an axis tick, not a sentence. */
export function weekTick(isoDate: string): string {
  const [, m, d] = isoDate.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[(m ?? 1) - 1]}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
