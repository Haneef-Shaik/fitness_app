/**
 * Retry timing for the outbox (docs/03 §7).
 *
 * Exponential 1 s → 60 s, **with jitter**. The jitter is not decoration: every
 * phone that lost connectivity in the same tunnel would otherwise retry on the
 * same schedule and arrive together.
 */
export const BASE_DELAY_MS = 1_000;
export const MAX_DELAY_MS = 60_000;

/** Full-jitter: a uniform pick from [0, capped], which spreads a reconnect burst. */
export function backoffMs(attempts: number, random: () => number = Math.random): number {
  const capped = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** Math.max(0, attempts));
  return Math.round(random() * capped);
}

export function nextAttemptAt(
  attempts: number, now: Date, random: () => number = Math.random,
): string {
  return new Date(now.getTime() + backoffMs(attempts, random)).toISOString();
}
