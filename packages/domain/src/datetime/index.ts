/**
 * The ONLY way to derive a calendar date in this codebase.
 * Every instant is stored UTC; every day-bucket uses the profile's timezone (BRD §7).
 * `new Date().toDateString()` is banned — it silently uses the device timezone.
 */
export function toLocalDate(instant: Date | string, timeZone: string): string {
  const d = typeof instant === 'string' ? new Date(instant) : instant;
  // en-CA formats as YYYY-MM-DD; Intl handles DST transitions correctly.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

/** Start of the user's week, honouring their configured week start (K-03). */
export function startOfWeek(localDate: string, weekStartsOn: 0 | 1 | 6 = 1): string {
  const [y, m, d] = localDate.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  const shift = (dt.getUTCDay() - weekStartsOn + 7) % 7;
  dt.setUTCDate(dt.getUTCDate() - shift);
  return dt.toISOString().slice(0, 10);
}
