/**
 * The onboarding steps that describe the user: units, about you, activity,
 * goal, training and the baseline measurements (A-07, extended in G10).
 *
 * Each is a plain form over `Answers`; nothing here writes to the server.
 */
import React from 'react';
import { View } from 'react-native';
import { goalJourney } from '@volt/domain';
import { Text } from '@/ui';
import { shortDate } from '@/features/dashboard/date';
import { space } from '@/theme';
import {
  MEASUREMENTS, targetKg, weightKg, withUnits, type Answers, type Equipment, type Experience, type Goal,
} from './answers';
import { Chips, Labelled, NumberField, Options, TextField } from './ui';

export interface StepProps { a: Answers; set: (patch: Partial<Answers>) => void; today: string }

const mass = (a: Answers) => (a.units === 'metric' ? 'kg' : 'lb');
const length = (a: Answers) => (a.units === 'metric' ? 'cm' : 'in');

export function UnitsStep({ a, set }: StepProps) {
  return (
    <>
      <Options
        testID="units"
        value={a.units}
        onChange={(units) => set(withUnits(a, units))}
        options={[
          { value: 'metric', title: 'Metric', detail: 'kg · cm' },
          { value: 'imperial', title: 'Imperial', detail: 'lb · ft and in' },
        ]}
      />
      <View style={{ gap: 4 }}>
        <Text variant="caption" tone="ink3">Time zone</Text>
        <Text variant="body">{a.timezone}</Text>
        <Text variant="caption" tone="ink3">
          Detected from this phone. It decides when your day starts and ends for calories and workouts.
        </Text>
      </View>
    </>
  );
}

/** `showWeight` is off in Profile: weight is a check-in there, with its own history, not a setting. */
export function AboutYouStep({ a, set, showWeight = true }: StepProps & { showWeight?: boolean }) {
  const [y = '', m = '', d = ''] = a.birthDate ? a.birthDate.split('-') : [];
  const setDate = (part: 'y' | 'm' | 'd', v: string) => {
    const next = { y, m, d, [part]: v.replace(/\D/g, '') };
    const done = next.y.length === 4 && next.m.length > 0 && next.d.length > 0;
    set({ birthDate: done ? `${next.y}-${next.m.padStart(2, '0')}-${next.d.padStart(2, '0')}` : [next.y, next.m, next.d].join('-').replace(/^-+$/, '') });
  };
  return (
    <>
      <TextField label="What should we call you?" value={a.name} onChange={(name) => set({ name })} testID="about-name" />
      <Labelled label="Sex (for the calorie formula)">
        <Chips
          testID="about-sex"
          value={a.sex ?? 'none'}
          onChange={(v) => set({ sex: v === 'none' ? null : v })}
          options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'none', label: 'Prefer not to say' }]}
        />
      </Labelled>
      <Labelled label="Date of birth">
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <NumberField label="Day" value={d} onChange={(v) => setDate('d', v)} placeholder="DD" flex={1} testID="about-dob-d" />
          <NumberField label="Month" value={m} onChange={(v) => setDate('m', v)} placeholder="MM" flex={1} testID="about-dob-m" />
          <NumberField label="Year" value={y} onChange={(v) => setDate('y', v)} placeholder="YYYY" flex={1.4} testID="about-dob-y" />
        </View>
      </Labelled>
      {a.units === 'metric' ? (
        <NumberField label="Height" unit="cm" value={a.height} onChange={(height) => set({ height })} testID="about-height" />
      ) : (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <NumberField label="Height" unit="ft" value={a.heightFt} onChange={(heightFt) => set({ heightFt })} flex={1} testID="about-height-ft" />
          <NumberField label=" " unit="in" value={a.heightIn} onChange={(heightIn) => set({ heightIn })} flex={1} testID="about-height-in" />
        </View>
      )}
      {showWeight ? (
        <NumberField label="Current weight" unit={mass(a)} value={a.weight} onChange={(weight) => set({ weight })} testID="about-weight" />
      ) : null}
      <Text variant="caption" tone="ink3">
        Birth date, sex and height let us use the Mifflin–St Jeor formula. Skip them and we'll use a rougher
        estimate — and say so.
      </Text>
    </>
  );
}

export function ActivityStep({ a, set }: StepProps) {
  return (
    <Options
      testID="activity"
      value={a.activity}
      onChange={(activity) => set({ activity })}
      options={[
        { value: 'sedentary', title: 'Mostly sitting', detail: 'Desk job, little exercise' },
        { value: 'light', title: 'Lightly active', detail: 'Exercise 1–3 days a week' },
        { value: 'moderate', title: 'Moderately active', detail: 'Exercise 3–5 days a week' },
        { value: 'very', title: 'Very active', detail: 'Hard exercise 6–7 days a week' },
        { value: 'extra', title: 'Extremely active', detail: 'Physical job plus hard training' },
      ]}
    />
  );
}

const LOSS_PACES = [0.25, 0.5, 0.75, 1] as const;
const GAIN_PACES = [0.1, 0.25, 0.5] as const;
const PACE_NAMES: Record<number, string> = { 0.1: 'Slow', 0.25: 'Gentle', 0.5: 'Steady', 0.75: 'Fast', 1: 'Aggressive' };

