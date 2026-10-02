/**
 * C-05 · the plan-day editor — supersets (E-13), and that saving keeps them.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({ id: 'd1', programId: 'p1' }),
}));

const q = (data: unknown) => ({ data, isPending: false, isError: false, error: null, refetch: jest.fn() });
const EXERCISES = [
  { id: 'e1', name: 'Curl', tracks_load: true, tracks_reps: true, tracks_duration: false, tracks_distance: false, muscles: [] },
  { id: 'e2', name: 'Pushdown', tracks_load: true, tracks_reps: true, tracks_duration: false, tracks_distance: false, muscles: [] },
  { id: 'e3', name: 'Plank', tracks_load: false, tracks_reps: false, tracks_duration: true, tracks_distance: false, muscles: [] },
];
const PROGRAM = {
  id: 'p1', name: 'Arms', status: 'active',
  days: [{ id: 'd1', name: 'Arms', day_index: 0, scheduled_weekday: null, notes: null, exercises: [
    { id: 'pe1', exercise_id: 'e1', order_index: 0, target_sets: 3, load_unit: 'kg', superset_group: 1 },
    { id: 'pe2', exercise_id: 'e2', order_index: 1, target_sets: 3, load_unit: 'kg', superset_group: 1 },
    { id: 'pe3', exercise_id: 'e3', order_index: 2, target_sets: 3, load_unit: 'kg', superset_group: null },
  ] }],
};
const mockSaveExercises = jest.fn(async (_a: unknown) => PROGRAM);
jest.mock('@/lib/query/hooks', () => ({
  useProgram: () => q(PROGRAM),
  useExercises: () => q(EXERCISES),
  useMuscleGroups: () => q([]),
  useSetDayExercises: () => ({ mutateAsync: (a: unknown) => mockSaveExercises(a), isPending: false }),
  useUpdatePlanDay: () => ({ mutateAsync: jest.fn(async () => PROGRAM), isPending: false }),
}));

import PlanDayEditor from '../train/plan-days/[id]';

beforeEach(() => jest.clearAllMocks());

it('shows the superset and keeps it when saving', async () => {
  render(<PlanDayEditor />);
  expect(screen.getByTestId('superset-link-0').props.accessibilityState).toEqual({ checked: true });
  expect(screen.getByTestId('superset-link-1').props.accessibilityState).toEqual({ checked: false });

  fireEvent.press(screen.getByText('Save'));

  await waitFor(() => expect(mockSaveExercises).toHaveBeenCalled());
  const body = (mockSaveExercises.mock.calls[0]![0] as { body: { superset_group: number | null }[] }).body;
  expect(body.map((r) => r.superset_group)).toEqual([1, 1, null]);
});

it('links the next exercise into a circuit', async () => {
  render(<PlanDayEditor />);
  fireEvent.press(screen.getByTestId('superset-link-1'));
  fireEvent.press(screen.getByText('Save'));

  await waitFor(() => expect(mockSaveExercises).toHaveBeenCalled());
  const body = (mockSaveExercises.mock.calls[0]![0] as { body: { superset_group: number | null }[] }).body;
  expect(body.map((r) => r.superset_group)).toEqual([1, 1, 1]);
});

it('names a row from the day itself when the catalog does not have it', () => {
  // Found taking the screenshots: the catalog list stopped at 200 of 297, and
  // Overhead Press and Triceps Pushdown read "Exercise". The catalog now pages;
  // the day's own `exercise_name` covers an archived exercise and the moment
  // before the catalog arrives.
  const named = {
    ...PROGRAM,
    days: [{ ...PROGRAM.days[0]!, exercises: [
      ...PROGRAM.days[0]!.exercises,
      { id: 'pe4', exercise_id: 'e9', exercise_name: 'Overhead Press', order_index: 3, target_sets: 3, load_unit: 'kg', superset_group: null },
    ] }],
  };
  jest.spyOn(require('@/lib/query/hooks'), 'useProgram').mockReturnValue(q(named));
  render(<PlanDayEditor />);
  expect(screen.getByText('Overhead Press')).toBeTruthy();
  expect(screen.queryByText('Exercise')).toBeNull();
});

it('reads scheduled_weekday Monday-first, like the API and the templates', () => {
  // A template's "Mon / Wed / Fri" is 0, 2, 4. The editor read 0 as "Sun".
  const monday = { ...PROGRAM, days: [{ ...PROGRAM.days[0]!, scheduled_weekday: 0 }] };
  jest.spyOn(require('@/lib/query/hooks'), 'useProgram').mockReturnValue(q(monday));
  render(<PlanDayEditor />);
  expect(screen.getByLabelText('Mon').props.accessibilityState).toEqual({ selected: true });
  expect(screen.getByLabelText('Sun').props.accessibilityState).toEqual({ selected: false });
});
