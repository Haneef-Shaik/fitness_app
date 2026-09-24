/**
 * What onboarding collects, and what it turns into (A-07/A-08, G10).
 *
 * Onboarding used to ask for units and an activity level and then show a
 * calorie target computed from a HARD-CODED BMR of 1,680. It now collects what
 * a target and a program actually depend on. This module is the arithmetic
 * between the answers and the records — pure, so every rule is tested here.
 */
import type { Profile } from '@volt/api-types';
import {
  ageOn, answersFrom, baselineMetrics, EMPTY_ANSWERS, goalFrom, heightCm, planFrom, plausibility, profilePatch,
  weightKg, type Answers,
} from '../answers';

const full: Answers = {
  ...EMPTY_ANSWERS,
  name: 'Haneef', units: 'metric', timezone: 'Asia/Kolkata', sex: 'male',
  birthDate: '1996-03-12', height: '180', weight: '84', activity: 'moderate',
  goal: 'fat_loss', targetWeight: '76', pace: 0.5,
  experience: 'beginner', daysPerWeek: 3, sessionMinutes: 60, equipment: 'full_gym',
  measurements: { waist_cm: '92', chest_cm: '', body_fat_pct: '22' },
  checkinDays: 7,
};

describe('units', () => {
  it('metric is taken as written', () => {
    expect(heightCm(full)).toBe(180);
    expect(weightKg(full)).toBe(84);
  });

  it('imperial height is feet and inches, stored as cm; weight is pounds, stored as kg', () => {
    const a = { ...full, units: 'imperial' as const, height: '', heightFt: '5', heightIn: '11', weight: '185' };
    expect(heightCm(a)).toBeCloseTo(180.3, 1);
    expect(weightKg(a)).toBeCloseTo(83.9, 1);
  });

  it('a comma is a decimal point, and blank is "not given", never zero', () => {
    expect(weightKg({ ...full, weight: '84,5' })).toBe(84.5);
    expect(weightKg({ ...full, weight: '' })).toBeNull();
  });
});

describe('age', () => {
  it('is whole years on the given day, birthday not yet reached', () => {
    expect(ageOn('1996-03-12', '2026-03-11')).toBe(29);
    expect(ageOn('1996-03-12', '2026-03-12')).toBe(30);
  });
  it('is null for a date that is not a date', () => {
    expect(ageOn('1996-02-31', '2026-01-01')).toBeNull();
    expect(ageOn('', '2026-01-01')).toBeNull();
  });
});

describe('plausibility — a warning, never a block (A-07)', () => {
  it('says nothing about ordinary values', () => {
    expect(plausibility(full, '2026-09-23')).toEqual([]);
  });
  it('questions an unusual height or weight', () => {
    expect(plausibility({ ...full, height: '300' }, '2026-09-23')).toContainEqual(expect.stringMatching(/height/i));
    expect(plausibility({ ...full, weight: '500' }, '2026-09-23')).toContainEqual(expect.stringMatching(/weight/i));
  });
  it('a target on the wrong side of the current weight is flagged', () => {
    expect(plausibility({ ...full, goal: 'fat_loss', targetWeight: '90' }, '2026-09-23'))
      .toContainEqual(expect.stringMatching(/target/i));
  });
});

