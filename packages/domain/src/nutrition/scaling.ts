/**
 * Scaling a food's nutrition to an actual quantity.
 *
 * `Per100g` and `Macros` are separate types deliberately. G7's contract names
 * "a per-100 g figure and a per-serving figure in the same column" as a trap,
 * and the same mistake is available in a variable: a number called `calories`
 * that sometimes means per-100 g is what writes 165 kcal against 2 kg of
 * chicken. The type system is the cheapest place to stop it.
 *
 * The other implementation is `services/api/app/domain/nutrition.py`, and
 * `contracts/vectors/domain.json` pins the two together.
 */

/** How a food stores its nutrition — the canonical form (I6). */
export interface Per100g {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

/** Absolute macros for a quantity. Never per-100 g. */
export interface Macros {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

/**
 * Unknown stays unknown: a null macro scales to null, never 0. "We do not know
 * the protein" and "it has no protein" are different claims, and the day totals
 * already distinguish them — collapsing one into the other here defeats that.
 *
 * No rounding. The display edge rounds; keeping the full number means summing
 * many items does not accumulate an error.
 */
export function scaleToGrams(per100g: Per100g, grams: number): Macros {
  const factor = grams / 100;
  const one = (v: number | null): number | null => (v === null ? null : v * factor);
  return {
    calories: one(per100g.calories),
    proteinG: one(per100g.proteinG),
    carbsG: one(per100g.carbsG),
    fatG: one(per100g.fatG),
  };
}
