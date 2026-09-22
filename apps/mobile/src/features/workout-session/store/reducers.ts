/**
 * Pure draft reducers. No React, no I/O, no clock beyond what is passed in.
 *
 * This is where the logger's correctness lives. The UI is replaceable; a reducer
 * that loses a set or leaves a gap in an index loses a user's workout.
 *
 * Two rules run through all of them:
 *  - **Immutability** (house rule). Every reducer returns a new draft, or the
 *    exact object it was given when nothing changed.
 *  - **Dense, 0-based indices**, re-densified after any removal (W04.6). A gap is
 *    what lets a later reorder walk rows through values their neighbours hold —
 *    the mistake D13 records on the server side.
 */
import type { SetType } from '@volt/domain';
import type { DraftExercise, DraftSet, SessionDraft, SyncState } from './types';

export interface NewExercise {
  clientId: string;
  exerciseId: string;
  exerciseName?: string | null;
  sessionExerciseId?: string | null;
  targetSnapshot?: Record<string, unknown> | null;
  tracks: DraftExercise['tracks'];
}

export interface NewSet {
  clientId: string;
  setType?: SetType;
  reps?: number | null;
  loadKg?: number | null;
  loadUnitEntered?: 'kg' | 'lb';
  durationSeconds?: number | null;
  distanceM?: number | null;
  rpe?: number | null;
  rir?: number | null;
  completed?: boolean;
  performedAt?: string;
}

export interface StartDraftInput {
  sessionId: string;
  startedAt: string;
  planDayId?: string | null;
  notes?: string | null;
  exercises: readonly NewExercise[];
}

const densifySets = (sets: readonly DraftSet[]): readonly DraftSet[] =>
  sets.map((s, i) => (s.setIndex === i ? s : { ...s, setIndex: i }));

const densifyExercises = (xs: readonly DraftExercise[]): readonly DraftExercise[] =>
  xs.map((e, i) => (e.orderIndex === i ? e : { ...e, orderIndex: i }));

/** Every committed change bumps the revision — it is what makes a stale write detectable. */
const bump = (d: SessionDraft, exercises: readonly DraftExercise[]): SessionDraft =>
  ({ ...d, exercises, revision: d.revision + 1 });

export function startDraft(input: StartDraftInput): SessionDraft {
  return {
    sessionId: input.sessionId,
    planDayId: input.planDayId ?? null,
    startedAt: input.startedAt,
    status: 'in_progress',
    notes: input.notes ?? null,
    revision: 0,
    exercises: input.exercises.map((e, i) => ({
      clientId: e.clientId,
      sessionExerciseId: e.sessionExerciseId ?? null,
      exerciseId: e.exerciseId,
      exerciseName: e.exerciseName ?? null,
      orderIndex: i,
      targetSnapshot: e.targetSnapshot ?? null,
      sets: [],
      notes: null,
      skipped: false,
      tracks: e.tracks,
    })),
  };
}

function mapExercise(
  d: SessionDraft,
  clientId: string,
  fn: (e: DraftExercise) => DraftExercise,
): SessionDraft | null {
  const i = d.exercises.findIndex((e) => e.clientId === clientId);
  if (i < 0) return null;
  const next = [...d.exercises];
  next[i] = fn(next[i]!);
  return bump(d, next);
}

export function appendSet(d: SessionDraft, exerciseClientId: string, input: NewSet): SessionDraft {
  return mapExercise(d, exerciseClientId, (e) => ({
    ...e,
    sets: [...e.sets, {
      clientId: input.clientId,
      setIndex: e.sets.length,
      setType: input.setType ?? 'working',
      reps: input.reps ?? null,
      loadKg: input.loadKg ?? null,
      loadUnitEntered: input.loadUnitEntered ?? 'kg',
      durationSeconds: input.durationSeconds ?? null,
      distanceM: input.distanceM ?? null,
      rpe: input.rpe ?? null,
      rir: input.rir ?? null,
      completed: input.completed ?? true,
      performedAt: input.performedAt ?? new Date().toISOString(),
      syncState: 'pending',
      syncError: null,
    }],
  })) ?? d;
}

export function editSet(
  d: SessionDraft, setClientId: string, patch: Partial<Omit<DraftSet, 'clientId' | 'setIndex'>>,
): SessionDraft {
  let found = false;
  const exercises = d.exercises.map((e) => {
    if (!e.sets.some((s) => s.clientId === setClientId)) return e;
    found = true;
    return {
      ...e,
      sets: e.sets.map((s) => (s.clientId === setClientId
        // An edited set goes back to pending: the server has the old values.
        ? { ...s, ...patch, syncState: 'pending' as SyncState, syncError: null }
        : s)),
    };
  });
  return found ? bump(d, exercises) : d;
}

export function deleteSet(d: SessionDraft, setClientId: string): SessionDraft {
  let found = false;
  const exercises = d.exercises.map((e) => {
    if (!e.sets.some((s) => s.clientId === setClientId)) return e;
    found = true;
    return { ...e, sets: densifySets(e.sets.filter((s) => s.clientId !== setClientId)) };
  });
  return found ? bump(d, exercises) : d;
}

