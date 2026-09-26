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
import { validateSet } from '@fitlog/domain';
import type { NewOutboxEntry, SessionStore } from '../../../lib/db/types';
import {
  addExercise, appendSet, deleteSet, editSet, mergeRecovered, patchExercise,
  prefillFrom, removeExercise, reorderExercises, setNotes, setSyncState, startDraft, swapExercise,
  type NewExercise, type NewSet, type StartDraftInput,
} from './reducers';
import type { DraftSet, SessionDraft, SyncState } from './types';
import { uuid } from '../../../lib/uuid';

export interface CommitResult {
  ok: boolean;
  /** Set when validation refused the set. Shown inline, never as a modal. */
  error?: string;
}

interface Persistence {
  store: SessionStore;
  /** Called after every committed change; failures are surfaced, never thrown at the UI. */
  onPersistError?: (e: unknown) => void;
  /**
   * Called once a write has actually landed — which is the only moment an
   * outbox entry is really in the queue.
   *
   * The logger used to flush straight after `commitSet` returned. But the entry
   * is written by the fire-and-forget `persist()` below, so that flush could read
   * the queue before the entry reached it, find nothing, and leave the set
   * queued with nothing to re-arm it. On a phone the third of three sets showed
   * on screen and never reached the server.
   */
  onPersisted?: () => void;
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
    // Still fire-and-forget — nothing here is awaited by the commit path, so
    // I10 holds. The difference is only WHO says "there is something to send",
    // and now it is the write itself rather than the caller's optimism.
    .then(() => { p.onPersisted?.(); })
    .catch((e) => p.onPersistError?.(e));
}

/**
 * Several writes that must land in THIS order: each is committed only after
 * the one before it is in the queue, so their queue positions cannot swap.
 */
function persistInOrder(draft: SessionDraft, entries: readonly (NewOutboxEntry | undefined)[]): void {
  const p = persistence;
  if (!p) return;
  const row = () => ({ revision: draft.revision, updatedAt: new Date().toISOString(), json: JSON.stringify(draft) });
  void entries
    .reduce<Promise<void>>((chain, entry) => chain.then(() => p.store.commit(row(), entry)), Promise.resolve())
    .then(() => { p.onPersisted?.(); })
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
      note: set.note ?? null,
      load_unit_entered: set.loadUnitEntered,
      completed: set.completed,
      performed_at: set.performedAt,
    }),
    // I8 — generated once, at commit, replayed unchanged for ever after.
    idempotencyKey: set.clientId,
    nextAttemptAt: new Date().toISOString(),
  };
}

/**
 * Any other mid-session change, queued behind the sets of the same session.
 *
 * FIFO per aggregate is what makes these safe offline: a delete can never
 * overtake the create it undoes, and a set can never overtake the exercise it
 * belongs to. Each gets a fresh key — two edits are two writes, and the second
 * must not overwrite the first while the first is still queued.
 */
function changeEntry(
  draft: SessionDraft, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', path: string, body: unknown,
): NewOutboxEntry {
  return {
    aggregateId: draft.sessionId,
    method,
    path,
    body: JSON.stringify(body),
    idempotencyKey: uuid(),
    nextAttemptAt: new Date().toISOString(),
  };
}

/** The whole order, by server ids — the server refuses a partial list. */
function orderEntry(draft: SessionDraft): NewOutboxEntry | undefined {
  const ids = draft.exercises.map((e) => e.sessionExerciseId);
  if (ids.some((id) => !id)) return undefined;
  return changeEntry(draft, 'PUT', `/workout-sessions/${draft.sessionId}/exercises/order`, ids);
}

