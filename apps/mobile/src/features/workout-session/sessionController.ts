/**
 * The glue between the draft store, the outbox and the API.
 *
 * Nothing here is on the commit path — `commitSet` returns long before any of
 * this runs (**I10**). This is the background half: adopting server ids, flushing
 * the queue, and finishing.
 */
import { ApiError, api } from '../../lib/api';
import { store } from '../../lib/db';
import { AWAITING_SIGN_IN, createOutbox, UNREACHABLE, type SendResult } from '../../lib/offline/outbox';
import type { OutboxEntry } from '../../lib/db/types';
import { isRetryable } from '../../lib/query/client';
import { useSessionStore } from './store/sessionStore';

/**
 * One outbox, wired to the real transport, built on first use.
 *
 * Lazily, not at module scope: binding the store when this module is imported
 * makes it impossible to swap — which is exactly the shape that left
 * `flushAndReconcile` untested while it shipped a sync dot that lied.
 */
let instance: ReturnType<typeof createOutbox> | null = null;

function build() {
  return createOutbox({
  store,
  send: async (entry: OutboxEntry): Promise<SendResult> => {
    try {
      await api.send(
        entry.method as 'POST' | 'PATCH' | 'PUT' | 'DELETE',
        entry.path,
        JSON.parse(entry.body),
        // I8 — the key the set was committed with, replayed unchanged.
        { 'Idempotency-Key': entry.idempotencyKey },
      );
      return { ok: true, retryable: false };
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        // No session, not a bad write: it waits for the next sign-in (a11y #20).
        return { ok: false, retryable: true, awaitingSignIn: true, message: AWAITING_SIGN_IN };
      }
      if (e instanceof ApiError) {
        // A 4xx will never succeed on retry, so it becomes a failed entry the
        // Sync Center surfaces rather than a queue that spins for ever.
        return { ok: false, retryable: isRetryable(e), message: e.message };
      }
      return { ok: false, retryable: true, unreachable: true, message: UNREACHABLE };
    }
  },
  });
}

export const outbox = {
  flush: () => (instance ??= build()).flush(),
  status: () => (instance ??= build()).status(),
  /** Tests build a fresh one per case. */
  __reset: () => { instance = null; },
};

/**
 * Marks every set in the draft according to what the outbox actually holds.
 *
 * The state comes from the entry, not from the absence of a failure. An earlier
 * version treated "not in the failed list" as sent, which showed a **Synced** dot
 * on a set that was still queued with the server unreachable — the one lie this
 * dot must never tell.
 */
export async function flushAndReconcile(): Promise<void> {
  await outbox.flush();

  const draft = useSessionStore.getState().draft;
  if (!draft) return;

  const entries = await store.allEntries();
  const byKey = new Map(entries.map((e) => [e.idempotencyKey, e]));

  const mark = useSessionStore.getState().markSync;
  for (const exercise of draft.exercises) {
    for (const s of exercise.sets) {
      const entry = byKey.get(s.clientId);
      if (!entry) continue;                        // never enqueued (still local)
      if (entry.state === 'sent') mark(s.clientId, 'synced');
      else if (entry.state === 'failed') mark(s.clientId, 'failed', entry.lastError);
      else mark(s.clientId, 'pending');            // queued, waiting on a network
    }
  }
}
