/**
 * Turning a server session into a local draft.
 *
 * `draftWithSetsFromServer` is where G3's resume bug lived: the mapper dropped
 * the sets, so resuming a workout showed nothing logged — which reads as lost
 * work, the most alarming thing this screen can do.
 */
import type { WorkoutSession } from '@fitlog/api-types';
import { draftFromServer, draftWithSetsFromServer } from '../useSession';

jest.mock('../../../lib/api', () => ({ api: { get: jest.fn(), post: jest.fn() } }));
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(), useQueryClient: jest.fn(),
}));

const serverSet = (id: string, over: Record<string, unknown> = {}) => ({
  id, client_id: `client-${id}`, set_index: 0, set_type: 'working',
  reps: 8, load_kg: 80, duration_seconds: null, distance_m: null,
  rpe: null, rir: null, completed: true, performed_at: '2026-09-22T10:00:00Z',
  load_unit_entered: 'kg', e1rm_kg: null, formula_version: null, is_pr: false, note: null,
  ...over,
} as never);

const session = (over: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: 's1', plan_day_id: null, status: 'in_progress',
  started_at: '2026-09-22T10:00:00Z', completed_at: null,
  local_date: '2026-09-22', logged_timezone: 'UTC', notes: null,
  total_volume_kg: null, duration_seconds: null,
  exercises: [{
    id: 'se1', exercise_id: 'e1', exercise_name: 'Bench', order_index: 0,
    notes: null, skipped: false, target_snapshot: { target_load: 80 },
    sets: [serverSet('a'), serverSet('b', { set_index: 1, reps: 6 })],
  }],
  ...over,
} as WorkoutSession);

describe('draftFromServer — the shape, without sets', () => {
  it('carries the session identity and the frozen snapshot (I1)', () => {
    const d = draftFromServer(session());

    expect(d.sessionId).toBe('s1');
    expect(d.exercises[0]!.sessionExerciseId).toBe('se1');
    expect(d.exercises[0]!.targetSnapshot).toEqual({ target_load: 80 });
  });

  it('handles a session with no exercises', () => {
    expect(draftFromServer(session({ exercises: [] })).exercises).toEqual([]);
  });
});

describe('draftWithSetsFromServer — the sets have to come across', () => {
  it('brings every set with it', () => {
    // The bug: resuming a workout showed nothing logged.
    const d = draftWithSetsFromServer(session());

    expect(d.exercises[0]!.sets).toHaveLength(2);
    expect(d.exercises[0]!.sets[0]!.reps).toBe(8);
    expect(d.exercises[0]!.sets[1]!.reps).toBe(6);
  });

  it('keeps each set\'s client_id, so a replay stays a no-op (I8)', () => {
    const d = draftWithSetsFromServer(session());
    expect(d.exercises[0]!.sets.map((s) => s.clientId)).toEqual(['client-a', 'client-b']);
  });

  it('falls back to the row id when the server has no client_id', () => {
    // Sets written before idempotency keys existed still have to resume.
    const s = session();
    s.exercises![0]!.sets = [serverSet('a', { client_id: null })];

    expect(draftWithSetsFromServer(s).exercises[0]!.sets[0]!.clientId).toBe('a');
  });

  it('marks everything synced — it came FROM the server', () => {
    const d = draftWithSetsFromServer(session());
    expect(d.exercises[0]!.sets.every((s) => s.syncState === 'synced')).toBe(true);
  });

  it('re-densifies the indices it was given', () => {
    const s = session();
    s.exercises![0]!.sets = [
      serverSet('a', { set_index: 3 }), serverSet('b', { set_index: 7 }),
    ];

    expect(draftWithSetsFromServer(s).exercises[0]!.sets.map((x) => x.setIndex)).toEqual([0, 1]);
  });

  it('carries notes and the skipped flag', () => {
    const s = session();
    s.exercises![0]!.notes = 'felt heavy';
    s.exercises![0]!.skipped = true;

    const e = draftWithSetsFromServer(s).exercises[0]!;
    expect(e.notes).toBe('felt heavy');
    expect(e.skipped).toBe(true);
  });

  it('handles an exercise with no sets yet', () => {
    const s = session();
    s.exercises![0]!.sets = [];
    expect(draftWithSetsFromServer(s).exercises[0]!.sets).toEqual([]);
  });

  it('preserves a warm-up as a warm-up', () => {
    // Resuming must not silently promote a warm-up into a working set — that
    // would change the volume and the PRs (I3).
    const s = session();
    s.exercises![0]!.sets = [serverSet('a', { set_type: 'warmup' })];

    expect(draftWithSetsFromServer(s).exercises[0]!.sets[0]!.setType).toBe('warmup');
  });
});
