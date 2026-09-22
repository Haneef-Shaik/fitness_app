/**
 * The categorical palette, and the rules that make it safe (05 §3.1).
 *
 * These are not style preferences. The palette was validated with a CVD checker
 * against this product's own surfaces, and three of the rules are load-bearing
 * in a way that is easy to undo by accident:
 *
 *   Slot 7 (violet) is a SPACER. It sits ΔE 5.4 from the Iris brand colour on
 *   light, so a data mark in it lands next to a control in the same hue. It also
 *   cannot be deleted: removing it makes magenta and red adjacent, which fails
 *   the normal-vision floor at ΔE 13.2. Load-bearing in the ordering,
 *   unavailable in assignment — so the ceiling is SIX.
 *
 *   Colour follows the ENTITY, never its rank. Filtering one exercise out must
 *   not repaint every other line, which is what index-based assignment does.
 */
import {
  ASSIGNABLE_CEILING, OTHER_KEY, SPACER_SLOT, assignSeries, seriesColor,
} from '../series';

describe('the palette itself', () => {
  it('matches the design system, slot for slot, in both themes', () => {
    // Copied from 05 §3.1 deliberately: if someone "tidies" a hex here, this
    // fails rather than silently shipping an unvalidated palette.
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((s) => seriesColor(s, 'light'))).toEqual([
      '#2A78D6', '#EB6834', '#1BAF7A', '#EDA100', '#E87BA4', '#008300', '#4A3AA7', '#E34948',
    ]);
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((s) => seriesColor(s, 'dark'))).toEqual([
      '#3987E5', '#D95926', '#199E70', '#C98500', '#D55181', '#008300', '#9085E9', '#E66767',
    ]);
  });

  it('keeps slot 7 in the ordering even though nothing may use it', () => {
    // Deleting it is the tempting "cleanup" that breaks the magenta/red pair.
    expect(seriesColor(SPACER_SLOT, 'dark')).toBe('#9085E9');
    expect(SPACER_SLOT).toBe(7);
  });
});

describe('assignment', () => {
  it('never hands out the spacer', () => {
    // SEVEN keys, not six. With only six the spacer is unreachable whatever the
    // ceiling is, so the test would pass against a ceiling raised to 7 — which
    // is exactly the mutation it is supposed to catch.
    const { slots } = assignSeries(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    expect([...slots.values()]).not.toContain(SPACER_SLOT);
  });

  it('still refuses the spacer with far more series than slots', () => {
    const many = Array.from({ length: 20 }, (_, i) => `e${i}`);
    const { slots } = assignSeries(many);
    expect([...slots.values()]).not.toContain(SPACER_SLOT);
    expect([...slots.values()].filter((v) => v <= ASSIGNABLE_CEILING)).toHaveLength(6);
  });

  it('assigns the first six in fixed order', () => {
    const { slots } = assignSeries(['a', 'b', 'c', 'd', 'e', 'f']);
    expect([...slots.entries()]).toEqual([
      ['a', 1], ['b', 2], ['c', 3], ['d', 4], ['e', 5], ['f', 6],
    ]);
  });

  it('folds the tail into "Other" past six rather than inventing a ninth hue', () => {
    const { slots, folded } = assignSeries(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    expect(folded).toEqual(['g', 'h']);
    expect(slots.size).toBe(ASSIGNABLE_CEILING + 1);   // six, plus Other
    expect(slots.has(OTHER_KEY)).toBe(true);
  });

  it('gives "Other" a slot that is not one of the six', () => {
    const { slots } = assignSeries(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    const assigned = ['a', 'b', 'c', 'd', 'e', 'f'].map((k) => slots.get(k));
    expect(assigned).not.toContain(slots.get(OTHER_KEY));
  });

  it('does not fold when there are exactly six', () => {
    const { folded } = assignSeries(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(folded).toEqual([]);
  });
});

describe('colour follows the entity, never its rank', () => {
  it('keeps every other series on its colour when one is filtered out', () => {
    // The trap, stated: a user hides "Bench" and expects the other lines to
    // stay put. Index-based assignment repaints all of them.
    const canonical = ['bench', 'squat', 'deadlift', 'row'];
    const all = assignSeries(canonical);

    const withoutBench = assignSeries(canonical, { visible: ['squat', 'deadlift', 'row'] });

    for (const key of ['squat', 'deadlift', 'row']) {
      expect(withoutBench.slots.get(key)).toBe(all.slots.get(key));
    }
  });

  it('drops the hidden entity rather than leaving a gap in the legend', () => {
    const canonical = ['bench', 'squat'];
    const { slots } = assignSeries(canonical, { visible: ['squat'] });
    expect(slots.has('bench')).toBe(false);
    expect(slots.get('squat')).toBe(2);
  });

  it('is stable across calls — the same entity gets the same slot', () => {
    const keys = ['chest', 'back', 'legs'];
    expect([...assignSeries(keys).slots]).toEqual([...assignSeries(keys).slots]);
  });
});

describe('guards', () => {
  it('refuses a slot outside the palette rather than inventing a hue', () => {
    expect(() => seriesColor(9, 'dark')).toThrow(/slot/i);
    expect(() => seriesColor(0, 'dark')).toThrow(/slot/i);
  });

  it('handles no series at all', () => {
    const { slots, folded } = assignSeries([]);
    expect(slots.size).toBe(0);
    expect(folded).toEqual([]);
  });
});
