/**
 * The onboarding energy plan (A-08), from what the user actually told us.
 *
 * Until G10 onboarding showed a target computed from a HARD-CODED BMR of
 * 1,680 — the same number for everyone. This is the replacement: Mifflin–St
 * Jeor from real inputs, a deficit or surplus sized from the pace the user
 * chose, a safety floor, and macros led by protein per kg of bodyweight.
 */
import { describe, expect, it } from 'vitest';
import { energyPlan, KCAL_PER_KG } from '../src/nutrition/plan';

const base = {
  weightKg: 80, heightCm: 180, ageYears: 30, sex: 'male' as const, activity: 'moderate' as const,
};

describe('maintenance', () => {
  it('is Mifflin–St Jeor × activity when everything is known', () => {
    const p = energyPlan({ ...base, goal: 'maintenance' })!;
    // 10×80 + 6.25×180 − 5×30 + 5 = 1,780; × 1.55 = 2,759
    expect(p.method).toBe('mifflin');
    expect(p.bmr).toBe(1780);
    expect(p.maintenance).toBe(2759);
    expect(p.calories).toBe(2759);
  });

  it('falls back to a weight-based estimate without age or sex, and says so', () => {
    const p = energyPlan({ ...base, ageYears: null, goal: 'maintenance' })!;
    expect(p.method).toBe('fallback');
    expect(p.bmr).toBeNull();
    expect(p.steps.join(' ')).toMatch(/rough/i);
  });

  it('cannot plan without a weight', () => {
    expect(energyPlan({ ...base, weightKg: null, goal: 'maintenance' })).toBeNull();
  });
});

describe('the adjustment comes from the pace the user chose', () => {
  it('losing 0.5 kg a week is a deficit of 550 kcal a day', () => {
    const p = energyPlan({ ...base, goal: 'fat_loss', weeklyRateKg: 0.5 })!;
    expect(KCAL_PER_KG).toBe(7700);
    expect(p.adjustment).toBe(-550);
    expect(p.calories).toBe(2759 - 550);
  });

  it('gaining 0.25 kg a week is a surplus of 275', () => {
    const p = energyPlan({ ...base, goal: 'muscle_gain', weeklyRateKg: 0.25 })!;
    expect(p.adjustment).toBe(275);
  });

  it('with no pace chosen, uses a moderate default for the goal', () => {
    expect(energyPlan({ ...base, goal: 'fat_loss' })!.adjustment).toBe(-550);
    expect(energyPlan({ ...base, goal: 'muscle_gain' })!.adjustment).toBe(275);
    expect(energyPlan({ ...base, goal: 'strength' })!.adjustment).toBe(0);
  });

  it('never cuts more than a quarter of maintenance, however fast the pace', () => {
    const p = energyPlan({ ...base, goal: 'fat_loss', weeklyRateKg: 1.5 })!;
    expect(p.adjustment).toBe(-Math.round(2759 * 0.25));
    expect(p.capped).toBe(true);
  });

  it('never goes below the floor, and says it applied one', () => {
    const small = energyPlan({
      weightKg: 50, heightCm: 155, ageYears: 60, sex: 'female', activity: 'sedentary',
      goal: 'fat_loss', weeklyRateKg: 1,
    })!;
    expect(small.calories).toBe(1200);
    expect(small.floorApplied).toBe(true);
  });
});

describe('macros are led by protein per kg', () => {
  it('fat loss: 2.0 g/kg protein, 25% fat, carbs take the rest — and it adds up', () => {
    const p = energyPlan({ ...base, goal: 'fat_loss', weeklyRateKg: 0.5 })!;
    expect(p.proteinG).toBe(160);
    expect(p.fatG).toBe(Math.round((p.calories * 0.25) / 9));
    const kcal = p.proteinG * 4 + p.carbsG * 4 + p.fatG * 9;
    expect(Math.abs(kcal - p.calories)).toBeLessThanOrEqual(8);   // rounding only
  });

  it('muscle gain: 1.8 g/kg', () => {
    expect(energyPlan({ ...base, goal: 'muscle_gain' })!.proteinG).toBe(144);
  });

  it('carbs are never negative, even on a very low target', () => {
    const p = energyPlan({
      weightKg: 120, heightCm: 160, ageYears: 60, sex: 'female', activity: 'sedentary',
      goal: 'fat_loss', weeklyRateKg: 1,
    })!;
    expect(p.carbsG).toBeGreaterThanOrEqual(0);
  });
});

describe('it shows its working (A-08: transparency is required)', () => {
  it('names the formula, the multiplier and the adjustment', () => {
    const p = energyPlan({ ...base, goal: 'fat_loss', weeklyRateKg: 0.5 })!;
    const text = p.steps.join('\n');
    expect(text).toMatch(/Mifflin/);
    expect(text).toMatch(/1\.55/);
    expect(text).toMatch(/550/);
  });
});
