/**
 * `flushAndReconcile` — the function that decides what the sync dot says.
 *
 * It had a bug that shipped as far as a browser: it treated "not in the failed
 * list" as sent, so a set queued with the server unreachable showed **Synced**.
 * That dot is the only thing distinguishing online from offline, so it is the
 * one thing it must not get wrong. Every state it can report is asserted here.
 */
import { createMemoryStore } from '../../../lib/db/memory';
import type { SessionStore } from '../../../lib/db/types';
import { configurePersistence, useSessionStore } from '../store/sessionStore';
// Static, not dynamic: jest hoists the mocks above this anyway, and a dynamic
// import needs --experimental-vm-modules under this runner.
import { flushAndReconcile, onDelivered, outbox } from '../sessionController';

const TRACKS = { load: true, reps: true, duration: false, distance: false };

let mockStore: SessionStore;
const mockSendResults = new Map<string, {
  ok: boolean; retryable: boolean; unreachable?: boolean; message?: string; status?: number;
}>();

jest.mock('../../../lib/db', () => ({
  get store() { return mockStore; },
  STORE_KIND: 'memory',
}));

jest.mock('../../../lib/api', () => {
  // The REAL ApiError: isRetryable does an instanceof, so a stand-in would make
  // every failure look like a network blip and the terminal case untestable.
  const actual = jest.requireActual('../../../lib/api');
  return {
    ...actual,
    api: {
      send: jest.fn(async (_m: string, _p: string, _b: unknown, h: Record<string, string>) => {
        const r = mockSendResults.get(h['Idempotency-Key']!) ?? { ok: true, retryable: false };
        // What `fetch` really does with no route to the server: it throws a
        // TypeError, not an ApiError, because there is no response at all.
        if (!r.ok && r.unreachable) throw new TypeError('Network request failed');
        if (!r.ok) {
          throw new actual.ApiError(
            r.retryable ? 'unavailable' : 'validation_failed',
            r.message ?? 'failed',
            r.status ?? (r.retryable ? 503 : 422),
          );
        }
        return {};
      }),
    },
  };
});

async function startWithSets(keys: string[]) {
  useSessionStore.getState().start({
    sessionId: 's1',
    startedAt: '2026-09-22T10:00:00Z',
    exercises: [{
      clientId: 'x1', exerciseId: 'e1', exerciseName: 'Bench',
      sessionExerciseId: 'se1', tracks: TRACKS,
    }],
  });
  for (const k of keys) {
    useSessionStore.getState().commitSet('x1', { clientId: k, reps: 8, loadKg: 60 });
  }
  // The commit path fires persistence without awaiting it — that is I10. Let the
  // microtasks it queued settle before asserting on the store.
  await new Promise((r) => setTimeout(r, 0));
}

const dotFor = (clientId: string) =>
  useSessionStore.getState().draft!.exercises[0]!.sets.find((s) => s.clientId === clientId)!.syncState;

beforeEach(async () => {
  jest.clearAllMocks();
  mockSendResults.clear();
  mockStore = createMemoryStore('user-1');
  await mockStore.open();
  configurePersistence({ store: mockStore });
  outbox.__reset();
  useSessionStore.setState({ draft: null, recoveryCandidate: null });
});

afterEach(() => configurePersistence(null));

