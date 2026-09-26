/**
 * Every mid-session change the user can see must also reach the server.
 *
 * Until G11 only a committed set was queued. Deleting a set, adding an exercise
 * mid-workout, and the session's notes changed the draft on screen and nowhere
 * else — so the finished workout counted a set the user had deleted, and every
 * set logged against an added exercise stayed on the phone for ever.
 *
 * Each change here is asserted by the outbox entry it enqueues: the entry is the
 * only thing that will still be true after the app is killed.
 */
import type { NewOutboxEntry, SessionStore } from '../../../../lib/db/types';
import { configurePersistence, useSessionStore } from '../sessionStore';

const TRACKS = { load: true, reps: true, duration: false, distance: false };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function recordingStore(entries: NewOutboxEntry[]): SessionStore {
  const never = () => new Promise<never>(() => {});
  return {
    open: never, journalMode: () => null, loadDraft: never, clearDraft: async () => {},
    commit: async (_row: unknown, entry?: NewOutboxEntry) => { if (entry) entries.push(entry); },
    readyEntries: never, allEntries: never,
    markSent: never, markRetry: never, markFailed: never, reset: never,
  } as unknown as SessionStore;
}

async function settle() {
  await new Promise((r) => setTimeout(r, 0));
}

function startSession() {
  useSessionStore.getState().start({
    sessionId: 's1',
    startedAt: '2026-09-26T10:00:00Z',
    exercises: [{
      clientId: 'x1', exerciseId: 'e1', exerciseName: 'Bench',
      sessionExerciseId: 'se1', tracks: TRACKS,
    }],
  });
}

let entries: NewOutboxEntry[];

beforeEach(() => {
  entries = [];
  configurePersistence({ store: recordingStore(entries) });
  startSession();
});

afterEach(() => {
  configurePersistence(null);
  useSessionStore.setState({ draft: null, recoveryCandidate: null });
});

describe('a committed set', () => {
  it('carries RPE, RIR, its type and its note to the server', async () => {
    useSessionStore.getState().commitSet('x1', {
      clientId: 'c1', reps: 8, loadKg: 60, rpe: 8.5, rir: 1, setType: 'failure', note: 'Grip went',
    });
    await settle();

    const body = JSON.parse(entries[0]!.body);
    expect(body).toMatchObject({ rpe: 8.5, rir: 1, set_type: 'failure', note: 'Grip went' });
    expect(useSessionStore.getState().draft!.exercises[0]!.sets[0]!.note).toBe('Grip went');
  });
});

describe('deleting a set', () => {
  it('queues a delete that names the set by the id the phone gave it', async () => {
    useSessionStore.getState().commitSet('x1', { clientId: 'c1', reps: 8, loadKg: 60 });
    useSessionStore.getState().deleteSet('c1');
    await settle();

    const del = entries[1]!;
    expect(del.method).toBe('DELETE');
    expect(del.path).toBe('/workout-sessions/s1/sets/by-client/c1');
    expect(del.aggregateId).toBe('s1');     // FIFO behind the create it undoes
    expect(del.idempotencyKey).toMatch(UUID);
  });
});

describe('editing a set', () => {
  it('queues a patch by client id with only what changed', async () => {
    useSessionStore.getState().commitSet('x1', { clientId: 'c1', reps: 8, loadKg: 60 });
    useSessionStore.getState().editSet('c1', { rpe: 9, note: 'Last rep slow' });
    await settle();

    const patch = entries[1]!;
    expect(patch.method).toBe('PATCH');
    expect(patch.path).toBe('/workout-sessions/s1/sets/by-client/c1');
    expect(JSON.parse(patch.body)).toEqual({ rpe: 9, note: 'Last rep slow' });
  });

  it('two edits are two writes, not one overwriting the other', async () => {
    useSessionStore.getState().commitSet('x1', { clientId: 'c1', reps: 8, loadKg: 60 });
    useSessionStore.getState().editSet('c1', { rpe: 9 });
    useSessionStore.getState().editSet('c1', { rir: 1 });
    await settle();

    expect(entries).toHaveLength(3);
    expect(entries[1]!.idempotencyKey).not.toBe(entries[2]!.idempotencyKey);
  });
});

