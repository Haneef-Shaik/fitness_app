import type { WorkoutSet } from '../types';

export type Validity = { valid: true } | { valid: false; error: string };

/**
 * W04.7 — a set with no reps AND no duration AND no distance is invalid.
 * Load alone is not a set.
 */
export function validateSet(s: Partial<WorkoutSet>): Validity {
  if (s.reps !== undefined && s.reps !== null) {
    if (!Number.isInteger(s.reps) || s.reps < 1) {
      return { valid: false, error: 'Reps must be a whole number of at least 1.' };
    }
  }
  if (s.loadKg !== undefined && s.loadKg !== null && s.loadKg < 0) {
    return { valid: false, error: 'Load cannot be negative.' };
  }
  const hasReps = s.reps !== undefined && s.reps !== null;
  const hasDuration = s.durationSeconds !== undefined && s.durationSeconds !== null;
  const hasDistance = s.distanceM !== undefined && s.distanceM !== null;
  if (!hasReps && !hasDuration && !hasDistance) {
    return { valid: false, error: 'Add reps, time or distance to save this set.' };
  }
  return { valid: true };
}
