import { createMemoryStore } from '../../db/memory';
import type { NewOutboxEntry, SessionStore } from '../../db/types';
import { createOutbox, type SendResult } from '../outbox';
import { isUuid, uuid } from '../../uuid';

const AT = new Date('2026-09-22T10:00:00Z');
const now = () => AT;
const noJitter = () => 1;

const entry = (key: string, aggregateId = 's1'): NewOutboxEntry => ({
  aggregateId, method: 'POST', path: `/session-exercises/${aggregateId}/sets`,
  body: JSON.stringify({ reps: 8 }), idempotencyKey: key,
  nextAttemptAt: '2026-09-22T09:00:00Z',
});

const draft = (revision: number) => ({
  revision, updatedAt: '2026-09-22T10:00:00Z', json: '{}',
});

async function seed(store: SessionStore, keys: Array<[string, string?]>) {
  await store.open();
  let r = 0;
  for (const [key, agg] of keys) await store.commit(draft(++r), entry(key, agg));
}

const ok = (): SendResult => ({ ok: true, retryable: false });
const offline = (): SendResult => ({ ok: false, retryable: true, message: 'offline' });
const rejected = (m: string): SendResult => ({ ok: false, retryable: false, message: m });

describe('flush', () => {
  it('sends the ready queue and clears it', async () => {
    const store = createMemoryStore();
    await seed(store, [['k1'], ['k2']]);
    const send = jest.fn(async () => ok());

    const out = await createOutbox({ store, send, now, random: noJitter }).flush();

    expect(out.sent).toBe(2);
    expect(send).toHaveBeenCalledTimes(2);
    expect((await store.allEntries()).every((e) => e.state === 'sent')).toBe(true);
  });

  it('sends in order within one aggregate — order is meaning', async () => {
    const store = createMemoryStore();
    await seed(store, [['k1'], ['k2'], ['k3']]);
    const seen: string[] = [];

    await createOutbox({
      store, now, random: noJitter,
      send: async (e) => { seen.push(e.idempotencyKey); return ok(); },
    }).flush();

    expect(seen).toEqual(['k1', 'k2', 'k3']);
  });

  it('replays the idempotency key unchanged (I8)', async () => {
    // The whole duplicate-protection contract is that the client does not
    // regenerate the key on retry.
    const store = createMemoryStore();
    await seed(store, [['stable-key']]);
    const keys: string[] = [];
    const send = async (e: { idempotencyKey: string }) => {
      keys.push(e.idempotencyKey);
      return keys.length === 1 ? offline() : ok();
    };

    // The clock has to move between flushes, or the backoff the first failure set
    // has not elapsed and the second flush correctly finds nothing to do.
    let clock = new Date('2026-09-22T12:00:00Z');
    const outbox = createOutbox({ store, send, now: () => clock, random: noJitter });
    await outbox.flush();
    clock = new Date('2026-09-22T12:05:00Z');
    await outbox.flush();

    expect(keys).toEqual(['stable-key', 'stable-key']);
  });

  it('never sends a sent entry twice', async () => {
    const store = createMemoryStore();
    await seed(store, [['k1']]);
    const send = jest.fn(async () => ok());
    const outbox = createOutbox({ store, send, now, random: noJitter });

    await outbox.flush();
    await outbox.flush();

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('shares an in-flight flush rather than racing itself', async () => {
    const store = createMemoryStore();
    await seed(store, [['k1']]);
    const send = jest.fn(async () => ok());
    const outbox = createOutbox({ store, send, now, random: noJitter });

    await Promise.all([outbox.flush(), outbox.flush(), outbox.flush()]);

    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe('the idempotency key must be a real UUID', () => {
  it('is the format the server types the header as', () => {
    // A non-UUID key 422s, which looks like "the set logged but never uploaded".
    // The unit tests here use readable keys, so this is where the real contract
    // with the server is asserted.
    expect(isUuid(uuid())).toBe(true);
  });
});

describe('failure handling', () => {
  it('retries a transient failure and pushes the next attempt out', async () => {
    const store = createMemoryStore();
    await seed(store, [['k1']]);

    const out = await createOutbox({
      store, send: async () => offline(), now, random: noJitter,
    }).flush();

    expect(out.retried).toBe(1);
    const [e] = await store.allEntries();
    expect(e!.state).toBe('pending');
    expect(e!.attempts).toBe(1);
    expect(e!.nextAttemptAt > AT.toISOString()).toBe(true);
  });

  it('a terminal rejection is kept and surfaced, never dropped', async () => {
    const store = createMemoryStore();
    await seed(store, [['k1']]);

    const out = await createOutbox({
      store, send: async () => rejected('Reps must be at least 1.'), now, random: noJitter,
    }).flush();

    expect(out.failed).toBe(1);
    const [e] = await store.allEntries();
    expect(e!.state).toBe('failed');
    expect(e!.lastError).toBe('Reps must be at least 1.');
  });

  it('gives up after maxAttempts rather than retrying for ever', async () => {
    const store = createMemoryStore();
    await seed(store, [['k1']]);
    await store.markRetry(1, '2026-09-22T09:00:00Z', 'offline');
    await store.markRetry(1, '2026-09-22T09:00:00Z', 'offline');

    const out = await createOutbox({
      store, send: async () => offline(), now, random: noJitter, maxAttempts: 3,
    }).flush();

    expect(out.failed).toBe(1);
    expect((await store.allEntries())[0]!.state).toBe('failed');
  });

  it('stops that aggregate\'s queue after a failure, so order survives', async () => {
    // Sending set 3 after set 2 failed would reorder the user's workout.
    const store = createMemoryStore();
    await seed(store, [['k1'], ['k2'], ['k3']]);
    const seen: string[] = [];

    const out = await createOutbox({
      store, now, random: noJitter,
      send: async (e) => { seen.push(e.idempotencyKey); return e.idempotencyKey === 'k2' ? offline() : ok(); },
    }).flush();

    expect(seen).toEqual(['k1', 'k2']);
    expect(out.blocked).toEqual(['s1']);
  });

  it('one stuck session never blocks another', async () => {
    const store = createMemoryStore();
    await seed(store, [['a1', 's1'], ['b1', 's2'], ['b2', 's2']]);
    const seen: string[] = [];

    await createOutbox({
      store, now, random: noJitter,
      send: async (e) => { seen.push(e.idempotencyKey); return e.aggregateId === 's1' ? offline() : ok(); },
    }).flush();

    expect(seen).toContain('b1');
    expect(seen).toContain('b2');
  });
});

describe('status — what the Sync Center shows', () => {
  it('counts pending and lists failures', async () => {
    const store = createMemoryStore();
    await seed(store, [['k1', 's1'], ['k2', 's2']]);
    const outbox = createOutbox({
      store, now, random: noJitter,
      send: async (e) => (e.aggregateId === 's1' ? rejected('nope') : ok()),
    });

    await outbox.flush();

    const status = await outbox.status();
    expect(status.pending).toBe(0);
    expect(status.failed).toHaveLength(1);
    expect(status.failed[0]!.lastError).toBe('nope');
  });
});