describe('adding an exercise mid-session', () => {
  it('queues the exercise under the id the phone chose, before any set on it', async () => {
    useSessionStore.getState().addExercise({
      clientId: '3f1c2b7e-8f4a-4c1d-9a0b-1234567890ab', exerciseId: 'e2', exerciseName: 'Row', tracks: TRACKS,
    });
    useSessionStore.getState().commitSet('3f1c2b7e-8f4a-4c1d-9a0b-1234567890ab', {
      clientId: 'c9', reps: 10, loadKg: 50,
    });
    await settle();

    const [add, set] = entries;
    expect(add!.method).toBe('POST');
    expect(add!.path).toBe('/workout-sessions/s1/exercises');
    expect(JSON.parse(add!.body)).toEqual({
      exercise_id: 'e2', id: '3f1c2b7e-8f4a-4c1d-9a0b-1234567890ab',
    });
    // The set can be addressed at once — no round trip for a server id.
    expect(set!.path).toBe('/session-exercises/3f1c2b7e-8f4a-4c1d-9a0b-1234567890ab/sets');
    expect(add!.aggregateId).toBe(set!.aggregateId);
  });
});

describe('notes', () => {
  it('session notes are queued as a patch of the session', async () => {
    useSessionStore.getState().setNotes('Felt strong');
    await settle();

    expect(entries[0]!.method).toBe('PATCH');
    expect(entries[0]!.path).toBe('/workout-sessions/s1');
    expect(JSON.parse(entries[0]!.body)).toEqual({ notes: 'Felt strong' });
  });

  it('an exercise note is queued as a patch of the session exercise', async () => {
    useSessionStore.getState().patchExercise('x1', { notes: 'Seat 4' });
    await settle();

    expect(entries[0]!.path).toBe('/session-exercises/se1');
    expect(JSON.parse(entries[0]!.body)).toEqual({ notes: 'Seat 4' });
  });
});

describe('changing the plan mid-workout (BRD 5.1: add, skip, reorder)', () => {
  function withTwo() {
    useSessionStore.getState().addExercise({
      clientId: '5a5a5a5a-0000-4000-8000-000000000002', exerciseId: 'e2', exerciseName: 'Row', tracks: TRACKS,
    });
  }

  it('skipping is queued as a patch — the logged sets stay', async () => {
    useSessionStore.getState().patchExercise('x1', { skipped: true });
    await settle();
    expect(entries[0]!.path).toBe('/session-exercises/se1');
    expect(JSON.parse(entries[0]!.body)).toEqual({ skipped: true });
  });

  it('removing an exercise is queued as a delete of it', async () => {
    withTwo();
    useSessionStore.getState().removeExercise('x1');
    await settle();
    const del = entries.at(-1)!;
    expect(del.method).toBe('DELETE');
    expect(del.path).toBe('/session-exercises/se1');
  });

  it('reordering sends the complete new order, by server ids', async () => {
    withTwo();
    useSessionStore.getState().reorderExercises(['5a5a5a5a-0000-4000-8000-000000000002', 'x1']);
    await settle();
    const put = entries.at(-1)!;
    expect(put.method).toBe('PUT');
    expect(put.path).toBe('/workout-sessions/s1/exercises/order');
    expect(JSON.parse(put.body)).toEqual(['5a5a5a5a-0000-4000-8000-000000000002', 'se1']);
  });

  it('swapping puts the new exercise in the old one\'s place', async () => {
    withTwo();
    useSessionStore.getState().swapExercise('x1', {
      clientId: '5a5a5a5a-0000-4000-8000-000000000003', exerciseId: 'e3', exerciseName: 'Dips', tracks: TRACKS,
    });
    await settle();

    const names = useSessionStore.getState().draft!.exercises.map((e) => e.exerciseName);
    expect(names).toEqual(['Dips', 'Row']);
    const [add, del, order] = entries.slice(-3);
    expect(add!.method).toBe('POST');
    expect(del!.method).toBe('DELETE');
    expect(del!.path).toBe('/session-exercises/se1');
    expect(JSON.parse(order!.body)).toEqual([
      '5a5a5a5a-0000-4000-8000-000000000003', '5a5a5a5a-0000-4000-8000-000000000002',
    ]);
  });

  it('an exercise with sets is not swapped away', () => {
    useSessionStore.getState().commitSet('x1', { clientId: 'c1', reps: 5, loadKg: 50 });
    useSessionStore.getState().swapExercise('x1', {
      clientId: '5a5a5a5a-0000-4000-8000-000000000004', exerciseId: 'e4', tracks: TRACKS,
    });
    expect(useSessionStore.getState().draft!.exercises[0]!.exerciseId).toBe('e1');
  });
});
