import type { MealItem, DayTotals } from '../types';

/**
 * Decision D5 / BRD §12.9 — only confirmed items drive nutrition analytics.
 * Unconfirmed AI estimates are counted separately and shown in a pending band.
 */
export function dayTotals(items: readonly MealItem[]): DayTotals {
  const confirmed = items.filter(i => i.confirmed);
  const pendingCount = items.length - confirmed.length;
  let incomplete = false;
  const sum = (pick: (i: MealItem) => number | null): number =>
    confirmed.reduce((t, i) => {
      const v = pick(i);
      if (v === null) { incomplete = true; return t; }
      return t + v;
    }, 0);

  return {
    calories: sum(i => i.calories),
    proteinG: sum(i => i.proteinG),
    carbsG: sum(i => i.carbsG),
    fatG: sum(i => i.fatG),
    pendingCount,
    incomplete,
  };
}

/** Remaining against a target. Negative means over — the UI renders that, never hides it. */
export const remainingKcal = (consumed: number, target: number): number => target - consumed;