export function setSyncState(
  d: SessionDraft, setClientId: string, state: SyncState, error: string | null = null,
): SessionDraft {
  let found = false;
  const exercises = d.exercises.map((e) => {
    if (!e.sets.some((s) => s.clientId === setClientId)) return e;
    found = true;
    return {
      ...e,
      sets: e.sets.map((s) => (s.clientId === setClientId
        ? { ...s, syncState: state, syncError: error }
        : s)),
    };
  });
  // Sync state is not a user change, so it does not bump the revision — the
  // outbox would otherwise re-enqueue on its own acknowledgement.
  return found ? { ...d, exercises } : d;
}

export function addExercise(d: SessionDraft, input: NewExercise): SessionDraft {
  return bump(d, [...d.exercises, {
    clientId: input.clientId,
    sessionExerciseId: input.sessionExerciseId ?? null,
    exerciseId: input.exerciseId,
    exerciseName: input.exerciseName ?? null,
    orderIndex: d.exercises.length,
    targetSnapshot: input.targetSnapshot ?? null,
    sets: [],
    notes: null,
    skipped: false,
    tracks: input.tracks,
  }]);
}

export function removeExercise(d: SessionDraft, exerciseClientId: string): SessionDraft {
  if (!d.exercises.some((e) => e.clientId === exerciseClientId)) return d;
  return bump(d, densifyExercises(d.exercises.filter((e) => e.clientId !== exerciseClientId)));
}

export function reorderExercises(d: SessionDraft, orderedClientIds: readonly string[]): SessionDraft {
  // A partial order would silently drop an exercise from the workout, so it is
  // refused rather than half-applied — the same rule the server enforces.
  if (orderedClientIds.length !== d.exercises.length) return d;
  const byId = new Map(d.exercises.map((e) => [e.clientId, e]));
  if (orderedClientIds.some((id) => !byId.has(id))) return d;

  return bump(d, densifyExercises(orderedClientIds.map((id) => byId.get(id)!)));
}

export function patchExercise(
  d: SessionDraft, exerciseClientId: string, patch: Partial<Pick<DraftExercise, 'notes' | 'skipped' | 'sessionExerciseId'>>,
): SessionDraft {
  return mapExercise(d, exerciseClientId, (e) => ({ ...e, ...patch })) ?? d;
}

export function setNotes(d: SessionDraft, notes: string | null): SessionDraft {
  return { ...d, notes, revision: d.revision + 1 };
}

/**
 * What the next set should start as — the repeat-set path, and the most-used
 * control in the product.
 *
 * The last **working** set, never a warm-up: repeating 20 kg as a working set is
 * a wrong number entered silently. With nothing logged, the frozen plan target
 * (I1) is the next best guess, and after that, empty.
 */
export function prefillFrom(d: SessionDraft, exerciseClientId: string): Partial<NewSet> {
  const e = d.exercises.find((x) => x.clientId === exerciseClientId);
  if (!e) return { reps: null, loadKg: null };

  const last = [...e.sets].reverse().find((s) => s.setType !== 'warmup');
  if (last) {
    return {
      setType: last.setType,
      reps: last.reps,
      loadKg: last.loadKg,
      loadUnitEntered: last.loadUnitEntered,
      durationSeconds: last.durationSeconds,
      distanceM: last.distanceM,
    };
  }

  const t = e.targetSnapshot ?? {};
  const num = (k: string): number | null => {
    const v = t[k];
    return typeof v === 'number' ? v : null;
  };
  return {
    setType: 'working',
    reps: num('target_reps_min'),
    loadKg: num('target_load'),
    durationSeconds: num('target_duration_seconds'),
    distanceM: num('target_distance_m'),
  };
}

/**
 * Recovery (docs/03 §5.3). The table in G3's contract, as code.
 *
 * The only subtle row is "both, same id": the outbox may not have flushed, so the
 * union of the two is correct, and `clientId` is what makes the union safe —
 * a set present on both sides is one set, not two (**I8**).
 */
export function mergeRecovered(
  local: SessionDraft | null, server: SessionDraft | null,
): SessionDraft | null {
  if (!local && !server) return null;
  if (!local) return server;
  if (!server) return local;

  if (local.sessionId !== server.sessionId) {
    // Two different sessions across two devices: the one with more work in it
    // wins. The other is offered as a discard, never deleted silently.
    const localSets = local.exercises.reduce((n, e) => n + e.sets.length, 0);
    const serverSets = server.exercises.reduce((n, e) => n + e.sets.length, 0);
    return serverSets > localSets ? server : local;
  }

  const serverByExercise = new Map(server.exercises.map((e) => [e.clientId, e]));
  const exercises = local.exercises.map((le) => {
    const se = serverByExercise.get(le.clientId);
    if (!se) return le;

    const merged = new Map<string, DraftSet>();
    for (const s of le.sets) merged.set(s.clientId, s);
    // The server is authoritative for anything it already has.
    for (const s of se.sets) merged.set(s.clientId, s);

    return { ...le, sets: densifySets([...merged.values()]) };
  });

  return { ...local, exercises, revision: Math.max(local.revision, server.revision) + 1 };
}
