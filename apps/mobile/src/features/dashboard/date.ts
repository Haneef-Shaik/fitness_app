/**
 * B-01's header date — "Wednesday, 23 Sep".
 *
 * The input is the server's local date (I7), a CALENDAR date. It is parsed and
 * formatted as UTC so the phone's own timezone can never move it a day.
 */
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function friendlyDate(localDate: string): string {
  const [y, m, d] = localDate.split('-').map(Number);
  const at = new Date(Date.UTC(y!, m! - 1, d!));
  return `${DAYS[at.getUTCDay()]}, ${at.getUTCDate()} ${MONTHS[at.getUTCMonth()]}`;
}

/**
 * "4 Nov", or "13 Jan 2027" when the year is not `today`'s — for dates that
 * can be months off (a goal projection, a check-in), where a weekday is noise
 * and a missing year is ambiguous.
 */
export function shortDate(localDate: string, today: string): string {
  const [y, m, d] = localDate.split('-').map(Number);
  const sameYear = today.slice(0, 4) === localDate.slice(0, 4);
  return `${d} ${MONTHS[m! - 1]}${sameYear ? '' : ` ${y}`}`;
}
