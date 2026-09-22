import type { Exercise, PlanExerciseIn } from '@volt/api-types';

export interface MuscleSetCount {
  slug: string;
  name: string;
  /** Weighted: primary ×1, secondary ×0.5 (D7 / I4), rounded for display. */
  sets: number;
}

/**
 * C-05's live set-count-per-muscle summary.
 *
 * It uses the SAME weighting as G-02's analytics (primary 1.0, secondary 0.5) so
 * that what the plan editor promises and what the analytics later report are the
 * same number. A second weighting here is how planning and reporting drift.
 */
export function muscleSetCounts(
  rows: readonly PlanExerciseIn[],
  lookup: (exerciseId: string) => Exercise | undefined,
  secondaryWeight = 0.5,
): MuscleSetCount[] {
  const totals = new Map<string, { name: string; sets: number }>();

  for (const row of rows) {
    const ex = lookup(row.exercise_id);
    if (!ex) continue;
    const sets = row.target_sets ?? 0;
    if (sets <= 0) continue;

    for (const m of ex.muscles ?? []) {
      const weighted = sets * (m.role === 'primary' ? 1 : secondaryWeight);
      const current = totals.get(m.slug) ?? { name: m.name, sets: 0 };
      totals.set(m.slug, { name: current.name, sets: current.sets + weighted });
    }
  }

  return [...totals.entries()]
    .map(([slug, v]) => ({ slug, name: v.name, sets: Math.round(v.sets * 10) / 10 }))
    .sort((a, b) => b.sets - a.sets || a.name.localeCompare(b.name));
}
