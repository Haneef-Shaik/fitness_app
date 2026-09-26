/**
 * The session draft (docs/03 §5.1).
 *
 * Every field is `readonly` and every reducer returns a NEW draft: the house rule
 * is immutability, and here it is also what makes the reducers testable without
 * rendering anything.
 *
 * Canonical units throughout (**I6**): `loadKg` is kilograms whatever the user
 * typed; `loadUnitEntered` records what they typed so the UI can show it back.
 */
import type { SetType } from '@fitlog/domain';

export type SyncState = 'pending' | 'syncing' | 'synced' | 'failed';

export interface DraftSet {
  /** I8 — generated ONCE at commit, and never regenerated on retry. */
  readonly clientId: string;
  readonly setIndex: number;
  readonly setType: SetType;
  readonly reps: number | null;
  readonly loadKg: number | null;
  readonly loadUnitEntered: 'kg' | 'lb';
  readonly durationSeconds: number | null;
  readonly distanceM: number | null;
  readonly rpe: number | null;
  readonly rir: number | null;
  readonly completed: boolean;
  readonly performedAt: string;
  readonly syncState: SyncState;
  readonly syncError?: string | null;
}

export interface DraftExercise {
  readonly clientId: string;
  /** The server id once it exists; null while the session is still local. */
  readonly sessionExerciseId: string | null;
  readonly exerciseId: string;
  readonly exerciseName: string | null;
  readonly orderIndex: number;
  /** I1 — frozen from the plan at start. Never re-read from the live plan. */
  readonly targetSnapshot: Readonly<Record<string, unknown>> | null;
  readonly sets: readonly DraftSet[];
  readonly notes: string | null;
  readonly skipped: boolean;
  readonly tracks: Readonly<{
    load: boolean; reps: boolean; duration: boolean; distance: boolean;
  }>;
}

export interface SessionDraft {
  /** Server-issued once known; a client uuid until then. */
  readonly sessionId: string;
  readonly planDayId: string | null;
  readonly startedAt: string;
  readonly status: 'in_progress';
  readonly exercises: readonly DraftExercise[];
  readonly notes: string | null;
  /** Bumps on every committed change; drives outbox ordering and stale detection. */
  readonly revision: number;
}

export const countSets = (d: SessionDraft): number =>
  d.exercises.reduce((n, e) => n + e.sets.length, 0);
