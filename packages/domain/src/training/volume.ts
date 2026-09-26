import type { WorkoutSet } from '../types';

export interface VolumeOptions {
  /** K-04: the user counts warm-ups. Off by default (D6). */
  includeWarmups?: boolean;
}

/**
 * Set volume = load × reps.
 * Only completed sets count, and warm-ups only when the user counts them
 * (BRD §10, decision D6 — excluded by default, toggled in K-04).
 * A set with no load (bodyweight) contributes 0 — it is counted as a set elsewhere.
 */
export function setVolumeKg(s: WorkoutSet, opts: VolumeOptions = {}): number {
  if (!s.completed) return 0;
  if (s.setType === 'warmup' && !opts.includeWarmups) return 0;
  if (s.loadKg === null || s.reps === null) return 0;
  return s.loadKg * s.reps;
}

export function totalVolumeKg(sets: readonly WorkoutSet[], opts: VolumeOptions = {}): number {
  return sets.reduce((t, s) => t + setVolumeKg(s, opts), 0);
}

/** Muscle-group weighting: primary 1.0, secondary 0.5 (decision D7, configurable). */
export function weightedVolumeKg(
  volumeKg: number,
  role: 'primary' | 'secondary',
  secondaryWeight = 0.5,
): number {
  return volumeKg * (role === 'primary' ? 1 : secondaryWeight);
}
