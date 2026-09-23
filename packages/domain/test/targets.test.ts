/**
 * The target calculator (H-15).
 *
 * This lives in the domain package, not the screen, for one reason: the
 * interlocked macro sliders are the only piece of arithmetic in G7 where a
 * rounding slip is invisible — three numbers that read 30 / 40 / 30 while
 * summing to 99 look completely correct. So the sum is asserted, not eyeballed.
 *
 * It is deliberately NOT in contracts/vectors/domain.json: the server never
 * computes a target, it only stores the number a user settled on. That file
 * means "both languages compute this", and a Python twin here would be code
 * written for nobody.
 */
import { describe, it, expect } from 'vitest';
import type { MacroKey, MacroSplit } from '../src/nutrition/targets';
import {
  ACTIVITY_MULTIPLIER,
  MACRO_KCAL_PER_G,
  PRESET_SPLITS,
  FALLBACK_KCAL_PER_KG,
  bmrMifflinStJeor,
  fallbackMaintenance,
  caloriesNotice,
  macroGrams,
  proteinNotice,
  rebalanceSplit,
  splitFromGrams,
  splitTotal,
  targetCalories,
  tdee,
} from '../src/nutrition/targets';

describe('BMR — Mifflin–St Jeor', () => {
  // 10×80 + 6.25×180 − 5×30 + 5 = 800 + 1125 − 150 + 5 = 1780
  it('computes the male form', () => {
    expect(bmrMifflinStJeor({ weightKg: 80, heightCm: 180, ageYears: 30, sex: 'male' }))
      .toBeCloseTo(1780, 6);
  });

  // 10×65 + 6.25×165 − 5×30 − 161 = 650 + 1031.25 − 150 − 161 = 1370.25
  it('computes the female form', () => {
    expect(bmrMifflinStJeor({ weightKg: 65, heightCm: 165, ageYears: 30, sex: 'female' }))
      .toBeCloseTo(1370.25, 6);
  });

  it('returns null rather than a number when an input is missing', () => {
    // The screen has to be able to say WHICH field it is missing. A silent
    // default here would produce a confident, wrong calorie target.
    expect(bmrMifflinStJeor({ weightKg: 80, heightCm: 180, ageYears: null, sex: 'male' })).toBeNull();
    expect(bmrMifflinStJeor({ weightKg: 80, heightCm: null, ageYears: 30, sex: 'male' })).toBeNull();
    expect(bmrMifflinStJeor({ weightKg: null, heightCm: 180, ageYears: 30, sex: 'male' })).toBeNull();
    expect(bmrMifflinStJeor({ weightKg: 80, heightCm: 180, ageYears: 30, sex: null })).toBeNull();
  });

  it('treats an unrecognised sex as missing, not as male', () => {
    expect(bmrMifflinStJeor({ weightKg: 80, heightCm: 180, ageYears: 30, sex: 'other' })).toBeNull();
  });
});

describe('the fallback when age or sex is unknown', () => {
  /**
   * H-15's edge case: Mifflin–St Jeor needs a birth date and a sex, and a new
   * account has neither. Refusing to show anything is worse than a stated
   * estimate, so the screen falls back to weight × activity — and SAYS it is a
   * rougher number rather than dressing it up as the real formula.
   */
  it('estimates from weight and activity alone', () => {
    expect(fallbackMaintenance(80, 'moderate'))
      .toBe(Math.round(80 * FALLBACK_KCAL_PER_KG * 1.55));
  });

  it('returns null without a weight — there is nothing left to estimate from', () => {
    expect(fallbackMaintenance(null, 'moderate')).toBeNull();
    expect(fallbackMaintenance(0, 'moderate')).toBeNull();
  });
});

describe('TDEE and the goal adjustment', () => {
  it('multiplies by the activity level', () => {
    expect(tdee(1680, 'moderate')).toBeCloseTo(1680 * 1.55, 6);
    expect(ACTIVITY_MULTIPLIER.sedentary).toBe(1.2);
    expect(ACTIVITY_MULTIPLIER.extra).toBe(1.9);
  });

  it('applies the goal percentage and rounds to a whole calorie', () => {
    // The wireframe's own worked example: 1680 × 1.55 = 2604 → −10% = 2343.6
    expect(targetCalories(tdee(1680, 'moderate'), -10)).toBe(2344);
  });

  it('a surplus adds', () => {
    expect(targetCalories(2000, 15)).toBe(2300);
  });

  it('maintenance changes nothing', () => {
    expect(targetCalories(2604, 0)).toBe(2604);
  });
});

describe('macro grams', () => {
  it('uses 4 / 4 / 9 kcal per gram', () => {
    expect(MACRO_KCAL_PER_G).toEqual({ proteinG: 4, carbsG: 4, fatG: 9 });
  });

  it('converts a split at a calorie target', () => {
    // 2340 kcal at 30/40/30 → 702/4 = 175.5 → 176 · 936/4 = 234 · 702/9 = 78
    expect(macroGrams(2340, { proteinG: 30, carbsG: 40, fatG: 30 }))
      .toEqual({ proteinG: 176, carbsG: 234, fatG: 78 });
  });

  it('back-computes percentages from grams', () => {
    expect(splitFromGrams(2340, { proteinG: 176, carbsG: 234, fatG: 78 }))
      .toEqual({ proteinG: 30, carbsG: 40, fatG: 30 });
  });

  it('reports a total that does NOT reach 100 when the grams do not', () => {
    // Editing grams directly can leave the day under-specified. Normalising it
    // back to 100 would hide that; the screen must be able to show the gap.
    const split = splitFromGrams(2000, { proteinG: 100, carbsG: 100, fatG: 20 });
    expect(splitTotal(split)).toBeLessThan(100);
  });
});

