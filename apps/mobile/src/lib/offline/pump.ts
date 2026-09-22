/**
 * The heartbeat that retries a queued write.
 *
 * Every other trigger the outbox has is something the user does — mounting the
 * screen, foregrounding the app, committing a set. None of those happen while
 * someone is resting between sets with the phone face down, which is exactly
 * when a server that went away comes back.
 *
 * It is deliberately dumb: a fixed tick that calls flush. The outbox already
 * decides what is due (`readyEntries` honours each entry's backoff), so making
 * this clever would put the same decision in two places.
 */
export interface PumpDeps {
  /** Never awaited by the timer — a slow flush must not stack ticks. */
  flush: () => Promise<unknown> | void;
  intervalMs?: number;
}

/** Roughly a rest period, and cheap: a no-op tick is one indexed SQLite read. */
export const DEFAULT_PUMP_INTERVAL_MS = 15_000;

export function startOutboxPump({
  flush,
  intervalMs = DEFAULT_PUMP_INTERVAL_MS,
}: PumpDeps): () => void {
  const id = setInterval(() => {
    // A rejected flush must not kill the timer, or the first failed retry
    // becomes the last one — the opposite of the point.
    try {
      void Promise.resolve(flush()).catch(() => {});
    } catch { /* a synchronous throw is still just a failed attempt */ }
  }, intervalMs);

  return () => clearInterval(id);
}
