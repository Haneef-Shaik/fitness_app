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
import { flushAndReconcile, outbox } from '../sessionController';

const TRACKS = { load: true, reps: true, duration: false, distance: false };

let mockStore: SessionStore;
const mockSendResults = new Map<string, { ok: boolean; retryable: boolean; message?: string }>();

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
        if (!r.ok) {
          throw new actual.ApiError(
            r.retryable ? 'unavailable' : 'validation_failed',
            r.message ?? 'failed',
            r.retryable ? 503 : 422,
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
  mockStore = createMemoryStore();
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
