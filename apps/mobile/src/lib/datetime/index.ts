/**
 * Dates on the client are for **display only**.
 *
 * **I7 — the day is the profile's day.** The client never decides which day a
 * workout or a meal belongs to: the server computes `local_date` with
 * `to_local_date(started_at, profile.timezone)` and sends it down as a string.
 * Nothing here buckets anything, and nothing here may start to.
 *
 * That is also the answer to the Hermes `Intl` question G0 raised and G1 carried:
 * `Intl.DateTimeFormat` with a `timeZone` is a **Hermes build option**, and a
 * build without it would break a date *label*, not a date *decision*. So the
 * formatter below degrades instead of throwing, and I7 holds either way. No
 * `date-fns-tz` dependency is needed for what the client actually does.
 */

/** Does this JS runtime support `Intl.DateTimeFormat` with a `timeZone`? */
export function hasTimeZoneSupport(): boolean {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Australia/Sydney' }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/**
 * "Tuesday 22 Sept" in the profile's zone.
 *
 * Falls back to the device's own zone if the runtime cannot do zones, and to a
 * plain ISO date if it cannot format at all. A wrong-by-one-day *label* is a
 * cosmetic bug; a crash on the dashboard is not.
 */
export function formatDayLabel(instant: Date, timeZone: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long', day: 'numeric', month: 'short',
  };
  try {
    return new Intl.DateTimeFormat('en-GB', { ...opts, timeZone }).format(instant);
  } catch {
    try {
      return new Intl.DateTimeFormat('en-GB', opts).format(instant);
    } catch {
      return instant.toISOString().slice(0, 10);
    }
  }
}

/**
 * "07:05" — an instant's time of day in the profile's zone, 24-hour.
 *
 * Never the ISO string's own time, which is UTC. Degrades like
 * `formatDayLabel`: the device's zone if the one given cannot be used, then
 * UTC, and never a throw.
 */
export function formatClockTime(instant: Date, timeZone?: string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  try {
    return new Intl.DateTimeFormat('en-GB', timeZone ? { ...opts, timeZone } : opts).format(instant);
  } catch {
    try {
      return new Intl.DateTimeFormat('en-GB', opts).format(instant);
    } catch {
      return instant.toISOString().slice(11, 16);
    }
  }
}

/** `2026-09-22` → `22 Sept`. Input is the SERVER's local_date, never recomputed. */
export function formatServerDate(localDate: string): string {
  const parts = localDate.split('-');
  if (parts.length !== 3) return localDate;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return localDate;
  try {
    // Noon UTC: far enough from either midnight that no zone shifts the date.
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
      .format(new Date(Date.UTC(y, m - 1, d, 12)));
  } catch {
    return localDate;
  }
}
