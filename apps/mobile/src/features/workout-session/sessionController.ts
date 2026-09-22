/**
 * The glue between the draft store, the outbox and the API.
 *
 * Nothing here is on the commit path — `commitSet` returns long before any of
 * this runs (**I10**). This is the background half: adopting server ids, flushing
 * the queue, and finishing.
 */
import { ApiError, api } from '../../lib/api';
import { store } from '../../lib/db';
import { createOutbox, type SendResult } from '../../lib/offline/outbox';
import type { OutboxEntry } from '../../lib/db/types';
import { isRetryable } from '../../lib/query/client';
import { useSessionStore } from './store/sessionStore';

/** One outbox, wired to the real transport. */
export const outbox = createOutbox({
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
      if (e instanceof ApiError) {
        // A 4xx will never succeed on retry, so it becomes a failed entry the
        // Sync Center surfaces rather than a queue that spins for ever.
        return { ok: false, retryable: isRetryable(e), message: e.message };
      }
      return { ok: false, retryable: true, message: 'Could not reach the server.' };
    }
  },
});

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