describe('rebalanceSplit — the interlock', () => {
  it('always totals exactly 100', () => {
    /**
     * The bases matter more than the sweep does. 40:30 has a denominator of 7,
     * which makes the two fractional parts always sum to 1 — independent
     * rounding happens to be right every single time, so a sweep over that base
     * alone proves nothing. An EQUAL pair is where it breaks: 49.5 and 49.5 both
     * round up and the split silently totals 101. Hence the bases below.
     */
    const bases: MacroSplit[] = [
      { proteinG: 30, carbsG: 40, fatG: 30 },
      { proteinG: 0, carbsG: 50, fatG: 50 },   // equal others — the 49.5/49.5 case
      { proteinG: 34, carbsG: 33, fatG: 33 },  // near-equal others
      { proteinG: 10, carbsG: 1, fatG: 89 },   // lopsided
      { proteinG: 100, carbsG: 0, fatG: 0 },   // nothing to be proportional to
    ];
    for (const base of bases) {
      for (const key of ['proteinG', 'carbsG', 'fatG'] as MacroKey[]) {
        for (let pct = 0; pct <= 100; pct += 1) {
          const next = rebalanceSplit(base, key, pct);
          expect(`${JSON.stringify(base)} ${key}->${pct} = ${splitTotal(next)}`)
            .toBe(`${JSON.stringify(base)} ${key}->${pct} = 100`);
        }
      }
    }
  });

  it('never lets a macro go negative, whatever the base', () => {
    const next = rebalanceSplit({ proteinG: 0, carbsG: 50, fatG: 50 }, 'proteinG', 99);
    expect(Math.min(next.proteinG, next.carbsG, next.fatG)).toBeGreaterThanOrEqual(0);
  });

  it('honours the value that was moved', () => {
    const next = rebalanceSplit({ proteinG: 30, carbsG: 40, fatG: 30 }, 'proteinG', 45);
    expect(next.proteinG).toBe(45);
  });

  it('redistributes the remainder in proportion, not evenly', () => {
    // carbs 60 : fat 20 is 3:1. Dropping protein from 20 to 0 hands back 20,
    // which must go 15 to carbs and 5 to fat — NOT 10 and 10.
    const next = rebalanceSplit({ proteinG: 20, carbsG: 60, fatG: 20 }, 'proteinG', 0);
    expect(next).toEqual({ proteinG: 0, carbsG: 75, fatG: 25 });
  });

  it('splits evenly when the other two are both zero', () => {
    const next = rebalanceSplit({ proteinG: 100, carbsG: 0, fatG: 0 }, 'proteinG', 40);
    expect(splitTotal(next)).toBe(100);
    expect(next.carbsG + next.fatG).toBe(60);
    expect(Math.abs(next.carbsG - next.fatG)).toBeLessThanOrEqual(1);
  });

  it('clamps out-of-range input instead of producing a negative macro', () => {
    expect(rebalanceSplit({ proteinG: 30, carbsG: 40, fatG: 30 }, 'fatG', 140).fatG).toBe(100);
    expect(rebalanceSplit({ proteinG: 30, carbsG: 40, fatG: 30 }, 'fatG', -20).fatG).toBe(0);
  });

  it('does not mutate the split it was given', () => {
    const original = { proteinG: 30, carbsG: 40, fatG: 30 };
    rebalanceSplit(original, 'proteinG', 50);
    expect(original).toEqual({ proteinG: 30, carbsG: 40, fatG: 30 });
  });

  it('every preset already totals 100', () => {
    for (const [name, split] of Object.entries(PRESET_SPLITS)) {
      expect(`${name}:${splitTotal(split)}`).toBe(`${name}:100`);
    }
  });
});

describe('notices — the validation the wireframe asks for', () => {
  it('refuses a target outside 800–8000', () => {
    expect(caloriesNotice(700)?.level).toBe('error');
    expect(caloriesNotice(8600)?.level).toBe('error');
  });

  it('warns softly below 1200 without blocking it', () => {
    const notice = caloriesNotice(1100);
    expect(notice?.level).toBe('warning');
    expect(caloriesNotice(1200)).toBeNull();
  });

  it('says nothing about an ordinary target', () => {
    expect(caloriesNotice(2340)).toBeNull();
  });

  it('warns above 4 g of protein per kg', () => {
    expect(proteinNotice(340, 80)?.level).toBe('warning'); // 4.25 g/kg
    expect(proteinNotice(320, 80)).toBeNull();             // exactly 4.0
  });

  it('says nothing when bodyweight is unknown', () => {
    expect(proteinNotice(340, null)).toBeNull();
  });
});