describe('what the sync dot says', () => {
  it('reads Synced once the write has actually landed', async () => {
    await startWithSets(['11111111-1111-4111-8111-111111111111']);

    await flushAndReconcile();

    expect(dotFor('11111111-1111-4111-8111-111111111111')).toBe('synced');
  });

  it('stays Waiting while the server is unreachable — never Synced', async () => {
    // The bug: "not failed" was read as "sent", so this said Synced offline.
    const key = '22222222-2222-4222-8222-222222222222';
    mockSendResults.set(key, { ok: false, retryable: true, message: 'offline' });
    await startWithSets([key]);

    await flushAndReconcile();

    expect(dotFor(key)).toBe('pending');
  });

  it('a real network failure keeps the set queued however long it lasts', async () => {
    // G10, on a phone: offline writes became permanent failures after eight
    // attempts — a few minutes. The chain that prevents it runs from fetch's
    // TypeError, through this sender, to the outbox's exhaustion rule.
    const key = '55555555-5555-4555-8555-555555555555';
    mockSendResults.set(key, { ok: false, retryable: true, unreachable: true });
    await startWithSets([key]);
    const [entry] = await mockStore.allEntries();
    for (let i = 0; i < 20; i += 1) {
      await mockStore.markRetry(entry!.id, '2000-01-01T00:00:00Z', 'Could not reach the server.');
    }

    await flushAndReconcile();

    const [after] = await mockStore.allEntries();
    expect(after!.state).toBe('pending');
    expect(after!.lastError).toBe('Could not reach the server.');
    expect(dotFor(key)).toBe('pending');
  });

  it('a 401 keeps the set waiting for the next sign-in, not Failed (a11y #20)', async () => {
    const key = '66666666-6666-4666-8666-666666666666';
    mockSendResults.set(key, { ok: false, retryable: false, message: 'Log back in to carry on.', status: 401 });
    await startWithSets([key]);
    const [entry] = await mockStore.allEntries();
    for (let i = 0; i < 10; i += 1) await mockStore.markRetry(entry!.id, '2026-01-01T00:00:00Z', 'x');

    await flushAndReconcile();

    expect(dotFor(key)).toBe('pending');
    const [after] = await mockStore.allEntries();
    expect(after!.lastError).toBe('Waiting for you to sign in.');
  });

  it('reads Failed, with the reason, on a terminal rejection', async () => {
    const key = '33333333-3333-4333-8333-333333333333';
    mockSendResults.set(key, { ok: false, retryable: false, message: 'Reps must be at least 1.' });
    await startWithSets([key]);

    await flushAndReconcile();

    expect(dotFor(key)).toBe('failed');
    const set = useSessionStore.getState().draft!.exercises[0]!.sets[0]!;
    expect(set.syncError).toBe('Reps must be at least 1.');
  });

  it('reports each set independently in one flush', async () => {
    const ok = '44444444-4444-4444-8444-444444444444';
    const bad = '55555555-5555-4555-8555-555555555555';
    mockSendResults.set(bad, { ok: false, retryable: false, message: 'rejected' });
    await startWithSets([ok, bad]);

    await flushAndReconcile();

    expect(dotFor(ok)).toBe('synced');
    expect(dotFor(bad)).toBe('failed');
  });

  it('does nothing at all when there is no draft', async () => {
    await expect(flushAndReconcile()).resolves.toBeUndefined();
  });
});

describe('delivery reaches the app shell', () => {
  afterEach(() => onDelivered(null));

  it('tells the listener about each write that landed — the real sender, not a stub', async () => {
    const heard: string[] = [];
    onDelivered((e) => heard.push(e.path));
    await mockStore.commit(
      { revision: 1, updatedAt: '2026-09-22T10:00:00Z', json: '{}' },
      {
        aggregateId: 'meal:m1', method: 'POST', path: '/meals', body: '{}',
        idempotencyKey: 'meal-1', nextAttemptAt: '2026-09-22T09:00:00Z',
      },
    );

    await flushAndReconcile();

    expect(heard).toEqual(['/meals']);
  });

  it('is silent for a write that did not land', async () => {
    const heard: string[] = [];
    onDelivered((e) => heard.push(e.path));
    mockSendResults.set('meal-2', { ok: false, retryable: true, unreachable: true });
    await mockStore.commit(
      { revision: 1, updatedAt: '2026-09-22T10:00:00Z', json: '{}' },
      {
        aggregateId: 'meal:m2', method: 'POST', path: '/meals', body: '{}',
        idempotencyKey: 'meal-2', nextAttemptAt: '2026-09-22T09:00:00Z',
      },
    );

    await flushAndReconcile();

    expect(heard).toEqual([]);
  });
});
