/**
 * Calorie and macro targets (H-15).
 *
 * A word on the key names: `MacroSplit` and `MacroGrams` share the keys
 * `proteinG` / `carbsG` / `fatG`. The key names the **macro**; the type says
 * what the value is — a percentage in a split, grams in a gram figure. Keeping
 * them identical is what lets {@link macroGrams} and {@link splitFromGrams} be
 * exact inverses, and it matches the `protein_g` shape the API already speaks.
 */

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';

export type MacroKey = 'proteinG' | 'carbsG' | 'fatG';
export type MacroSplit = Record<MacroKey, number>;
export type MacroGrams = Record<MacroKey, number>;

const MACRO_KEYS: readonly MacroKey[] = ['proteinG', 'carbsG', 'fatG'];

/** Atwater factors. Alcohol is deliberately absent — FitLog does not log it. */
export const MACRO_KCAL_PER_G: Readonly<Record<MacroKey, number>> = {
  proteinG: 4, carbsG: 4, fatG: 9,
};

export const ACTIVITY_MULTIPLIER: Readonly<Record<ActivityLevel, number>> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, extra: 1.9,
};

export const PRESET_SPLITS: Readonly<Record<string, MacroSplit>> = {
  balanced: { proteinG: 30, carbsG: 40, fatG: 30 },
  highProtein: { proteinG: 40, carbsG: 35, fatG: 25 },
  lowCarb: { proteinG: 35, carbsG: 20, fatG: 45 },
};

export interface BmrInputs {
  weightKg: number | null;
  heightCm: number | null;
  ageYears: number | null;
  sex: string | null;
}

/**
 * Mifflin–St Jeor. Returns `null` when anything it needs is missing, so the
 * screen can name the gap instead of showing a confident, invented number.
 */
export function bmrMifflinStJeor({ weightKg, heightCm, ageYears, sex }: BmrInputs): number | null {
  if (weightKg == null || heightCm == null || ageYears == null) return null;
  // An unrecognised or unstated sex is missing data, not a licence to assume male.
  if (sex !== 'male' && sex !== 'female') return null;

  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}

/**
 * A rough resting figure per kg of bodyweight, used only when Mifflin–St Jeor
 * cannot run. It is a stand-in for a formula, not a second formula, and the
 * screen labels it as such.
 */
export const FALLBACK_KCAL_PER_KG = 22;

/** Weight × activity, for the account that has not filled in a birth date or sex. */
export function fallbackMaintenance(
  weightKg: number | null, activity: ActivityLevel,
): number | null {
  if (weightKg == null || weightKg <= 0) return null;
  return Math.round(weightKg * FALLBACK_KCAL_PER_KG * ACTIVITY_MULTIPLIER[activity]);
}

export const tdee = (bmr: number, activity: ActivityLevel): number =>
  bmr * ACTIVITY_MULTIPLIER[activity];

/** `adjustmentPct` is signed: −10 is a deficit, +15 a surplus, 0 maintenance. */
export const targetCalories = (maintenance: number, adjustmentPct: number): number =>
  Math.round(maintenance * (1 + adjustmentPct / 100));

export const splitTotal = (split: MacroSplit): number =>
  MACRO_KEYS.reduce((t, k) => t + split[k], 0);

export function macroGrams(calories: number, split: MacroSplit): MacroGrams {
  return {
    proteinG: Math.round((calories * split.proteinG) / 100 / MACRO_KCAL_PER_G.proteinG),
    carbsG: Math.round((calories * split.carbsG) / 100 / MACRO_KCAL_PER_G.carbsG),
    fatG: Math.round((calories * split.fatG) / 100 / MACRO_KCAL_PER_G.fatG),
  };
}

/**
 * The inverse, for the editable gram fields.
 *
 * It does **not** normalise to 100. Grams typed by hand can leave the day
 * under- or over-specified, and forcing the total back to 100 would hide
 * exactly the mistake the "total 100% ✓" indicator exists to show.
 */
export function splitFromGrams(calories: number, grams: MacroGrams): MacroSplit {
  if (calories <= 0) return { proteinG: 0, carbsG: 0, fatG: 0 };
  const pct = (k: MacroKey) =>
    Math.round((grams[k] * MACRO_KCAL_PER_G[k]) / calories * 100);
  return { proteinG: pct('proteinG'), carbsG: pct('carbsG'), fatG: pct('fatG') };
}

/**
 * Move one macro and let the other two absorb the difference **in proportion**,
 * so the total is always exactly 100.
 *
 * Proportional, not even: someone on 60 carbs / 20 fat who frees up 20 points
 * expects most of them to land on carbs. Handing back 10 and 10 quietly
 * rewrites the shape of their diet.
 */
export function rebalanceSplit(split: MacroSplit, key: MacroKey, nextPct: number): MacroSplit {
  const moved = Math.min(100, Math.max(0, Math.round(nextPct)));
  const remaining = 100 - moved;
  const others = MACRO_KEYS.filter((k) => k !== key);
  const otherTotal = others.reduce((t, k) => t + split[k], 0);

  // Both others at zero carries no proportion to preserve; split the remainder.
  const raw = others.map((k) =>
    otherTotal === 0 ? remaining / others.length : (split[k] / otherTotal) * remaining,
  );

  // Largest remainder: floor everything, then hand the leftover points to the
  // largest fractions. Rounding each independently is what lets 30/40/30 sum to 99.
  const floors = raw.map(Math.floor);
  let leftover = remaining - floors.reduce((t, n) => t + n, 0);
  const order = raw
    .map((value, i) => ({ i, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);
  const shares = [...floors];
  for (const { i } of order) {
    if (leftover <= 0) break;
    shares[i] = (shares[i] ?? 0) + 1;
    leftover -= 1;
  }

  return {
    ...split,
    [key]: moved,
    [others[0] as MacroKey]: shares[0] ?? 0,
    [others[1] as MacroKey]: shares[1] ?? 0,
  } as MacroSplit;
}

export interface Notice {
  level: 'warning' | 'error';
  message: string;
}

export const CALORIE_MIN = 800;
export const CALORIE_MAX = 8000;
const CALORIE_SOFT_FLOOR = 1200;
const PROTEIN_G_PER_KG_CEILING = 4;

export function caloriesNotice(calories: number): Notice | null {
  if (calories < CALORIE_MIN || calories > CALORIE_MAX) {
    return {
      level: 'error',
      message: `A daily target has to sit between ${CALORIE_MIN} and ${CALORIE_MAX} kcal.`,
    };
  }
  if (calories < CALORIE_SOFT_FLOOR) {
    return {
      level: 'warning',
      message: 'Below 1,200 kcal a day is very low. Worth checking with a doctor first.',
    };
  }
  return null;
}

/** Warns, never blocks — and says nothing at all when bodyweight is unknown. */
export function proteinNotice(proteinG: number, weightKg: number | null): Notice | null {
  if (weightKg == null || weightKg <= 0) return null;
  const perKg = proteinG / weightKg;
  if (perKg <= PROTEIN_G_PER_KG_CEILING) return null;
  return {
    level: 'warning',
    message: `That is ${perKg.toFixed(1)} g of protein per kg — well above what most training plans need.`,
  };
}
