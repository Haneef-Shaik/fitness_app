export const E1RM_FORMULA_VERSION = 'epley_v1';

/**
 * Epley: load × (1 + reps/30). BRD §10 requires the formula version to be stored
 * alongside the value, so history stays reproducible if the default ever changes.
 * Returns null when the set is not eligible (no load, or no reps).
 */
export function estimated1rmKg(loadKg: number | null, reps: number | null): number | null {
  if (loadKg === null || reps === null || reps < 1) return null;
  return loadKg * (1 + reps / 30);
}