/** The server's names for the draft's fields — only what the patch touched. */
function setPatchBody(patch: Partial<DraftSet>): Record<string, unknown> {
  const names: Partial<Record<keyof DraftSet, string>> = {
    setType: 'set_type', reps: 'reps', loadKg: 'load_kg', durationSeconds: 'duration_seconds',
    distanceM: 'distance_m', rpe: 'rpe', rir: 'rir', note: 'note', completed: 'completed',
  };
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    const name = names[key as keyof DraftSet];
    if (name) body[name] = value;
  }
  return body;
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
  /** E-05 — only an exercise with nothing logged; returns whether it swapped. */
  swapExercise(exerciseClientId: string, input: NewExercise): boolean;
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
    const current = get().draft!;
    const next = editSet(current, setClientId, patch);
    if (next === current) return;
    set({ draft: next });
    const body = setPatchBody(patch);
    persist(next, Object.keys(body).length
      ? changeEntry(next, 'PATCH', `/workout-sessions/${next.sessionId}/sets/by-client/${setClientId}`, body)
      : undefined);
  },

  deleteSet(setClientId) {
    const current = get().draft!;
    const next = deleteSet(current, setClientId);
    if (next === current) return;
    set({ draft: next });
    // The ✕ used to stop here: the row left the screen, the set stayed on the
    // server, and the finished workout counted it.
    persist(next, changeEntry(
      next, 'DELETE', `/workout-sessions/${next.sessionId}/sets/by-client/${setClientId}`, {},
    ));
  },

  markSync(setClientId, state, error = null) {
    const current = get().draft;
    if (!current) return;
    // Not a user change, so it does not bump the revision or re-enqueue.
    set({ draft: setSyncState(current, setClientId, state, error) });
  },

  addExercise(input) {
    // The phone names the session exercise itself, so the sets logged against it
    // can be queued at once, offline, without waiting for a server id. Before
    // G11 they waited for an id that never came, and never left the phone.
    const sessionExerciseId = input.sessionExerciseId ?? input.clientId;
    const next = addExercise(get().draft!, { ...input, sessionExerciseId });
    set({ draft: next });
    persist(next, input.sessionExerciseId ? undefined : changeEntry(
      next, 'POST', `/workout-sessions/${next.sessionId}/exercises`,
      { exercise_id: input.exerciseId, id: sessionExerciseId },
    ));
  },

  removeExercise(exerciseClientId) {
    const current = get().draft!;
    const gone = current.exercises.find((e) => e.clientId === exerciseClientId);
    const next = removeExercise(current, exerciseClientId);
    if (next === current) return;
    set({ draft: next });
    persist(next, gone?.sessionExerciseId
      ? changeEntry(next, 'DELETE', `/session-exercises/${gone.sessionExerciseId}`, {})
      : undefined);
  },

  reorderExercises(orderedClientIds) {
    const current = get().draft!;
    const next = reorderExercises(current, orderedClientIds);
    if (next === current) return;
    set({ draft: next });
    persist(next, orderEntry(next));
  },

  swapExercise(exerciseClientId, input) {
    const current = get().draft!;
    const old = current.exercises.find((e) => e.clientId === exerciseClientId);
    const sessionExerciseId = input.sessionExerciseId ?? input.clientId;
    const next = swapExercise(current, exerciseClientId, { ...input, sessionExerciseId });
    if (next === current) return false;
    set({ draft: next });
    // Three writes, in order, behind everything else this session queued: the
    // new exercise, the old one gone, and the order that puts the new one in
    // the old one's place (the server appends).
    persistInOrder(next, [
      changeEntry(next, 'POST', `/workout-sessions/${next.sessionId}/exercises`,
        { exercise_id: input.exerciseId, id: sessionExerciseId }),
      old?.sessionExerciseId
        ? changeEntry(next, 'DELETE', `/session-exercises/${old.sessionExerciseId}`, {})
        : undefined,
      orderEntry(next),
    ]);
    return true;
  },

  patchExercise(exerciseClientId, patch) {
    const current = get().draft!;
    const next = patchExercise(current, exerciseClientId, patch);
    if (next === current) return;
    set({ draft: next });
    const target = next.exercises.find((e) => e.clientId === exerciseClientId);
    const body: Record<string, unknown> = {};
    if ('notes' in patch) body.notes = patch.notes;
    if ('skipped' in patch) body.skipped = patch.skipped;
    if ('supersetGroup' in patch) body.superset_group = patch.supersetGroup;
    persist(next, target?.sessionExerciseId && Object.keys(body).length
      ? changeEntry(next, 'PATCH', `/session-exercises/${target.sessionExerciseId}`, body)
      : undefined);
  },

  setNotes(notes) {
    const next = setNotes(get().draft!, notes);
    set({ draft: next });
    persist(next, changeEntry(next, 'PATCH', `/workout-sessions/${next.sessionId}`, { notes }));
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
