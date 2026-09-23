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
    beforeEach(async () => { store = make(); await store.open(); await store.reset(); store.setOwner('user-a'); });

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

    describe('enqueue — a write with no draft behind it (G7)', () => {
      /**
       * G3 built the outbox "generic", and the QUEUE is: `createOutbox` only
       * touches readyEntries / markSent / markRetry / markFailed. What was NOT
       * generic is how an entry gets IN — `commit(draft, entry)` demands a
       * session draft, and a meal does not have one.
       *
       * G7's contract calls that a G3 defect to fix here rather than grounds
       * for a second queue, because two queues is how one of them silently
       * stops flushing.
       */
      it('accepts an entry with no draft at all', async () => {
        await store.enqueue({
          aggregateId: 'meal-1', method: 'POST', path: '/meals',
          body: JSON.stringify({ meal_type: 'lunch' }),
          idempotencyKey: 'meal-key-1', nextAttemptAt: '2026-09-22T09:00:00Z',
        });

        const ready = await store.readyEntries('2026-09-22T10:00:00Z');
        expect(ready).toHaveLength(1);
        expect(ready[0]!.path).toBe('/meals');
        expect(await store.loadDraft()).toBeNull();
      });

      it('leaves a session draft in progress untouched', async () => {
        // Not faking a draft is the point: logging lunch must not disturb a
        // workout someone is in the middle of.
        await store.commit(draft(7, '{"sets":[1]}'));

        await store.enqueue({
          aggregateId: 'meal-1', method: 'POST', path: '/meals', body: '{}',
          idempotencyKey: 'meal-key-2', nextAttemptAt: '2026-09-22T09:00:00Z',
        });

        const d = await store.loadDraft();
        expect(d?.revision).toBe(7);
        expect(d?.json).toBe('{"sets":[1]}');
      });

      it('is idempotent on the key, like every other enqueue (I8)', async () => {
        const base = {
          aggregateId: 'meal-1', method: 'POST' as const, path: '/meals',
          idempotencyKey: 'same-meal-key', nextAttemptAt: '2026-09-22T09:00:00Z',
        };

        await store.enqueue({ ...base, body: '{"v":1}' });
        await store.enqueue({ ...base, body: '{"v":2}' });

        const all = await store.allEntries();
        expect(all).toHaveLength(1);
        expect(all[0]!.body).toBe('{"v":2}');
      });
    });
    describe('what the Sync Center needs (L-02, G10)', () => {
      /**
       * G3 built the queue and G7 built the door. What neither built is the
       * way OUT: a terminal failure lands in `failed` and, until G10, nothing
       * could either retry it or throw it away.
       *
       * "Nothing is ever dropped silently" (L-02) is only true if a user has
       * somewhere to drop it deliberately.
       */
      it('requeues a failed entry so it is due again now', async () => {
        await store.commit(draft(1), entry('k1'));
        const [e] = await store.readyEntries('2026-09-22T11:00:00Z');
        await store.markFailed(e!.id, 'Reps must be at least 1.');

        await store.requeue(e!.id, '2026-09-22T12:00:00Z');

        const ready = await store.readyEntries('2026-09-22T12:00:00Z');
        expect(ready.map((r) => r.id)).toEqual([e!.id]);
        const [again] = await store.allEntries();
        expect(again!.state).toBe('pending');
        // The error is cleared: keeping it would make a successful retry look
        // like it had failed.
        expect(again!.lastError).toBeNull();
      });

      it('requeueing keeps the idempotency key, so a retry is the same write', async () => {
        await store.commit(draft(1), entry('k1'));
        const [e] = await store.readyEntries('2026-09-22T11:00:00Z');
        await store.markFailed(e!.id, 'nope');

        await store.requeue(e!.id, '2026-09-22T12:00:00Z');

        const [again] = await store.allEntries();
        // I8. A retry that generated a new key could double the write it is
        // retrying, which is the one thing the outbox exists to prevent.
        expect(again!.idempotencyKey).toBe('k1');
      });

      it('discards an entry outright', async () => {
        await store.commit(draft(1), entry('k1'));
        const [e] = await store.readyEntries('2026-09-22T11:00:00Z');
        await store.markFailed(e!.id, 'nope');

        await store.discard(e!.id);

        expect(await store.allEntries()).toEqual([]);
      });

      it('discarding one leaves the others alone', async () => {
        await store.commit(draft(1), entry('k1'));
        await store.commit(draft(2), entry('k2'));
        const all = await store.allEntries();

        await store.discard(all[0]!.id);

        const left = await store.allEntries();
        expect(left.map((r) => r.idempotencyKey)).toEqual(['k2']);
      });

      it('requeueing something that is not there is not an error', async () => {
        // A user taps retry; the pump drained it a moment earlier. That is
        // ordinary, not exceptional.
        await expect(store.requeue(9999, '2026-09-22T12:00:00Z')).resolves.toBeUndefined();
        await expect(store.discard(9999)).resolves.toBeUndefined();
      });
    });
    describe('one account never sees another\'s (found on a phone in G10)', () => {
      /**
       * The draft and the queue lived on the phone with no record of whose they
       * were. After the demo account's test runs, the owner's OWN account opened
       * on "You left a workout open" — the demo's workout — and "4 changes
       * couldn't sync", the demo's writes being sent with the owner's token.
       * K-01: an unfinished workout "will still be here when you sign back in".
       */
      it('keeps each account\'s draft to itself, and gives it back on return', async () => {
        await store.commit(draft(1, '{"who":"a"}'));
        store.setOwner('user-b');
        await expect(store.loadDraft()).resolves.toBeNull();
        await store.commit(draft(1, '{"who":"b"}'));
        store.setOwner('user-a');
        await expect(store.loadDraft()).resolves.toMatchObject({ json: '{"who":"a"}' });
      });

      it('keeps each account\'s queue to itself — and never SENDS another\'s', async () => {
        await store.enqueue(entry('ka'));
        store.setOwner('user-b');
        await store.enqueue(entry('kb'));
        expect((await store.allEntries()).map((e) => e.idempotencyKey)).toEqual(['kb']);
        expect((await store.readyEntries('2026-09-23T00:00:00Z')).map((e) => e.idempotencyKey)).toEqual(['kb']);
        store.setOwner('user-a');
        expect((await store.allEntries()).map((e) => e.idempotencyKey)).toEqual(['ka']);
      });

      it('clearing a draft clears only the signed-in account\'s', async () => {
        await store.commit(draft(1));
        store.setOwner('user-b');
        await store.commit(draft(1));
        await store.clearDraft();
        store.setOwner('user-a');
        await expect(store.loadDraft()).resolves.not.toBeNull();
      });

      it('signed out, there is nothing to read and nothing may be written', async () => {
        await store.commit(draft(1));
        await store.enqueue(entry('k1'));
        store.setOwner(null);
        await expect(store.loadDraft()).resolves.toBeNull();
        await expect(store.allEntries()).resolves.toEqual([]);
        await expect(store.readyEntries('2026-09-23T00:00:00Z')).resolves.toEqual([]);
        await expect(store.enqueue(entry('k2'))).rejects.toThrow(/signed in/);
        await expect(store.commit(draft(2))).rejects.toThrow(/signed in/);
      });
    });
  });
}

contract('memory store', createMemoryStore);
