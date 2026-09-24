/**
 * The write outbox (docs/03 §7, H3.2).
 *
 * It lives in `lib/offline` rather than inside the session feature because **G7
 * and G9 reuse it** — meal items and body metrics queue the same way. Nothing
 * here knows what a set is.
 *
 * Three rules it exists to keep:
 *  - **FIFO per aggregate, parallel across aggregates.** One stuck session must
 *    not hold up another, but within a session order is meaning.
 *  - **A terminal 4xx is never dropped.** It moves to a failed list the Sync
 *    Center surfaces; silently discarding a user's set is the worst outcome here.
 *  - **Idempotency is the client's contract** (**I8**): the key is generated once
 *    at commit and replayed unchanged, so a duplicate delivery is a no-op.
 */
import type { OutboxEntry, SessionStore } from '../db/types';
import { nextAttemptAt } from './backoff';

export interface SendResult {
  ok: boolean;
  /** True when retrying could still succeed: 5xx, timeout, offline, 408/409/429. */
  retryable: boolean;
  /**
   * The server was never reached. Such a write never exhausts its attempts:
   * docs/03 §7 keeps an offline write pending, and offline for a day is normal.
   */
  unreachable?: boolean;
  /**
   * The server refused it for want of a session (401). Nothing is wrong with
   * the write: it waits for the next sign-in and never exhausts. It used to
   * fail with "Log back in to carry on" and keep saying so after the user had
   * (a11y finding #20).
   */
  awaitingSignIn?: boolean;
  message?: string;
}

export interface OutboxDeps {
  store: SessionStore;
  /** Performs the request. Never throws — it reports. */
  send: (entry: OutboxEntry) => Promise<SendResult>;
  now?: () => Date;
  random?: () => number;
  /** Stop after this many terminal-ish attempts even if the server keeps 5xx-ing. */
  maxAttempts?: number;
}

export interface FlushOutcome {
  sent: number;
  retried: number;
  failed: number;
  /** Aggregates whose queue stopped early because an earlier entry did not land. */
  blocked: string[];
}

export const DEFAULT_MAX_ATTEMPTS = 8;

/**
 * What a write that never reached the server records as its last error. One
 * constant because L-02 reads it back as the app's only connectivity signal.
 */
export const UNREACHABLE = 'Could not reach the server.';

/** What a write refused for want of a session records while it waits (a11y #20). */
export const AWAITING_SIGN_IN = 'Waiting for you to sign in.';

export function createOutbox(deps: OutboxDeps) {
  const now = deps.now ?? (() => new Date());
  const random = deps.random ?? Math.random;
  const maxAttempts = deps.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  let flushing: Promise<FlushOutcome> | null = null;
  let trailing: Promise<FlushOutcome> | null = null;

  async function run(): Promise<FlushOutcome> {
    const at = now();
    const ready = await deps.store.readyEntries(at.toISOString());

    const outcome: FlushOutcome = { sent: 0, retried: 0, failed: 0, blocked: [] };
    // Order is meaning within an aggregate, so a failure stops that queue and
    // leaves the rest of it for the next flush.
    const stopped = new Set<string>();

    for (const entry of ready) {
      if (stopped.has(entry.aggregateId)) continue;

      const result = await deps.send(entry);

      if (result.ok) {
        await deps.store.markSent(entry.id);
        outcome.sent += 1;
        continue;
      }

      // Only a server that ANSWERS and keeps failing uses up attempts.
      const waiting = result.unreachable || result.awaitingSignIn;
      const exhausted = !waiting && entry.attempts + 1 >= maxAttempts;
      if (result.retryable && !exhausted) {
        await deps.store.markRetry(
          entry.id,
          nextAttemptAt(entry.attempts, at, random),
          result.message ?? UNREACHABLE,
        );
        outcome.retried += 1;
      } else {
        await deps.store.markFailed(
          entry.id,
          result.message ?? (exhausted ? 'Gave up after repeated failures.' : 'Rejected.'),
        );
        outcome.failed += 1;
      }

      stopped.add(entry.aggregateId);
      outcome.blocked.push(entry.aggregateId);
    }

    return outcome;
  }

  /**
   * Flushes once, and never two runs at a time.
   *
   * A caller that arrives mid-run is NOT given the in-flight promise: `run()`
   * reads its work list up front, so that run can never see an entry enqueued
   * since it started. Sharing it silently stranded the caller's write — on a
   * phone, the third set of three stayed "Waiting to sync" for ever while the
   * server held two. Such callers are coalesced onto one trailing run instead,
   * which starts once the current one has settled and reads the queue afresh.
   */
  function flush(): Promise<FlushOutcome> {
    if (!flushing) {
      flushing = run().finally(() => { flushing = null; });
      return flushing;
    }
    if (!trailing) {
      // Chained off `flushing` (already past its own `finally`), so by the time
      // this runs the slot is free and the recursive call starts a fresh run.
      trailing = flushing.catch(() => undefined).then(() => {
        trailing = null;
        return flush();
      });
    }
    return trailing;
  }

  return {
    flush,

    /** Everything the Sync Center shows: pending count and the failed list. */
    async status() {
      const all = await deps.store.allEntries();
      return {
        pending: all.filter((e) => e.state === 'pending').length,
        failed: all.filter((e) => e.state === 'failed'),
      };
    },
  };
}
