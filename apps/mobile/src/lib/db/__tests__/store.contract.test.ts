/**
 * One contract, run against every implementation.
 *
 * The SQLite store cannot run here — `expo-sqlite` is a native module with no
 * web or Node build — so this suite proves the *contract* against the in-memory
 * twin, and G4 runs the same expectations against SQLite on a device. Writing it
 * once means the two cannot quietly diverge in behaviour, only in speed.
 */
import { createMemoryStore } from '../memory';
import type { NewOutboxEntry, SessionStore } from '../types';

const draft = (revision: number, json = '{}') => ({
  revision, updatedAt: `2026-09-22T10:0${revision}:00Z`, json,
});

const entry = (key: string, aggregateId = 's1', at = '2026-09-22T10:00:00Z'): NewOutboxEntry => ({
  aggregateId, method: 'POST', path: `/session-exercises/${aggregateId}/sets`,
  body: JSON.stringify({ reps: 8 }), idempotencyKey: key, nextAttemptAt: at,
});

function contract(name: string, make: () => SessionStore) {
  describe(name, () => {
    let store: SessionStore;
    beforeEach(async () => { store = make(); await store.open(); await store.reset(); });

    describe('draft', () => {
      it('starts empty — a first launch has no session', async () => {
        await expect(store.loadDraft()).resolves.toBeNull();
      });

      it('round-trips the draft whole', async () => {
        await store.commit(draft(1, '{"sets":[]}'));
        await expect(store.loadDraft()).resolves.toEqual(draft(1, '{"sets":[]}'));
      });

      it('rewrites rather than appends — there is exactly one draft', async () => {
        await store.commit(draft(1));
        await store.commit(draft(2));
        const d = await store.loadDraft();
        expect(d?.revision).toBe(2);
      });

      it('clears', async () => {
        await store.commit(draft(1));
        await store.clearDraft();
        await expect(store.loadDraft()).resolves.toBeNull();
      });
    });

    describe('the atomic commit (the reason D14 chose a database)', () => {
      it('lands the draft and the outbox entry together', async () => {
        await store.commit(draft(1), entry('k1'));

        expect((await store.loadDraft())?.revision).toBe(1);
        expect(await store.allEntries()).toHaveLength(1);
      });

      it('writes the draft alone when a change produces no request', async () => {
        // Renaming a note rewrites the draft without enqueuing anything.
        await store.commit(draft(1));
        expect(await store.allEntries()).toHaveLength(0);
      });

      it('I8: the same idempotency key never appends a second entry', async () => {
        // A retried offline write arriving twice is routine, not exceptional.
        await store.commit(draft(1), entry('k1'));
        await store.commit(draft(2), entry('k1'));

        const all = await store.allEntries();
        expect(all).toHaveLength(1);
        expect((await store.loadDraft())?.revision).toBe(2);
      });
    });

    describe('outbox ordering', () => {
      it('returns nothing before the backoff has elapsed', async () => {
        await store.commit(draft(1), entry('k1', 's1', '2026-09-22T10:05:00Z'));
        await expect(store.readyEntries('2026-09-22T10:00:00Z')).resolves.toEqual([]);
        await expect(store.readyEntries('2026-09-22T10:05:00Z')).resolves.toHaveLength(1);
      });

      it('is FIFO within one aggregate', async () => {
        await store.commit(draft(1), entry('k1'));
        await store.commit(draft(2), entry('k2'));
        await store.commit(draft(3), entry('k3'));

        const ready = await store.readyEntries('2026-09-22T11:00:00Z');
        expect(ready.map((e) => e.idempotencyKey)).toEqual(['k1', 'k2', 'k3']);
      });

      it('groups by aggregate so one stuck session cannot block another', async () => {
        await store.commit(draft(1), entry('a1', 's1'));
        await store.commit(draft(2), entry('b1', 's2'));
        await store.commit(draft(3), entry('a2', 's1'));

        const ready = await store.readyEntries('2026-09-22T11:00:00Z');
        const s1 = ready.filter((e) => e.aggregateId === 's1').map((e) => e.idempotencyKey);
        expect(s1).toEqual(['a1', 'a2']);
      });

      it('honours the limit', async () => {
        for (const k of ['k1', 'k2', 'k3']) await store.commit(draft(1), entry(k));
        await expect(store.readyEntries('2026-09-22T11:00:00Z', 2)).resolves.toHaveLength(2);
      });
    });

    describe('outbox outcomes', () => {
      it('a sent entry leaves the ready queue', async () => {
        await store.commit(draft(1), entry('k1'));
        const [e] = await store.readyEntries('2026-09-22T11:00:00Z');

        await store.markSent(e!.id);

        await expect(store.readyEntries('2026-09-22T11:00:00Z')).resolves.toEqual([]);
      });

      it('a retry bumps attempts and pushes the next attempt out', async () => {
        await store.commit(draft(1), entry('k1'));
        const [e] = await store.readyEntries('2026-09-22T11:00:00Z');

        await store.markRetry(e!.id, '2026-09-22T12:00:00Z', 'offline');

        const [again] = await store.allEntries();
        expect(again!.attempts).toBe(1);
        expect(again!.lastError).toBe('offline');
        await expect(store.readyEntries('2026-09-22T11:30:00Z')).resolves.toEqual([]);
        await expect(store.readyEntries('2026-09-22T12:00:00Z')).resolves.toHaveLength(1);
      });

      it('a terminal failure is kept and surfaced, never dropped', async () => {
        // docs/03 §7 — a 4xx moves to a failed list in the Sync Center.
        await store.commit(draft(1), entry('k1'));
        const [e] = await store.readyEntries('2026-09-22T11:00:00Z');

        await store.markFailed(e!.id, 'Reps must be at least 1.');

        await expect(store.readyEntries('2026-09-22T11:00:00Z')).resolves.toEqual([]);
        const all = await store.allEntries();
        expect(all).toHaveLength(1);
        expect(all[0]!.state).toBe('failed');
        expect(all[0]!.lastError).toBe('Reps must be at least 1.');
      });
    });
  });
}

contract('memory store', createMemoryStore);
