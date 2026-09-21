import type { WorkoutSet } from '../types';

/**
 * Set volume = load × reps.
 * Only completed, non-warm-up sets count (BRD §10, decision D6).
 * A set with no load (bodyweight) contributes 0 — it is counted as a set elsewhere.
 */
export function setVolumeKg(s: WorkoutSet): number {
  if (!s.completed) return 0;
  if (s.setType === 'warmup') return 0;
  if (s.loadKg === null || s.reps === null) return 0;
  return s.loadKg * s.reps;
}

export function totalVolumeKg(sets: readonly WorkoutSet[]): number {
  return sets.reduce((t, s) => t + setVolumeKg(s), 0);
}

/** Muscle-group weighting: primary 1.0, secondary 0.5 (decision D7, configurable). */
export function weightedVolumeKg(
  volumeKg: number,
  role: 'primary' | 'secondary',
  secondaryWeight = 0.5,
): number {
  return volumeKg * (role === 'primary' ? 1 : secondaryWeight);
}
