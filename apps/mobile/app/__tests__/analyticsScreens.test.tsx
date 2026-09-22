/**
 * The G-screens, and the design-system rules they have to obey **in both
 * themes** (05 §3).
 *
 * Both themes matters because the palette has two sets of hexes and only one is
 * exercised by a default render — a chart that reads on dark and vanishes on
 * light passes every single-theme test.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useColorScheme } from 'react-native';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ exerciseId: 'e1' }),
}));

const q = (data: unknown) => ({
  data, isPending: false, isError: false, error: null, refetch: jest.fn(),
});

const mocks = {
  workouts: q({ group_by: 'week', buckets: [], total_volume_kg: 0 }),
  muscle: q([] as unknown[]),
  records: q([] as unknown[]),
  frequency: q({ weeks: [], cells: [] }),
  adherence: q({ planned: 0, completed_planned: 0, adherence: null, weeks: [] }),
  progression: q({ exercise_id: 'e1', exercise_name: 'Bench', formula_version: 'epley_v1', points: [] }),
};

jest.mock('@/lib/query/hooks', () => ({
  useWorkoutAnalytics: () => mocks.workouts,
  useMuscleVolume: () => mocks.muscle,
  usePersonalRecords: () => mocks.records,
  useFrequency: () => mocks.frequency,
  useAdherence: () => mocks.adherence,
  useExerciseProgression: () => mocks.progression,
}));

import MuscleBalance from '../train/analytics/muscles';
import AdherenceScreen from '../train/analytics/adherence';
import Records from '../train/analytics/records';
import FrequencyScreen from '../train/analytics/frequency';
import Progression from '../train/analytics/[exerciseId]';

const asScheme = (scheme: 'dark' | 'light') =>
  (useColorScheme as unknown as jest.Mock).mockReturnValue(scheme);

beforeEach(() => {
  jest.clearAllMocks();
  asScheme('dark');
  mocks.muscle = q([]);
  mocks.records = q([]);
  mocks.frequency = q({ weeks: [], cells: [] });
  mocks.adherence = q({ planned: 0, completed_planned: 0, adherence: null, weeks: [] });
  mocks.progression = q({
    exercise_id: 'e1', exercise_name: 'Bench', formula_version: 'epley_v1', points: [],
  });
});

describe('empty states are the DataBoundary empty state, not a blank plot', () => {
  it('G-02 says there is no volume yet', () => {
    render(<MuscleBalance />);
    expect(screen.getByText('No volume yet')).toBeTruthy();
    expect(screen.queryByTestId('muscle-volume')).toBeNull();
  });

  it('G-04 says there are no records yet', () => {
    render(<Records />);
    expect(screen.getByText('No records yet')).toBeTruthy();
  });

  it('G-05 says there is nothing to show yet', () => {
    render(<FrequencyScreen />);
    expect(screen.getByText('Nothing to show yet')).toBeTruthy();
  });

  it('G-03 says the exercise was never performed', () => {
    render(<Progression />);
    expect(screen.getByText('Not performed yet')).toBeTruthy();
  });
});

describe('G-06 · adherence without a plan', () => {
  it('says "no plan" rather than drawing 0%', () => {
    render(<AdherenceScreen />);
    expect(screen.getByText(/Schedule a day in a program/)).toBeTruthy();
    expect(screen.queryByTestId('meter-fill')).toBeNull();
  });

  it('draws the meter once something is planned', () => {
    mocks.adherence = q({
      planned: 4, completed_planned: 3, adherence: 0.75,
      weeks: [{ week_start: '2026-09-21', planned: 2, completed_planned: 2 }],
    });
    render(<AdherenceScreen />);
    expect(screen.getByTestId('meter-fill')).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('3 of 4 planned sessions')).toBeTruthy();
  });
});

describe('both themes (05 §3)', () => {
  const withVolume = () => q([
    { slug: 'chest', name: 'Chest', volume_kg: 900, set_count: 9 },
    { slug: 'back', name: 'Back', volume_kg: 400, set_count: 4 },
  ]);

  for (const scheme of ['dark', 'light'] as const) {
    it(`G-02 renders its bars on ${scheme}`, () => {
      asScheme(scheme);
      mocks.muscle = withVolume();

      render(<MuscleBalance />);

      expect(screen.getByTestId('muscle-volume')).toBeTruthy();
      const fill = screen.getByTestId('bar-chest').props.style;
      // A fill that resolved to nothing is how a chart vanishes on one surface.
      expect(fill.backgroundColor).toBeTruthy();
      expect(fill.backgroundColor).not.toBe('transparent');
    });

    it(`G-02 states the weighting on ${scheme}`, () => {
      asScheme(scheme);
      mocks.muscle = withVolume();
      render(<MuscleBalance />);
      expect(screen.getByText(/primary ×1.0 and secondary ×0.5/)).toBeTruthy();
    });
  }
});

describe('G-04 shows which formula produced the numbers (I5)', () => {
  it('names the version rather than leaving it implied', () => {
    mocks.records = q([{
      exercise_id: 'e1', exercise_name: 'Bench', max_load_kg: 120, max_reps: 3,
      estimated_1rm_kg: 132, volume_kg: 360, formula_version: 'epley_v1',
      achieved_on: '2026-09-20',
    }]);

    render(<Records />);

    expect(screen.getByText(/epley_v1/)).toBeTruthy();
    expect(screen.getByText('120')).toBeTruthy();
  });
});
