/**
 * The categorical series palette (**05 §3.1**), and the rules that keep it safe.
 *
 * The hexes were validated with a CVD checker against this product's own
 * surfaces — worst adjacent CVD ΔE 9.1 on light, 8.4 on dark. They are not
 * adjustable by eye.
 *
 * Two rules do the real work:
 *
 * **Slot 7 is a spacer and is not assignable.** Violet sits ΔE 5.4 from the Iris
 * brand colour on light, so a data mark in it lands next to a control in the
 * same hue. It cannot be deleted either: removing it makes magenta and red
 * adjacent, which fails the normal-vision floor at ΔE 13.2, and every 7-slot
 * reordering was tested and fails. Load-bearing in the ordering, unavailable in
 * assignment — which is why the ceiling is **six**.
 *
 * **Colour follows the entity, never its rank.** Assigning by position in the
 * currently-visible list means hiding one exercise repaints every other line.
 * `assignSeries` therefore takes the canonical set and a *visible* subset, and
 * the canonical position decides the colour.
 */
import type { Scheme } from '../../theme/tokens';

/** In order. Index 6 (slot 7) is the spacer — present, never assigned. */
const LIGHT = [
  '#2A78D6', '#EB6834', '#1BAF7A', '#EDA100', '#E87BA4', '#008300', '#4A3AA7', '#E34948',
] as const;

const DARK = [
  '#3987E5', '#D95926', '#199E70', '#C98500', '#D55181', '#008300', '#9085E9', '#E66767',
] as const;

/** 1-based, so it reads the same as the table in 05 §3.1. */
export const SPACER_SLOT = 7;

/** Six, because slot 7 is unavailable and a ninth hue is not permitted. */
export const ASSIGNABLE_CEILING = 6;

/** The tail past the ceiling is folded here rather than generating a hue. */
export const OTHER_KEY = 'Other';

/** Slot 8 (red) carries "Other" — a residual, never a series in its own right. */
const OTHER_SLOT = 8;

export function seriesColor(slot: number, scheme: Scheme): string {
  if (!Number.isInteger(slot) || slot < 1 || slot > LIGHT.length) {
    throw new RangeError(
      `series slot ${slot} is outside the palette (1–${LIGHT.length}); ` +
      'a ninth hue is not permitted (05 §3.1)',
    );
  }
  return (scheme === 'dark' ? DARK : LIGHT)[slot - 1]!;
}

export interface SeriesAssignment {
  /** entity key -> slot, 1-based. Never `SPACER_SLOT`. */
  slots: Map<string, number>;
  /** Keys beyond the ceiling, represented together as `OTHER_KEY`. */
  folded: string[];
}

export interface AssignOptions {
  /**
   * The subset currently on screen. Absent means "all of them".
   *
   * Filtering narrows what is drawn; it must not renumber what remains, so the
   * slot still comes from the canonical position.
   */
  visible?: readonly string[];
}

/**
 * @param canonical Every entity this chart can show, in a stable order.
 */
export function assignSeries(
  canonical: readonly string[],
  options: AssignOptions = {},
): SeriesAssignment {
  const slots = new Map<string, number>();
  const folded: string[] = [];
  const visible = options.visible ? new Set(options.visible) : null;

  canonical.forEach((key, index) => {
    if (index >= ASSIGNABLE_CEILING) {
      folded.push(key);
      return;
    }
    // index 0..5 -> slots 1..6, so the spacer is never reached.
    if (!visible || visible.has(key)) slots.set(key, index + 1);
  });

  if (folded.length > 0) slots.set(OTHER_KEY, OTHER_SLOT);

  return { slots, folded };
}
