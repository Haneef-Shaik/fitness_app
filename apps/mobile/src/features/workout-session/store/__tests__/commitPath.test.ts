/**
 * **I10 — the set-commit path never awaits the network, and never awaits disk.**
 *
 * This is the invariant the whole product is shaped around: a user standing at a
 * rack with 40 seconds of rest must see the set on screen the instant they tap ✓.
 *
 * These tests are written to fail the moment an `await` appears in front of the
 * state update — which is how this erodes. Nobody sets out to block the commit
 * path; someone awaits the POST "just for the first set", and then it is blocked
 * for ever. If you are reading this because one of these failed, the fix is to
 * move your work after the `set({ draft })`, not to relax the test.
 */
import type { SessionStore } from '../../../../lib/db/types';
import { configurePersistence, useSessionStore } from '../sessionStore';

const TRACKS = { load: true, reps: true, duration: false, distance: false };

/** A store whose every write hangs for ever. The commit path must not notice. */
function hangingStore(): SessionStore {
  const never = () => new Promise<never>(() => {});
  return {
    open: never, journalMode: () => null, loadDraft: never, clearDraft: never,
    commit: never, readyEntries: never, allEntries: never,
    markSent: never, markRetry: never, markFailed: never, reset: never,
  } as unknown as SessionStore;
}

function startSession() {
  useSessionStore.getState().start({
    sessionId: 's1',
    startedAt: '2026-09-22T10:00:00Z',
    exercises: [{
      clientId: 'x1', exerciseId: 'e1', exerciseName: 'Bench',
      sessionExerciseId: 'se1', tracks: TRACKS,
    }],
  });
}

afterEach(() => {
  configurePersistence(null);
  useSessionStore.setState({ draft: null, recoveryCandidate: null });
});

describe('the commit path is synchronous', () => {
  it('returns a plain result, not a promise', () => {
    configurePersistence({ store: hangingStore() });
    startSession();

    const result = useSessionStore.getState().commitSet('x1', { clientId: 'c1', reps: 8, loadKg: 60 });

    // If commitSet becomes `async`, this is a Promise and the assertion fails.
    expect(result).not.toBeInstanceOf(Promise);
    expect(result).toEqual({ ok: true });
  });

  it('the set is on screen before any write completes', () => {
    // Persistence hangs for ever here. The draft must already have the set.
    configurePersistence({ store: hangingStore() });
    startSession();

    useSessionStore.getState().commitSet('x1', { clientId: 'c1', reps: 8, loadKg: 60 });

    const sets = useSessionStore.getState().draft!.exercises[0]!.sets;
    expect(sets).toHaveLength(1);
    expect(sets[0]!.reps).toBe(8);
  });

  it('a persistence failure never reaches the caller', () => {
    // A full disk must cost a sync, not the set the user just did.
    const failing = { ...hangingStore(), commit: async () => { throw new Error('disk full'); } };
    const onPersistError = jest.fn();
    configurePersistence({ store: failing as unknown as SessionStore, onPersistError });
    startSession();

    let result: unknown;
    expect(() => {
      result = useSessionStore.getState().commitSet('x1', { clientId: 'c1', reps: 8, loadKg: 60 });
    }).not.toThrow();
    // If someone makes commitSet async, the rejection below would otherwise take
    // the whole Jest worker down and hide which test actually failed.
    if (result instanceof Promise) result.catch(() => {});

    expect(result).not.toBeInstanceOf(Promise);
    expect(useSessionStore.getState().draft!.exercises[0]!.sets).toHaveLength(1);
  });

  it('commits many sets in a row without waiting for any of them', () => {
    configurePersistence({ store: hangingStore() });
    startSession();

    const commit = useSessionStore.getState().commitSet;
    for (let i = 0; i < 25; i++) commit('x1', { clientId: `c${i}`, reps: 8, loadKg: 60 });

    expect(useSessionStore.getState().draft!.exercises[0]!.sets).toHaveLength(25);
  });
});

describe('what the commit path does before it returns', () => {
  it('validates locally and refuses inline, never as a modal', () => {
    // W04.7 — load alone is not a set. The user is told in place.
    configurePersistence({ store: hangingStore() });
    startSession();

    const result = useSessionStore.getState().commitSet('x1', { clientId: 'c1', loadKg: 60 });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/reps, time or distance/i);
    expect(useSessionStore.getState().draft!.exercises[0]!.sets).toHaveLength(0);
  });

  it('enqueues the write with the set\'s client id as the idempotency key (I8)', async () => {
    const commits: Array<{ key?: string }> = [];
    const store = {
      ...hangingStore(),
      commit: async (_d: unknown, entry?: { idempotencyKey: string }) => {
        commits.push({ key: entry?.idempotencyKey });
      },
    };
    configurePersistence({ store: store as unknown as SessionStore });
    startSession();

    useSessionStore.getState().commitSet('x1', { clientId: 'the-key', reps: 8, loadKg: 60 });
    await Promise.resolve();

    expect(commits.some((c) => c.key === 'the-key')).toBe(true);
  });

  it('starts every set pending, so the sync dot is honest', () => {
    configurePersistence({ store: hangingStore() });
    startSession();

    useSessionStore.getState().commitSet('x1', { clientId: 'c1', reps: 8, loadKg: 60 });

    expect(useSessionStore.getState().draft!.exercises[0]!.sets[0]!.syncState).toBe('pending');
  });
});

describe('measured, not asserted', () => {
  it('commits 50 sets in well under the 100 ms budget for one', () => {
    // Not the real measurement — that is G4 on hardware (H4.3). This only fails
    // if the path stops being synchronous, which is what it is here to catch.
    configurePersistence({ store: hangingStore() });
    startSession();

    const commit = useSessionStore.getState().commitSet;
    const started = Date.now();
    for (let i = 0; i < 50; i++) commit('x1', { clientId: `c${i}`, reps: 8, loadKg: 60 });
    const elapsed = Date.now() - started;

    expect(useSessionStore.getState().draft!.exercises[0]!.sets).toHaveLength(50);
    expect(elapsed).toBeLessThan(100);
  });
});
