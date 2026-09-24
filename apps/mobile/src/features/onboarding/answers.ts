/**
 * Onboarding's answers, and what they become (A-07/A-08, extended in G10).
 *
 * Onboarding used to ask for units and an activity level, then show a target
 * computed from a hard-coded BMR of 1,680. It now asks what a target and a
 * program depend on. This module is the pure arithmetic between the answers
 * and the records written — units, age, the goal, the baseline check-in and
 * the energy plan — so every rule is tested without a screen.
 *
 * Answers are kept as the user typed them (strings), because a half-typed
 * "84," is a real state of the form. They are parsed only on the way out.
 */
import type { Goal as SavedGoal, Profile } from '@volt/api-types';
import {
  energyPlan, kgToLb, lbToKg, type ActivityLevel, type EnergyPlan, type PlanGoal,
} from '@volt/domain';

export type Units = 'metric' | 'imperial';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'full_gym' | 'home_gym' | 'dumbbells' | 'bodyweight';
export type Goal = 'fat_loss' | 'muscle_gain' | 'strength' | 'maintenance';

/** Baseline measurements. Keys are the server's metric keys (canonical units). */
export const MEASUREMENTS = [
  { key: 'waist_cm', label: 'Waist' },
  { key: 'chest_cm', label: 'Chest' },
  { key: 'hips_cm', label: 'Hips' },
  { key: 'arm_cm', label: 'Upper arm' },
  { key: 'thigh_cm', label: 'Thigh' },
  { key: 'body_fat_pct', label: 'Body fat' },
] as const;
export type MeasurementKey = (typeof MEASUREMENTS)[number]['key'];

export interface Answers {
  units: Units;
  timezone: string;
  name: string;
  sex: 'male' | 'female' | null;
  /** YYYY-MM-DD, or '' when skipped. */
  birthDate: string;
  /** cm (metric). */
  height: string;
  /** ft + in (imperial). */
  heightFt: string;
  heightIn: string;
  /** kg or lb, per `units`. */
  weight: string;
  activity: ActivityLevel;
  goal: Goal | null;
  /** kg or lb, per `units`. */
  targetWeight: string;
  /** Weekly pace in kg, positive. */
  pace: number | null;
  experience: Experience | null;
  daysPerWeek: number | null;
  sessionMinutes: number | null;
  equipment: Equipment | null;
  /** cm or in (per `units`), or % for body fat. */
  measurements: Partial<Record<MeasurementKey, string>>;
  checkinDays: number;
}

export const EMPTY_ANSWERS: Answers = {
  units: 'metric', timezone: 'UTC', name: '', sex: null, birthDate: '',
  height: '', heightFt: '', heightIn: '', weight: '', activity: 'moderate',
  goal: null, targetWeight: '', pace: null,
  experience: null, daysPerWeek: null, sessionMinutes: null, equipment: null,
  measurements: {}, checkinDays: 7,
};

const CM_PER_IN = 2.54;

/**
 * The form as the server last saw it. Each step is PATCHed as it is completed
 * (A-07), so someone who leaves half way comes back to their answers, not to
 * empty fields. `deviceTimezone` wins over the server's 'UTC' default, which
 * is a placeholder rather than an answer.
 */
export function answersFrom(p: Profile | null, deviceTimezone: string): Answers {
  if (!p) return { ...EMPTY_ANSWERS, timezone: deviceTimezone };
  const units: Units = p.preferred_unit_system === 'imperial' ? 'imperial' : 'metric';
  const totalIn = p.height_cm != null ? Math.round(p.height_cm / CM_PER_IN) : null;
  const pick = <T>(v: T | null | undefined, fallback: T): T => (v ?? fallback);
  return {
    ...EMPTY_ANSWERS,
    units,
    timezone: p.timezone && p.timezone !== 'UTC' ? p.timezone : deviceTimezone,
    name: p.display_name ?? '',
    sex: p.sex === 'male' || p.sex === 'female' ? p.sex : null,
    birthDate: p.birth_date ?? '',
    height: units === 'metric' && p.height_cm != null ? String(p.height_cm) : '',
    heightFt: units === 'imperial' && totalIn != null ? String(Math.floor(totalIn / 12)) : '',
    heightIn: units === 'imperial' && totalIn != null ? String(totalIn % 12) : '',
    activity: pick(p.activity_level as ActivityLevel | null, EMPTY_ANSWERS.activity),
    experience: pick(p.training_experience as Experience | null, null),
    daysPerWeek: pick(p.training_days_per_week, null),
    sessionMinutes: pick(p.session_minutes, null),
    equipment: pick(p.equipment as Equipment | null, null),
    checkinDays: pick(p.checkin_interval_days, EMPTY_ANSWERS.checkinDays),
  };
}

