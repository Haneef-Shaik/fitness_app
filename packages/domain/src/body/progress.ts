/**
 * Goal progress, and the training streak.
 *
 * Both are numbers a user reads off a meter and draws a conclusion from, so
 * both are defined once and pinned by the shared vectors in
 * `contracts/vectors/domain.json` — the server computes them for the dashboard
 * and the client computes them for an optimistic update, and the two must never
 * disagree.
 */

export type GoalDirection = 'up' | 'down' | 'hold';

/**
 * A "hold" goal has a zero-width target, so progress needs a band rather than a
 * ratio. One percent of the target is roughly what a bathroom scale moves on
 * its own between two mornings.
 */
export const HOLD_TOLERANCE = 0.01;

/**
 * How far along a goal is, as a fraction of the distance from start to target.
 *
 * `null` when it cannot be known — no starting point, or nothing measured yet.
 * **Null is not zero**: "we have not weighed you" and "you have made no
 * progress" are different statements, and a meter drawn at 0% makes the first
 * read as the second.
 *
 * Overshoot is **capped at 1**, because more than finished is still finished.
 * Going the wrong way is **not** clamped — it returns a negative number, and
 * the UI is expected to show it. Hiding a regression behind a 0% meter is how
 * somebody finds out in three months.
 */
export function goalProgress({
  start, target, current, direction,
}: {
  start: number | null;
  target: number;
  current: number | null;
  direction: GoalDirection;
}): number | null {
  if (start === null || current === null) return null;

  if (direction === 'hold') {
    const band = Math.abs(target) * HOLD_TOLERANCE;
    return Math.abs(current - target) <= band ? 1 : 0;
  }

  const distance = target - start;
  if (distance === 0) return current === target ? 1 : 0;

  const travelled = (current - start) / distance;
  return Math.min(1, travelled);
}

/**
 * Consecutive days ending today — or yesterday.
 *
 * Yesterday counts because today is not over. A streak that resets at midnight
 * punishes somebody for not having trained yet at 09:00, which is the opposite
 * of what a streak is for.
 *
 * Dates are ISO `YYYY-MM-DD` strings in the profile's timezone, already
 * resolved. Nothing here parses a timestamp, because nothing here should be
 * deciding which day anything happened on (**I7**).
 */
export function trainingStreak(today: string, days: readonly string[]): number {
  if (days.length === 0) return 0;

  const trained = new Set(days);
  // A session dated ahead of the profile's "today" is a timezone edge, not a
  // reason to drop it: start from the latest day that was actually trained.
  const latest = [...trained].sort().at(-1)!;
  let cursor = latest > today ? latest : today;

  if (!trained.has(cursor)) {
    cursor = previousDay(cursor);
    if (!trained.has(cursor)) return 0;
  }

  let streak = 0;
  while (trained.has(cursor)) {
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
}

/** The day before, by calendar arithmetic rather than by subtracting 86400. */
export function previousDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
