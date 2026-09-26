/**
 * How nutrition reads. One formatter, so H-01, H-02 and the dashboard phrase
 * the same numbers the same way.
 */
export function kcal(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return Math.round(v).toLocaleString('en-US');
}

/**
 * Macros to one decimal, and only when the decimal says something.
 *
 * `31 g` reads better than `31.0 g`; `0.5 g` must not become `1 g`.
 */
export function grams(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  const rounded = Math.round(v * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded} g` : `${rounded.toFixed(1)} g`;
}

/**
 * A macro as one sentence for a screen reader: "Protein, 42 g of 176 g".
 * Name and figure used to be separate stops laid out in columns, so TalkBack
 * read three names and then three figures (G10 TalkBack session).
 */
export function macroLabel(name: string, value: number | null | undefined, target?: number | null): string {
  return `${name}, ${grams(value)}${target ? ` of ${target} g` : ''}`;
}

/** "200 g" / "1 slice (32 g)" — the quantity as a person would say it. */
export function portion(
  quantityGrams: number | null | undefined,
  servingLabel?: string | null,
  servingGrams?: number | null,
): string {
  if (quantityGrams === null || quantityGrams === undefined) return '—';
  if (servingLabel && servingGrams && Math.abs(quantityGrams - servingGrams) < 0.5) {
    return `${servingLabel} (${grams(quantityGrams)})`;
  }
  return grams(quantityGrams);
}

/** The slugs every account starts with. Mirrors DEFAULT_MEAL_CATEGORIES. */
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealTypeName = (typeof MEAL_TYPES)[number];

export interface NamedCategory {
  slug: string;
  name: string;
}

/**
 * The label for a meal's category.
 *
 * Meals store the **slug**; the name lives on the category, so a rename shows
 * up everywhere at once (**I15** — one canonical home). The fallback exists for
 * a meal filed under a category that has since been deleted: "pre-workout"
 * still reads as "Pre workout" rather than as nothing at all.
 */
export function mealTypeLabel(
  slug: string,
  categories?: readonly NamedCategory[] | null,
): string {
  const match = categories?.find((c) => c.slug === slug);
  if (match) return match.name;
  const spaced = slug.replace(/-/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** "1 item", "3 items" — a count that is read aloud has to be grammatical. */
export function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

/**
 * K-08's "resets in 5 h 12 min", to the AI quota's `resets_at`.
 *
 * A countdown, not a clock time: the reset is the PROFILE's midnight (I7) and
 * the phone may be in another zone, where a clock time would be wrong and a
 * countdown is not. Null when it has passed or is more than a day away — the
 * server's clock and this one disagree, and a wrong number is worse than none.
 */
export function untilReset(resetsAt: string, now: Date = new Date()): string | null {
  const ms = new Date(resetsAt).getTime() - now.getTime();
  if (!Number.isFinite(ms) || ms <= 0 || ms > 24 * 3_600_000) return null;
  const minutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `in ${hours} h ${minutes % 60} min` : `in ${minutes} min`;
}
