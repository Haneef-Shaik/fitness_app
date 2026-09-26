/**
 * E-08's numbers, computed from the draft so the summary is instant.
 *
 * **Every figure comes from `@fitlog/domain`**, never from a local re-derivation:
 * the same TypeScript the shared vectors pin, mirroring the Python the server
 * runs inside the finish transaction. That is what makes the instant client-side
 * summary and the server's authoritative one agree by construction rather than
 * by luck (**I3** warm-ups excluded, **I5** Epley as `epley_v1`).
 */
import {
  E1RM_FORMULA_VERSION, estimated1rmKg, evaluateRecords, isPrEligible, setVolumeKg,
  totalVolumeKg, type WorkoutSet as DomainSet,
} from '@fitlog/domain';
import type { DraftSet, SessionDraft } from './store/types';

const toDomain = (s: DraftSet): DomainSet => ({
  setType: s.setType,
  loadKg: s.loadKg,
  reps: s.reps,
  durationSeconds: s.durationSeconds,
  distanceM: s.distanceM,
  completed: s.completed,
});

export interface ExerciseSummary {
  clientId: string;
  name: string | null;
  setCount: number;
  /** Warm-ups excluded (I3/D6). */
  volumeKg: number;
  bestE1rmKg: number | null;
  formulaVersion: string | null;
}

export interface SessionSummary {
  durationSeconds: number;
  exerciseCount: number;
  setCount: number;
  totalVolumeKg: number;
  exercises: ExerciseSummary[];
}

export interface SummaryOptions {
  /** K-04 — the user counts warm-ups toward volume. The server agrees (D6). */
  includeWarmups?: boolean;
}

export function summarise(
  draft: SessionDraft, finishedAt: Date, opts: SummaryOptions = {},
): SessionSummary {
  const started = Date.parse(draft.startedAt);
  const durationSeconds = Number.isNaN(started)
    ? 0
    : Math.max(0, Math.round((finishedAt.getTime() - started) / 1000));

  const exercises = draft.exercises.map((e) => {
    const domain = e.sets.map(toDomain);
    const e1rms = domain
      .filter(isPrEligible)
      .map((d) => estimated1rmKg(d.loadKg, d.reps))
      .filter((v): v is number => v !== null);

    return {
      clientId: e.clientId,
      name: e.exerciseName,
      setCount: e.sets.length,
      volumeKg: totalVolumeKg(domain, opts),
      bestE1rmKg: e1rms.length ? Math.max(...e1rms) : null,
      formulaVersion: e1rms.length ? E1RM_FORMULA_VERSION : null,
    };
  });

  return {
    durationSeconds,
    exerciseCount: draft.exercises.length,
    setCount: draft.exercises.reduce((n, e) => n + e.sets.length, 0),
    totalVolumeKg: draft.exercises.reduce((n, e) => n + totalVolumeKg(e.sets.map(toDomain), opts), 0),
    exercises,
  };
}

/** What a single set contributed — the per-set delta E-03 shows. */
export const contribution = (s: DraftSet, opts: SummaryOptions = {}): number =>
  setVolumeKg(toDomain(s), opts);

/** The four records this session would set, for E-11. Warm-ups are not attempts. */
export const draftRecords = (sets: readonly DraftSet[]) => evaluateRecords(sets.map(toDomain));
