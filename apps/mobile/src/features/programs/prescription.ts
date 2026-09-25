/**
 * How one exercise in a starter program reads: "5 × 5", "3 × 8–12",
 * "3 × 30 s", "1 × 5+" (G10 — the library showed only exercise names, so two
 * programs with the same lifts looked identical).
 */
export interface Prescribed {
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  duration_seconds: number | null;
}

function duration(seconds: number): string {
  return seconds < 60 ? `${seconds} s` : `${Math.round((seconds / 60) * 10) / 10} min`;
}

export function prescription(e: Prescribed): string {
  if (e.duration_seconds != null) return `${e.sets} × ${duration(e.duration_seconds)}`;
  if (e.reps_min == null) return `${e.sets} set${e.sets === 1 ? '' : 's'}`;
  if (e.reps_max == null) return `${e.sets} × ${e.reps_min}+`;
  if (e.reps_max === e.reps_min) return `${e.sets} × ${e.reps_min}`;
  return `${e.sets} × ${e.reps_min}–${e.reps_max}`;
}
