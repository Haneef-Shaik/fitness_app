/**
 * The onboarding energy plan (A-08) — calories and macros from what the user
 * actually told us, with the working shown.
 *
 * Replaces the hard-coded BMR of 1,680 onboarding used until G10. The rules:
 *
 *  - Maintenance is Mifflin–St Jeor × activity, or a rough weight-based
 *    estimate when age or sex is missing — and the plan says which.
 *  - The adjustment is sized from the pace the user chose: 7,700 kcal per kg,
 *    spread over a week. Never more than a quarter of maintenance as a deficit
 *    or 500 kcal as a surplus.
 *  - Never below a floor (1,200 kcal; 1,500 for men). A-08 requires saying so.
 *  - Protein first, per kg of bodyweight for the goal; fat 25% of calories;
 *    carbs take the rest and are never negative.
 */
import {
  ACTIVITY_MULTIPLIER, bmrMifflinStJeor, fallbackMaintenance, type ActivityLevel,
} from './targets';

export type PlanGoal = 'fat_loss' | 'muscle_gain' | 'strength' | 'maintenance' | 'custom';

/** Energy in a kilogram of body mass change — the standard working figure. */
export const KCAL_PER_KG = 7700;

const DEFAULT_RATE_KG: Readonly<Record<PlanGoal, number>> = {
  fat_loss: 0.5, muscle_gain: 0.25, strength: 0, maintenance: 0, custom: 0,
};
const PROTEIN_G_PER_KG: Readonly<Record<PlanGoal, number>> = {
  fat_loss: 2.0, muscle_gain: 1.8, strength: 1.8, maintenance: 1.6, custom: 1.6,
};
const MAX_DEFICIT_FRACTION = 0.25;
const MAX_SURPLUS = 500;
const FAT_FRACTION = 0.25;

export interface PlanInputs {
  weightKg: number | null;
  heightCm: number | null;
  ageYears: number | null;
  sex: string | null;
  activity: ActivityLevel;
  goal: PlanGoal;
  /** Chosen pace in kg per week, positive. Absent → a moderate default. */
  weeklyRateKg?: number | null;
}

export interface EnergyPlan {
  method: 'mifflin' | 'fallback';
  /** Null on the fallback path: there is no BMR, only an estimate. */
  bmr: number | null;
  maintenance: number;
  /** Signed kcal/day: negative is a deficit. After the cap. */
  adjustment: number;
  capped: boolean;
  floorApplied: boolean;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** The working, one line per step, for "How we got there". */
  steps: string[];
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-GB');

export function energyPlan(input: PlanInputs): EnergyPlan | null {
  const { weightKg, activity, goal } = input;
  if (weightKg == null || weightKg <= 0) return null;

  const bmr = bmrMifflinStJeor(input);
  const multiplier = ACTIVITY_MULTIPLIER[activity];
  const maintenance = bmr != null
    ? Math.round(bmr * multiplier)
    : fallbackMaintenance(weightKg, activity)!;

  const steps: string[] = bmr != null
    ? [`BMR ${fmt(bmr)} kcal (Mifflin–St Jeor) × ${multiplier} for activity = ${fmt(maintenance)} to maintain`]
    : [`About ${fmt(maintenance)} kcal to maintain — a rough estimate from weight and activity. Add your age and sex for Mifflin–St Jeor.`];

  const rate = input.weeklyRateKg ?? DEFAULT_RATE_KG[goal];
  const raw = Math.round((rate * KCAL_PER_KG) / 7);
  let adjustment = 0;
  let capped = false;
  if (goal === 'fat_loss' && raw > 0) {
    const cap = Math.round(maintenance * MAX_DEFICIT_FRACTION);
    capped = raw > cap;
    adjustment = -Math.min(raw, cap);
    steps.push(`−${fmt(-adjustment)} kcal a day to lose ${rate} kg a week${capped ? ' (limited to a quarter of maintenance)' : ''}`);
  } else if (goal === 'muscle_gain' && raw > 0) {
    capped = raw > MAX_SURPLUS;
    adjustment = Math.min(raw, MAX_SURPLUS);
    steps.push(`+${fmt(adjustment)} kcal a day to gain ${rate} kg a week${capped ? ' (limited to 500)' : ''}`);
  }

  const floor = input.sex === 'male' ? 1500 : 1200;
  const planned = maintenance + adjustment;
  const floorApplied = planned < floor;
  const calories = floorApplied ? floor : planned;
  if (floorApplied) steps.push(`Raised to a minimum of ${fmt(floor)} kcal. Talk to a professional before going lower.`);

  const proteinG = Math.round(weightKg * PROTEIN_G_PER_KG[goal]);
  const fatG = Math.round((calories * FAT_FRACTION) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  steps.push(`Protein ${PROTEIN_G_PER_KG[goal]} g per kg (${proteinG} g), fat 25% (${fatG} g), carbs the rest (${carbsG} g)`);

  return {
    method: bmr != null ? 'mifflin' : 'fallback', bmr: bmr != null ? Math.round(bmr) : null,
    maintenance, adjustment, capped, floorApplied, calories, proteinG, carbsG, fatG, steps,
  };
}