/** A typed number, or null. A comma is a decimal point; blank is "not given". */
export function num(text: string | undefined): number | null {
  if (text == null || text.trim() === '') return null;
  const n = Number(text.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function heightCm(a: Answers): number | null {
  if (a.units === 'metric') return num(a.height);
  const ft = num(a.heightFt);
  if (ft == null) return null;
  return round1((ft * 12 + (num(a.heightIn) ?? 0)) * CM_PER_IN);
}

const massKg = (a: Answers, text: string): number | null => {
  const v = num(text);
  if (v == null) return null;
  return a.units === 'metric' ? v : round1(lbToKg(v));
};

export const weightKg = (a: Answers) => massKg(a, a.weight);

/**
 * The same answers in the other units: what was typed is converted, not lost.
 * Height in cm becomes feet + inches (whole inches), masses and tape
 * measurements convert to one decimal.
 */
export function withUnits(a: Answers, units: Units): Answers {
  if (a.units === units) return a;
  const cm = heightCm(a);
  const totalIn = cm != null ? Math.round(cm / CM_PER_IN) : null;
  const mass = (text: string) => {
    const v = num(text);
    if (v == null) return text;
    return String(round1(units === 'imperial' ? kgToLb(v) : lbToKg(v)));
  };
  const tape = (text: string | undefined) => {
    const v = num(text);
    if (v == null) return text;
    return String(round1(units === 'imperial' ? v / CM_PER_IN : v * CM_PER_IN));
  };
  const measurements = Object.fromEntries(
    Object.entries(a.measurements).map(([k, v]) => [k, k.endsWith('_pct') ? v : tape(v)]),
  ) as Answers['measurements'];
  return {
    ...a,
    units,
    height: units === 'metric' && cm != null ? String(cm) : a.height,
    heightFt: units === 'imperial' && totalIn != null ? String(Math.floor(totalIn / 12)) : a.heightFt,
    heightIn: units === 'imperial' && totalIn != null ? String(totalIn % 12) : a.heightIn,
    weight: mass(a.weight),
    targetWeight: mass(a.targetWeight),
    measurements,
  };
}
export const targetKg = (a: Answers) => massKg(a, a.targetWeight);

/** Whole years on `today`, or null if the birth date is not a real date. */
export function ageOn(birthDate: string, today: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const check = new Date(Date.UTC(y, mo - 1, d));
  if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  const [ty, tm, td] = today.split('-').map(Number) as [number, number, number];
  return ty - y - (tm < mo || (tm === mo && td < d) ? 1 : 0);
}

/** "That looks unusual — is it right?" (A-07). Warnings only; never a block. */
export function plausibility(a: Answers, today: string): string[] {
  const out: string[] = [];
  const h = heightCm(a);
  if (h != null && (h < 120 || h > 230)) out.push('That height looks unusual — is it right?');
  const w = weightKg(a);
  if (w != null && (w < 30 || w > 250)) out.push('That weight looks unusual — is it right?');
  const t = targetKg(a);
  if (w != null && t != null) {
    if (a.goal === 'fat_loss' && t >= w) out.push('Your target is not below your current weight.');
    if (a.goal === 'muscle_gain' && t <= w) out.push('Your target is not above your current weight.');
  }
  const age = a.birthDate ? ageOn(a.birthDate, today) : null;
  if (a.birthDate && age == null) out.push("That birth date isn't a real date.");
  return out;
}

/** The PATCH /profile body. Skipped answers are left out, never nulled. */
export function profilePatch(a: Answers): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    preferred_unit_system: a.units, timezone: a.timezone,
    activity_level: a.activity, checkin_interval_days: a.checkinDays,
  };
  const put = (k: string, v: unknown) => { if (v !== null && v !== undefined && v !== '') patch[k] = v; };
  put('display_name', a.name.trim());
  put('sex', a.sex);
  put('birth_date', a.birthDate && ageOn(a.birthDate, '9999-12-31') != null ? a.birthDate : null);
  put('height_cm', heightCm(a));
  put('training_experience', a.experience);
  put('training_days_per_week', a.daysPerWeek);
  put('session_minutes', a.sessionMinutes);
  put('equipment', a.equipment);
  return patch;
}

