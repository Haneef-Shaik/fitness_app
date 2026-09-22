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

/** Marks every set in the draft according to what the flush achieved. */
export async function flushAndReconcile(): Promise<void> {
  await outbox.flush();
  const { failed } = await outbox.status();

  const byKey = new Map(failed.map((f) => [f.idempotencyKey, f.lastError ?? 'Rejected.']));
  const draft = useSessionStore.getState().draft;
  if (!draft) return;

  const mark = useSessionStore.getState().markSync;
  for (const exercise of draft.exercises) {
    for (const s of exercise.sets) {
      if (byKey.has(s.clientId)) mark(s.clientId, 'failed', byKey.get(s.clientId));
      else if (s.syncState === 'pending') mark(s.clientId, 'synced');
    }
  }
}