export function GoalStep({ a, set, today }: StepProps) {
  const weightGoal = a.goal === 'fat_loss' || a.goal === 'muscle_gain';
  const paces = a.goal === 'muscle_gain' ? GAIN_PACES : LOSS_PACES;
  const perWeek = (kg: number) => (a.units === 'metric' ? `${kg} kg` : `${(kg * 2.2046).toFixed(1)} lb`);

  const start = weightKg(a);
  const target = targetKg(a);
  const journey = weightGoal && start != null && target != null && a.pace && target !== start
    ? goalJourney({
        start, target, direction: a.goal === 'fat_loss' ? 'down' : 'up', startDate: today,
        weeklyRate: a.pace, current: null, today,
      })
    : null;

  return (
    <>
      <Options<Goal>
        testID="goal"
        value={a.goal}
        onChange={(goal) => set({ goal, pace: goal === 'fat_loss' ? 0.5 : goal === 'muscle_gain' ? 0.25 : null })}
        options={[
          { value: 'fat_loss', title: 'Lose fat', detail: 'Lose weight while keeping muscle' },
          { value: 'muscle_gain', title: 'Build muscle', detail: 'Gain size, and some weight with it' },
          { value: 'strength', title: 'Get stronger', detail: 'Lift more; weight can stay where it is' },
          { value: 'maintenance', title: 'Stay fit and healthy', detail: 'Keep your weight, build the habit' },
        ]}
      />
      {weightGoal ? (
        <>
          <NumberField label="Target weight" unit={mass(a)} value={a.targetWeight}
            onChange={(targetWeight) => set({ targetWeight })} testID="goal-target" />
          <Labelled label="How fast?">
            <Chips
              testID="goal-pace"
              value={a.pace}
              onChange={(pace) => set({ pace })}
              options={paces.map((p) => ({ value: p, label: `${PACE_NAMES[p]} · ${perWeek(p)}/wk` }))}
            />
          </Labelled>
          {journey?.projectedDate ? (
            <Text variant="body" tone="ink2" testID="goal-projection">
              At {perWeek(a.pace!)} a week you'd reach {a.targetWeight} {mass(a)} around{' '}
              {shortDate(journey.projectedDate, today)}.
            </Text>
          ) : null}
        </>
      ) : null}
    </>
  );
}

export function TrainingStep({ a, set }: StepProps) {
  return (
    <>
      <Labelled label="Lifting experience">
        <Options<Experience>
          testID="experience"
          value={a.experience}
          onChange={(experience) => set({ experience })}
          options={[
            { value: 'beginner', title: 'Beginner', detail: 'Less than a year of regular lifting' },
            { value: 'intermediate', title: 'Intermediate', detail: '1–3 years; progress has slowed from week to week' },
            { value: 'advanced', title: 'Advanced', detail: '3+ years; you plan your own training' },
          ]}
        />
      </Labelled>
      <Labelled label="Days a week you can train">
        <Chips fill testID="days" value={a.daysPerWeek} onChange={(daysPerWeek) => set({ daysPerWeek })}
          options={[2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n), a11y: `${n} days a week` }))} />
      </Labelled>
      <Labelled label="Minutes per session">
        <Chips fill testID="minutes" value={a.sessionMinutes} onChange={(sessionMinutes) => set({ sessionMinutes })}
          options={[30, 45, 60, 75, 90].map((n) => ({ value: n, label: String(n), a11y: `${n} minutes` }))} />
      </Labelled>
      <Labelled label="Where you train">
        <Options<Equipment>
          testID="equipment"
          value={a.equipment}
          onChange={(equipment) => set({ equipment })}
          options={[
            { value: 'full_gym', title: 'A full gym', detail: 'Barbells, racks, cables and machines' },
            { value: 'home_gym', title: 'A home gym', detail: 'Rack, barbell and dumbbells' },
            { value: 'dumbbells', title: 'Dumbbells only', detail: 'A pair of adjustable dumbbells and a bench' },
            { value: 'bodyweight', title: 'No equipment', detail: 'A pull-up bar at most' },
          ]}
        />
      </Labelled>
    </>
  );
}

export function MeasurementsStep({ a, set }: StepProps) {
  return (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.sm, rowGap: space.base }}>
        {MEASUREMENTS.map(({ key, label }) => (
          <View key={key} style={{ flexBasis: '40%', flexGrow: 1 }}>
            <NumberField
              label={label}
              unit={key === 'body_fat_pct' ? '%' : length(a)}
              value={a.measurements[key] ?? ''}
              onChange={(v) => set({ measurements: { ...a.measurements, [key]: v } })}
              testID={`measure-${key}`}
            />
          </View>
        ))}
      </View>
      <Text variant="caption" tone="ink3">
        All optional. Measure first thing in the morning, relaxed, tape level. These plus your weight are your
        first check-in — every later one is compared with it.
      </Text>
      <Labelled label="Remind me to check in">
        <Chips testID="checkin" value={a.checkinDays} onChange={(checkinDays) => set({ checkinDays })}
          options={[{ value: 7, label: 'Weekly' }, { value: 14, label: 'Every 2 weeks' }, { value: 30, label: 'Monthly' }]} />
      </Labelled>
    </>
  );
}