describe('what gets written', () => {
  it('the profile carries every answer, converted', () => {
    expect(profilePatch(full)).toMatchObject({
      display_name: 'Haneef', sex: 'male', birth_date: '1996-03-12', height_cm: 180,
      preferred_unit_system: 'metric', timezone: 'Asia/Kolkata', activity_level: 'moderate',
      training_experience: 'beginner', training_days_per_week: 3, session_minutes: 60,
      equipment: 'full_gym', checkin_interval_days: 7,
    });
  });

  it('a skipped answer is left out, not written as null over something real', () => {
    const patch = profilePatch({ ...full, sex: null, birthDate: '', experience: null });
    expect(patch).not.toHaveProperty('sex');
    expect(patch).not.toHaveProperty('birth_date');
    expect(patch).not.toHaveProperty('training_experience');
  });

  it('a weight goal starts at the current weight, today, at the chosen pace', () => {
    expect(goalFrom(full, '2026-09-23')).toEqual({
      goal_type: 'fat_loss', metric_key: 'body_weight', direction: 'down',
      start_value: 84, target_value: 76, target_unit: 'kg',
      start_date: '2026-09-23', weekly_rate: 0.5,
    });
  });

  it('muscle gain goes up; strength and maintenance hold the current weight', () => {
    expect(goalFrom({ ...full, goal: 'muscle_gain', targetWeight: '88', pace: 0.25 }, '2026-09-23'))
      .toMatchObject({ direction: 'up', target_value: 88 });
    expect(goalFrom({ ...full, goal: 'maintenance', targetWeight: '' }, '2026-09-23'))
      .toMatchObject({ direction: 'hold', target_value: 84, weekly_rate: null });
  });

  it('no goal without a weight to measure it against', () => {
    expect(goalFrom({ ...full, weight: '' }, '2026-09-23')).toBeNull();
  });

  it('the baseline check-in is the weight plus every measurement given, in canonical units', () => {
    expect(baselineMetrics(full)).toEqual([
      { metric_key: 'body_weight', value: 84, unit: 'kg' },
      { metric_key: 'waist_cm', value: 92, unit: 'cm' },
      { metric_key: 'body_fat_pct', value: 22, unit: '%' },
    ]);
  });

  it('imperial measurements are converted to cm', () => {
    const m = baselineMetrics({ ...full, units: 'imperial', weight: '185', measurements: { waist_cm: '36' } });
    expect(m.find((x) => x.metric_key === 'waist_cm')!.value).toBeCloseTo(91.4, 1);
  });

  it('the plan is built from the real answers, not a constant', () => {
    const p = planFrom(full, '2026-09-23')!;
    expect(p.method).toBe('mifflin');
    expect(p.bmr).toBe(10 * 84 + 6.25 * 180 - 5 * 30 + 5);
    const lighter = planFrom({ ...full, weight: '70' }, '2026-09-23')!;
    expect(lighter.calories).toBeLessThan(p.calories);
  });
});

describe('answersFrom — coming back to onboarding after leaving half way', () => {
  // Each step is saved as it is completed (A-07). Without this, reopening the
  // app mid-onboarding showed empty forms over answers the server already had.
  const saved = {
    display_name: 'Sam', preferred_unit_system: 'metric', timezone: 'Europe/London',
    sex: 'male', birth_date: '1994-06-14', height_cm: 178, activity_level: 'light',
    training_experience: 'beginner', training_days_per_week: 3, session_minutes: 60,
    equipment: 'full_gym', checkin_interval_days: 14,
  } as unknown as Profile;

  it('puts every saved answer back in the form', () => {
    const a = answersFrom(saved, 'Asia/Kolkata');
    expect(a).toMatchObject({
      name: 'Sam', units: 'metric', timezone: 'Europe/London', sex: 'male', birthDate: '1994-06-14',
      height: '178', activity: 'light', experience: 'beginner', daysPerWeek: 3, sessionMinutes: 60,
      equipment: 'full_gym', checkinDays: 14,
    });
  });

  it('shows a saved height in feet and inches to someone who chose imperial', () => {
    const a = answersFrom({ ...saved, preferred_unit_system: 'imperial', height_cm: 180.3 } as Profile, 'UTC');
    expect([a.heightFt, a.heightIn]).toEqual(['5', '11']);
    expect(heightCm(a)).toBeCloseTo(180.3, 0);
  });

  it('starts blank where nothing was answered, with this phone\'s time zone over the server default', () => {
    const a = answersFrom({ timezone: 'UTC' } as unknown as Profile, 'Asia/Kolkata');
    expect(a).toEqual({ ...EMPTY_ANSWERS, timezone: 'Asia/Kolkata' });
    expect(answersFrom(null, 'Asia/Kolkata')).toEqual({ ...EMPTY_ANSWERS, timezone: 'Asia/Kolkata' });
  });
});
