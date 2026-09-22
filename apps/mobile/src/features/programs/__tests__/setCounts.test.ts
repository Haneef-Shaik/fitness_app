/**
 * C-05's live set-count-per-muscle summary.
 *
 * I4/D7 — primary ×1.0, secondary ×0.5. It must be the SAME weighting G-02's
 * analytics use, or the plan editor promises a balance the reports then deny.
 */
import type { Exercise, PlanExerciseIn } from '@volt/api-types';
import { muscleSetCounts } from '../setCounts';

const bench = {
  id: 'e1', name: 'Bench', muscles: [
    { id: 'm1', slug: 'chest', name: 'Chest', role: 'primary' },
    { id: 'm2', slug: 'triceps', name: 'Triceps', role: 'secondary' },
  ],
} as unknown as Exercise;

const fly = {
  id: 'e2', name: 'Fly', muscles: [{ id: 'm1', slug: 'chest', name: 'Chest', role: 'primary' }],
} as unknown as Exercise;

const lookup = (id: string) => ({ e1: bench, e2: fly }[id]);
const row = (exercise_id: string, target_sets: number | null) =>
  ({ exercise_id, target_sets, load_unit: 'kg' } as PlanExerciseIn);

describe('muscle set counts', () => {
  it('counts a primary muscle at full weight', () => {
    expect(muscleSetCounts([row('e2', 3)], lookup)).toEqual([
      { slug: 'chest', name: 'Chest', sets: 3 },
    ]);
  });

  it('counts a secondary muscle at half (D7)', () => {
    const counts = muscleSetCounts([row('e1', 4)], lookup);
    expect(counts).toContainEqual({ slug: 'chest', name: 'Chest', sets: 4 });
    expect(counts).toContainEqual({ slug: 'triceps', name: 'Triceps', sets: 2 });
  });

  it('adds across exercises that share a muscle', () => {
    const counts = muscleSetCounts([row('e1', 4), row('e2', 3)], lookup);
    expect(counts.find((m) => m.slug === 'chest')!.sets).toBe(7);
  });

  it('orders by volume so the heaviest muscle reads first', () => {
    const counts = muscleSetCounts([row('e1', 4), row('e2', 3)], lookup);
    expect(counts.map((m) => m.slug)).toEqual(['chest', 'triceps']);
  });

  it('ignores a row with no target sets — a prescription without sets counts nothing', () => {
    expect(muscleSetCounts([row('e1', null)], lookup)).toEqual([]);
    expect(muscleSetCounts([row('e1', 0)], lookup)).toEqual([]);
  });

  it('ignores an exercise missing from the catalog rather than crashing', () => {
    expect(muscleSetCounts([row('unknown', 3)], lookup)).toEqual([]);
  });

  it('rounds for display without rounding the arithmetic first', () => {
    // 3 sets × 0.5 = 1.5 — shown as 1.5, not floored to 1.
    const counts = muscleSetCounts([row('e1', 3)], lookup);
    expect(counts.find((m) => m.slug === 'triceps')!.sets).toBe(1.5);
  });
});