/** The goal row, measured against the current weight — or null without one. */
export function goalFrom(a: Answers, today: string) {
  const start = weightKg(a);
  if (a.goal == null || start == null) return null;
  const weightGoal = a.goal === 'fat_loss' || a.goal === 'muscle_gain';
  const target = weightGoal ? (targetKg(a) ?? null) : start;
  if (target == null) return null;
  return {
    goal_type: a.goal,
    metric_key: 'body_weight',
    direction: a.goal === 'fat_loss' ? 'down' : a.goal === 'muscle_gain' ? 'up' : 'hold',
    start_value: start,
    target_value: target,
    target_unit: 'kg',
    start_date: today,
    weekly_rate: weightGoal ? a.pace : null,
  } as const;
}

/** Check-in #1: the weight plus every measurement given, in canonical units. */
export function baselineMetrics(a: Answers): { metric_key: string; value: number; unit: string }[] {
  const out: { metric_key: string; value: number; unit: string }[] = [];
  const w = weightKg(a);
  if (w != null) out.push({ metric_key: 'body_weight', value: w, unit: 'kg' });
  for (const { key } of MEASUREMENTS) {
    const v = num(a.measurements[key]);
    if (v == null) continue;
    if (key === 'body_fat_pct') out.push({ metric_key: key, value: v, unit: '%' });
    else out.push({ metric_key: key, value: a.units === 'metric' ? v : round1(v * CM_PER_IN), unit: 'cm' });
  }
  return out;
}

/** The energy plan from the real answers (A-08). */
export function planFrom(a: Answers, today: string): EnergyPlan | null {
  return energyPlan({
    weightKg: weightKg(a),
    heightCm: heightCm(a),
    ageYears: a.birthDate ? ageOn(a.birthDate, today) : null,
    sex: a.sex,
    activity: a.activity,
    goal: (a.goal ?? 'maintenance') as PlanGoal,
    weeklyRateKg: a.goal === 'fat_loss' || a.goal === 'muscle_gain' ? a.pace : null,
  });
}

export type GoalWrite =
  | { kind: 'create' }
  | { kind: 'patch'; id: string; body: { target_value: number; weekly_rate: number | null } }
  | { kind: 'replace'; pauseId: string };

/**
 * How to save the goal step (G10). It is saved when the step is passed rather
 * than at the end, so leaving onboarding keeps it — which means the step can
 * be passed more than once and the write must not add a second active goal.
 * A changed goal type cannot be patched (direction and type are fixed), so the
 * old goal is paused and a new one created.
 */
export function goalWrite(existing: readonly SavedGoal[], goal: NonNullable<ReturnType<typeof goalFrom>>): GoalWrite {
  const earlier = existing.find((g) => g.status === 'active' && g.metric_key === goal.metric_key);
  if (!earlier) return { kind: 'create' };
  if (earlier.goal_type !== goal.goal_type) return { kind: 'replace', pauseId: earlier.id };
  return { kind: 'patch', id: earlier.id, body: { target_value: goal.target_value, weekly_rate: goal.weekly_rate } };
}

/** A saved goal back into the form, in the units the user reads. */
export function goalAnswers(g: SavedGoal, units: Units): Pick<Answers, 'goal' | 'targetWeight' | 'pace' | 'weight'> {
  const shown = (kg: number | null | undefined) =>
    (kg == null ? '' : String(units === 'metric' ? kg : round1(kgToLb(kg))));
  const weightGoal = g.goal_type === 'fat_loss' || g.goal_type === 'muscle_gain';
  return {
    goal: g.goal_type === 'custom' ? null : (g.goal_type as Goal),
    targetWeight: weightGoal ? shown(g.target_value) : '',
    pace: weightGoal ? (g.weekly_rate ?? null) : null,
    weight: shown(g.start_value),
  };
}
