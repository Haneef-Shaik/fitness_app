/**
 * The starter-program library (G10): ranked by the server, filterable, and a
 * program is copied only when the user says so.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ router: { replace: (...a: unknown[]) => mockReplace(...a), back: jest.fn(), push: jest.fn() } }));
jest.mock('@/lib/session', () => ({ useSession: () => null }));

const t = (key: string, level: string, days: number, equipment: string, extra = {}) => ({
  key, name: key, summary: `${key} summary`, level, focus: 'strength', equipment, session_minutes: 60,
  days_per_week: days, schedule: 'Mon / Wed / Fri', progression: 'Add weight', based_on: null,
  fits: true, recommended: false, reasons: [], days: [{ name: 'Day 1', scheduled_weekday: 0, notes: null, exercises: [
    { name: 'Barbell Squat', sets: 5, reps_min: 5, reps_max: 5, duration_seconds: null, rest_seconds: 180 },
  ] }], ...extra,
});
const mockRows = [
  t('stronglifts-5x5', 'beginner', 3, 'full_gym', { recommended: true, reasons: ['Matches your 3 days a week'] }),
  t('dumbbell-full-body', 'beginner', 3, 'dumbbells'),
  t('531-bbb', 'advanced', 4, 'full_gym'),
];
const mockStart = jest.fn(async (_k: string) => ({ id: 'p9' }));
jest.mock('@/lib/query/hooks', () => ({
  useProgramTemplates: () => ({ data: mockRows, isPending: false, isError: false, error: null, refetch: jest.fn() }),
  useStartTemplate: () => ({ mutateAsync: (k: string) => mockStart(k), isPending: false }),
}));

import Library from '../train/programs/templates';

beforeEach(() => jest.clearAllMocks());

it('lists the programs in the order the server ranked them, the best match marked', () => {
  render(<Library />);
  expect(screen.getByText('Best match')).toBeTruthy();
  expect(screen.getByText('Matches your 3 days a week')).toBeTruthy();
});

it('filters narrow the list', () => {
  render(<Library />);
  fireEvent.press(screen.getByText('Advanced'));
  expect(screen.getByTestId('program-531-bbb')).toBeTruthy();
  expect(screen.queryByTestId('program-stronglifts-5x5')).toBeNull();
});

it('nothing is copied until the user chooses "Use this program"', async () => {
  render(<Library />);
  fireEvent.press(screen.getByTestId('program-stronglifts-5x5'));
  expect(mockStart).not.toHaveBeenCalled();
  expect(screen.getByText(/Mon \/ Wed \/ Fri/)).toBeTruthy();       // the preview opens
  await act(async () => { fireEvent.press(screen.getByTestId('use-stronglifts-5x5')); });
  expect(mockStart).toHaveBeenCalledWith('stronglifts-5x5');
  expect(mockReplace).toHaveBeenCalledWith('/train/programs/p9');
});
