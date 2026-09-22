/**
 * The session store — the reducers, plus the one path that must never be slow.
 *
 * **I10: the set-commit path never awaits the network, and never awaits disk.**
 * `commitSet` is deliberately a *synchronous* function. It validates, runs the
 * reducer and publishes the new state before it returns; persistence and the
 * outbox enqueue are fired afterwards and their promise is dropped on purpose.
 *
 * That shape is load-bearing, so it has a test that fails the moment an `await`
 * appears in front of the state update — see `commitPath.test.ts`. Once the
 * commit path *can* await, it will.
 */
import { createStore } from '../../../lib/store/createStore';
import { validateSet } from '@volt/domain';
import type { NewOutboxEntry, SessionStore } from '../../../lib/db/types';
import {
  addExercise, appendSet, deleteSet, editSet, mergeRecovered, patchExercise,
  prefillFrom, removeExercise, reorderExercises, setNotes, setSyncState, startDraft,
  type NewExercise, type NewSet, type StartDraftInput,
} from './reducers';
import type { DraftSet, SessionDraft, SyncState } from './types';

export interface CommitResult {
  ok: boolean;
  /** Set when validation refused the set. Shown inline, never as a modal. */
  error?: string;
}

interface Persistence {
  store: SessionStore;
  /** Called after every committed change; failures are surfaced, never thrown at the UI. */
  onPersistError?: (e: unknown) => void;
}

let persistence: Persistence | null = null;

/** Wired once at app start. Tests inject their own. */
export function configurePersistence(p: Persistence | null): void {
  persistence = p;
}

/** Fire-and-forget by design: this is what keeps I10 true. */
function persist(draft: SessionDraft, entry?: NewOutboxEntry): void {
  const p = persistence;
  if (!p) return;
  void p.store
    .commit(
      { revision: draft.revision, updatedAt: new Date().toISOString(), json: JSON.stringify(draft) },
      entry,
    )
    .catch((e) => p.onPersistError?.(e));
}

function setEntry(draft: SessionDraft, exerciseClientId: string, set: DraftSet): NewOutboxEntry | undefined {
  const exercise = draft.exercises.find((e) => e.clientId === exerciseClientId);
  if (!exercise?.sessionExerciseId) return undefined; // still local; enqueued on adoption
  return {
    aggregateId: draft.sessionId,
    method: 'POST',
    path: `/session-exercises/${exercise.sessionExerciseId}/sets`,
    body: JSON.stringify({
      client_id: set.clientId,
      set_type: set.setType,
      reps: set.reps,
      load_kg: set.loadKg,
      duration_seconds: set.durationSeconds,
      distance_m: set.distanceM,
      rpe: set.rpe,
      rir: set.rir,
      load_unit_entered: set.loadUnitEntered,
      completed: set.completed,
      performed_at: set.performedAt,
    }),
    // I8 — generated once, at commit, replayed unchanged for ever after.
    idempotencyKey: set.clientId,
    nextAttemptAt: new Date().toISOString(),
  };
}

export interface SessionState {
  draft: SessionDraft | null;
  /** E-10 offers this when a recovered draft disagrees with the server. */
  recoveryCandidate: SessionDraft | null;

  start(input: StartDraftInput): void;
  adopt(draft: SessionDraft | null): void;
  discard(): void;

  /** THE commit path. Synchronous. Returns before anything touches disk. */
  commitSet(exerciseClientId: string, input: NewSet): CommitResult;

  editSet(setClientId: string, patch: Partial<Omit<DraftSet, 'clientId' | 'setIndex'>>): void;
  deleteSet(setClientId: string): void;
  markSync(setClientId: string, state: SyncState, error?: string | null): void;

  addExercise(input: NewExercise): void;
  removeExercise(exerciseClientId: string): void;
  reorderExercises(orderedClientIds: readonly string[]): void;
  patchExercise(exerciseClientId: string, patch: Parameters<typeof patchExercise>[2]): void;
  setNotes(notes: string | null): void;

  prefill(exerciseClientId: string): Partial<NewSet>;
  recover(local: SessionDraft | null, server: SessionDraft | null): void;
}

export const useSessionStore = createStore<SessionState>((set, get) => ({
  draft: null,
  recoveryCandidate: null,

  start(input) {
    const draft = startDraft(input);
    set({ draft, recoveryCandidate: null });
    persist(draft);
  },

  adopt(draft) {
    set({ draft, recoveryCandidate: null });
    if (draft) persist(draft);
  },

  discard() {
    set({ draft: null, recoveryCandidate: null });
    void persistence?.store.clearDraft().catch(() => {});
  },

  commitSet(exerciseClientId, input) {
    const current = get().draft;
    if (!current) return { ok: false, error: 'No workout in progress.' };

    // Validation is local and synchronous — the same rule the server applies.
    const validity = validateSet({
      reps: input.reps ?? null,
      loadKg: input.loadKg ?? null,
      durationSeconds: input.durationSeconds ?? null,
      distanceM: input.distanceM ?? null,
    });
    if (!validity.valid) return { ok: false, error: validity.error };

    const next = appendSet(current, exerciseClientId, input);
    if (next === current) return { ok: false, error: 'That exercise is not in this workout.' };

    // The UI is updated HERE. Everything after this point is background work.
    set({ draft: next });

    const exercise = next.exercises.find((e) => e.clientId === exerciseClientId);
    const committed = exercise?.sets[exercise.sets.length - 1];
    persist(next, committed ? setEntry(next, exerciseClientId, committed) : undefined);

    return { ok: true };
  },

  editSet(setClientId, patch) {
    const next = editSet(get().draft!, setClientId, patch);
    set({ draft: next });
    persist(next);
  },

  deleteSet(setClientId) {
    const next = deleteSet(get().draft!, setClientId);
    set({ draft: next });
    persist(next);
  },

  markSync(setClientId, state, error = null) {
    const current = get().draft;
    if (!current) return;
    // Not a user change, so it does not bump the revision or re-enqueue.
    set({ draft: setSyncState(current, setClientId, state, error) });
  },

  addExercise(input) {
    const next = addExercise(get().draft!, input);
    set({ draft: next });
    persist(next);
  },

  removeExercise(exerciseClientId) {
    const next = removeExercise(get().draft!, exerciseClientId);
    set({ draft: next });
    persist(next);
  },

  reorderExercises(orderedClientIds) {
    const next = reorderExercises(get().draft!, orderedClientIds);
    set({ draft: next });
    persist(next);
  },

  patchExercise(exerciseClientId, patch) {
    const next = patchExercise(get().draft!, exerciseClientId, patch);
    set({ draft: next });
    persist(next);
  },

  setNotes(notes) {
    const next = setNotes(get().draft!, notes);
    set({ draft: next });
    persist(next);
  },

  prefill(exerciseClientId) {
    const d = get().draft;
    return d ? prefillFrom(d, exerciseClientId) : {};
  },

  recover(local, server) {
    const merged = mergeRecovered(local, server);
    const conflicting =
      local && server && local.sessionId !== server.sessionId
        ? (merged === local ? server : local)
        : null;
    set({ draft: merged, recoveryCandidate: conflicting });
    if (merged) persist(merged);
  },
}));
