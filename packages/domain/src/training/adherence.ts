/**
 * Adherence — **PRD W07.7**: `completed planned sessions ÷ planned sessions`.
 *
 * The other implementation is `services/api/app/domain/adherence.py`, and
 * `contracts/vectors/domain.json` pins the two together. Two implementations of
 * a number are allowed; a third, in SQL, is not.
 *
 * Two judgements the bare ratio does not make:
 *
 * **No plan is undefined, never zero.** Someone without a program has not
 * failed to adhere to anything, and G-06 says "no plan yet" rather than "0%".
 *
 * **More than planned is 1.0, not 1.25.** Adherence answers "did you do what you
 * said you would". An extra session is not partial credit toward a different
 * question, and uncapped it overruns the meter.
 */

/** `null` when nothing was planned — undefined, not zero. */
export function adherence(completedPlanned: number, planned: number): number | null {
  if (planned <= 0) return null;
  return Math.min(1, completedPlanned / planned);
}

/**
 * How many times the scheduled weekdays fall in `[start, end]`, inclusive.
 *
 * `weekdays` uses the plan tree's convention: 0 = Sunday.
 *
 * Walks the range rather than doing arithmetic on week counts, because that is
 * where the off-by-one lives: a range starting and ending on the same scheduled
 * day counts 1, and a reversed range counts 0 rather than something negative.
 *
 * Dates are ISO calendar days (`YYYY-MM-DD`), read in UTC so no local offset can
 * shift a day — the day has already been resolved to the user's own (I7).
 */
export function plannedOccurrences(
  weekdays: readonly number[],
  start: string,
  end: string,
): number {
  if (weekdays.length === 0) return 0;

  const from = Date.parse(`${start}T00:00:00Z`);
  const to = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return 0;

  const wanted = new Set(weekdays);
  let count = 0;
  for (let t = from; t <= to; t += 86_400_000) {
    // getUTCDay(): Sunday === 0, which is already the plan tree's convention.
    if (wanted.has(new Date(t).getUTCDay())) count += 1;
  }
  return count;
}
