/**
 * The draft reducers — pure, so correctness is provable without rendering.
 *
 * These run first and matter most: the logger's UI is replaceable, but a reducer
 * that loses a set or mis-densifies an index loses a user's workout.
 */
import {
  addExercise, appendSet, deleteSet, editSet, mergeRecovered, prefillFrom,
  removeExercise, reorderExercises, setSyncState, startDraft,
} from '../reducers';
import { countSets, type SessionDraft } from '../types';

const TRACKS = { load: true, reps: true, duration: false, distance: false };

function draft(): SessionDraft {
  return startDraft({
    sessionId: 's1',
    startedAt: '2026-09-22T10:00:00Z',
    exercises: [
      { clientId: 'x1', exerciseId: 'e1', exerciseName: 'Bench', tracks: TRACKS },
      { clientId: 'x2', exerciseId: 'e2', exerciseName: 'Row', tracks: TRACKS },
    ],
  });
}

const set = (over: Partial<Parameters<typeof appendSet>[2]> = {}) => ({
  clientId: `c${Math.random()}`, reps: 8, loadKg: 60, ...over,
} as Parameters<typeof appendSet>[2]);

describe('immutability (house rule)', () => {
  it('never mutates the draft it is given', () => {
    const before = draft();
    const snapshot = JSON.stringify(before);

    appendSet(before, 'x1', set());

    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it('bumps the revision on every committed change', () => {
    const d0 = draft();
    const d1 = appendSet(d0, 'x1', set({ clientId: 'c1' }));
    const d2 = editSet(d1, 'c1', { reps: 9 });

    expect(d1.revision).toBe(d0.revision + 1);
    expect(d2.revision).toBe(d1.revision + 1);
  });
});

describe('append', () => {
  it('adds a set with a dense, 0-based index', () => {
    let d = draft();
    d = appendSet(d, 'x1', set({ clientId: 'c1' }));
    d = appendSet(d, 'x1', set({ clientId: 'c2' }));

    expect(d.exercises[0]!.sets.map((s) => s.setIndex)).toEqual([0, 1]);
  });

  it('starts every set pending — nothing is synced until the network says so', () => {
    const d = appendSet(draft(), 'x1', set({ clientId: 'c1' }));
    expect(d.exercises[0]!.sets[0]!.syncState).toBe('pending');
  });

  it('keeps the client id it was given — I8 means it is generated once', () => {
    const d = appendSet(draft(), 'x1', set({ clientId: 'fixed-id' }));
    expect(d.exercises[0]!.sets[0]!.clientId).toBe('fixed-id');
  });

  it('leaves other exercises untouched', () => {
    const d = appendSet(draft(), 'x1', set());
    expect(d.exercises[1]!.sets).toEqual([]);
  });

  it('ignores an unknown exercise rather than throwing mid-workout', () => {
    const d0 = draft();
    expect(appendSet(d0, 'nope', set())).toBe(d0);
  });
});

describe('edit', () => {
  it('patches only the named set', () => {
    let d = appendSet(draft(), 'x1', set({ clientId: 'c1' }));
    d = appendSet(d, 'x1', set({ clientId: 'c2', reps: 5 }));

    d = editSet(d, 'c1', { reps: 12, loadKg: 65 });

    expect(d.exercises[0]!.sets[0]!.reps).toBe(12);
    expect(d.exercises[0]!.sets[0]!.loadKg).toBe(65);
    expect(d.exercises[0]!.sets[1]!.reps).toBe(5);
  });

  it('returns an edited set to pending so it is re-sent', () => {
    let d = appendSet(draft(), 'x1', set({ clientId: 'c1' }));
    d = setSyncState(d, 'c1', 'synced');

    d = editSet(d, 'c1', { reps: 9 });

    expect(d.exercises[0]!.sets[0]!.syncState).toBe('pending');
  });

  it('marking a set with the state it already has returns the SAME draft (TODO 2.1)', () => {
    // Every flush re-marks every set in the draft. When each mark built a new
    // draft, one commit re-rendered the whole logger once per set logged so far
    // — right between the tap and the paint that D16's 100 ms budget measures.
    let d = appendSet(draft(), 'x1', set({ clientId: 'c1' }));
    d = setSyncState(d, 'c1', 'synced');
    expect(setSyncState(d, 'c1', 'synced')).toBe(d);
    expect(setSyncState(d, 'c1', 'failed', 'nope')).not.toBe(d);
  });

  it('never changes a set index', () => {
    let d = appendSet(draft(), 'x1', set({ clientId: 'c1' }));
    d = appendSet(d, 'x1', set({ clientId: 'c2' }));

    d = editSet(d, 'c2', { reps: 3 });

    expect(d.exercises[0]!.sets.map((s) => s.setIndex)).toEqual([0, 1]);
  });
});

describe('delete and re-densify (W04.6)', () => {
  // PAIRED with test_densify_matches_the_client_reducer in
  // services/api/tests/test_session_mutations.py. The phone densifies locally so
  // the UI is instant and the server densifies on the write; if they disagree, a
  // set silently changes position after a sync. Same scenarios, same expectations.

  it('re-densifies after deleting the middle set', () => {
    // The scenario the server's densify_set_indices is tested on. Both sides
    // must produce [0, 1] — a gap is what lets a later reorder collide.
    let d = draft();
    for (const c of ['c1', 'c2', 'c3']) d = appendSet(d, 'x1', set({ clientId: c }));

    d = deleteSet(d, 'c2');

    expect(d.exercises[0]!.sets.map((s) => s.clientId)).toEqual(['c1', 'c3']);
    expect(d.exercises[0]!.sets.map((s) => s.setIndex)).toEqual([0, 1]);
  });

  it('re-densifies after deleting the first set', () => {
    let d = draft();
    for (const c of ['c1', 'c2', 'c3']) d = appendSet(d, 'x1', set({ clientId: c }));

    d = deleteSet(d, 'c1');

    expect(d.exercises[0]!.sets.map((s) => s.setIndex)).toEqual([0, 1]);
    expect(d.exercises[0]!.sets[0]!.clientId).toBe('c2');
  });

  it('leaves an empty exercise valid', () => {
    let d = appendSet(draft(), 'x1', set({ clientId: 'c1' }));
    d = deleteSet(d, 'c1');

    expect(d.exercises[0]!.sets).toEqual([]);
    expect(d.exercises).toHaveLength(2);
  });

  it('ignores an unknown set', () => {
    const d = appendSet(draft(), 'x1', set({ clientId: 'c1' }));
    expect(deleteSet(d, 'nope')).toBe(d);
  });
});

describe('exercises', () => {
  it('appends with the next order index', () => {
    const d = addExercise(draft(), {
      clientId: 'x3', exerciseId: 'e3', exerciseName: 'Fly', tracks: TRACKS,
    });
    expect(d.exercises.map((e) => e.orderIndex)).toEqual([0, 1, 2]);
  });

  it('re-densifies order after a removal', () => {
    let d = addExercise(draft(), {
      clientId: 'x3', exerciseId: 'e3', exerciseName: 'Fly', tracks: TRACKS,
    });
    d = removeExercise(d, 'x2');

    expect(d.exercises.map((e) => e.clientId)).toEqual(['x1', 'x3']);
    expect(d.exercises.map((e) => e.orderIndex)).toEqual([0, 1]);
  });

  it('takes its sets with it when removed', () => {
    let d = appendSet(draft(), 'x1', set({ clientId: 'c1' }));
    d = removeExercise(d, 'x1');
    expect(countSets(d)).toBe(0);
  });

  it('reorders to exactly the order given, densely', () => {
    const d = reorderExercises(draft(), ['x2', 'x1']);
    expect(d.exercises.map((e) => e.clientId)).toEqual(['x2', 'x1']);
    expect(d.exercises.map((e) => e.orderIndex)).toEqual([0, 1]);
  });

  it('refuses a partial reorder rather than dropping an exercise', () => {
    const d0 = draft();
    expect(reorderExercises(d0, ['x1'])).toBe(d0);
  });

  it('keeps each exercise\'s sets through a reorder', () => {
    let d = appendSet(draft(), 'x1', set({ clientId: 'c1' }));
    d = reorderExercises(d, ['x2', 'x1']);

    expect(d.exercises[1]!.clientId).toBe('x1');
    expect(d.exercises[1]!.sets).toHaveLength(1);
  });
});

describe('prefill — the fastest path in the product', () => {
  it('copies load, reps and type from the last set', () => {
    let d = appendSet(draft(), 'x1', set({ clientId: 'c1', reps: 8, loadKg: 60 }));
    d = appendSet(d, 'x1', set({ clientId: 'c2', reps: 6, loadKg: 80 }));

    expect(prefillFrom(d, 'x1')).toMatchObject({ reps: 6, loadKg: 80, setType: 'working' });
  });

  it('never prefills from a warm-up', () => {
    // Repeating a warm-up as a working set is a wrong number, silently.
    let d = appendSet(draft(), 'x1', set({ clientId: 'c1', reps: 10, loadKg: 20, setType: 'warmup' }));
    d = appendSet(d, 'x1', set({ clientId: 'c2', reps: 5, loadKg: 100 }));

    expect(prefillFrom(d, 'x1')).toMatchObject({ loadKg: 100 });
  });

  it('falls back to the plan target when nothing has been logged', () => {
    const d = startDraft({
      sessionId: 's1',
      startedAt: '2026-09-22T10:00:00Z',
      exercises: [{
        clientId: 'x1', exerciseId: 'e1', exerciseName: 'Bench', tracks: TRACKS,
        targetSnapshot: { target_load: 80, target_reps_min: 6, target_reps_max: 8 },
      }],
    });

    expect(prefillFrom(d, 'x1')).toMatchObject({ loadKg: 80, reps: 6 });
  });

  it('returns empty values when there is neither history nor a target', () => {
    expect(prefillFrom(draft(), 'x1')).toMatchObject({ reps: null, loadKg: null });
  });
});

describe('recovery merge', () => {
  it('keeps the local draft when the server has nothing', () => {
    const local = appendSet(draft(), 'x1', set({ clientId: 'c1' }));
    expect(mergeRecovered(local, null)).toBe(local);
  });

  it('adopts the server session when there is no local draft', () => {
    const server = draft();
    expect(mergeRecovered(null, server)).toBe(server);
  });

  it('prefers whichever has more sets when the ids differ', () => {
    // Two devices, two sessions. The one with more work in it wins; the other is
    // offered as a discard rather than deleted.
    const local = appendSet(draft(), 'x1', set({ clientId: 'c1' }));
    const server = { ...draft(), sessionId: 's2' };

    expect(mergeRecovered(local, server)).toBe(local);
  });

  it('merges by client id when the ids match, never duplicating a set', () => {
    // The same session on both sides: the outbox may not have flushed, so the
    // union is correct and clientId is what makes it safe (I8).
    let local = appendSet(draft(), 'x1', set({ clientId: 'c1' }));
    local = appendSet(local, 'x1', set({ clientId: 'c2' }));
    const server = appendSet(draft(), 'x1', set({ clientId: 'c1' }));

    const merged = mergeRecovered(local, server)!;

    expect(merged.exercises[0]!.sets.map((s) => s.clientId)).toEqual(['c1', 'c2']);
    expect(merged.exercises[0]!.sets.map((s) => s.setIndex)).toEqual([0, 1]);
  });

  it('trusts the server for a set they both have', () => {
    let local = appendSet(draft(), 'x1', set({ clientId: 'c1', reps: 8 }));
    local = setSyncState(local, 'c1', 'synced');
    const server = appendSet(draft(), 'x1', set({ clientId: 'c1', reps: 9 }));

    const merged = mergeRecovered(local, server)!;

    expect(merged.exercises[0]!.sets[0]!.reps).toBe(9);
  });

  it('returns null when neither side has anything', () => {
    expect(mergeRecovered(null, null)).toBeNull();
  });
});
