/**
 * D-02 · Exercise Detail — "How to do it".
 *
 * The person who needs the instructions most has never logged the exercise, so
 * they must render in the never-performed state, where everything else on the
 * screen is empty. A custom exercise with no notes shows no empty section.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'e1' }),
}));

const q = (data: unknown) => ({
  data, isPending: false, isError: false, isSuccess: true, error: null, refetch: jest.fn(),
});

const RDL = {
  id: 'e1', name: 'Romanian Deadlift', equipment: 'barbell', movement_pattern: 'hinge',
  aliases: ['rdl'], is_custom: false, status: 'active',
  tracks_load: true, tracks_reps: true, tracks_duration: false, tracks_distance: false,
  default_unit: 'kg',
  instructions: 'Stand tall holding the bar at your hips. Push your hips back with soft knees '
    + 'until you feel your hamstrings stretch. Keep the bar close to your legs.',
  muscles: [{ id: 'm1', slug: 'hamstrings', name: 'Hamstrings', role: 'primary' }],
};

let mockExercise: Record<string, unknown> = RDL;
jest.mock('@/lib/query/hooks', () => ({
  useExercise: () => q(mockExercise),
  useExerciseStats: () => q({ session_count: 0, records: {}, e1rm_series: [] }),
  useExerciseHistory: () => q([]),
}));

import ExerciseDetail from '../train/exercises/[id]';

beforeEach(() => { mockExercise = RDL; });

it('shows how to do it to someone who has never logged it', () => {
  render(<ExerciseDetail />);
  expect(screen.getByTestId('never-performed')).toBeTruthy();
  expect(screen.getByText('How to do it')).toBeTruthy();
  expect(screen.getByText(/Push your hips back/)).toBeTruthy();
});

it('shows no empty instructions section for an exercise without any', () => {
  mockExercise = { ...RDL, is_custom: true, instructions: null };
  render(<ExerciseDetail />);
  expect(screen.queryByTestId('exercise-instructions')).toBeNull();
});
