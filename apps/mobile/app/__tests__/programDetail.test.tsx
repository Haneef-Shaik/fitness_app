/**
 * C-03 · Program detail — names each day's weekday the way the API means it
 * (0 = Monday). The Push / Pull / Legs template, "Mon / Wed / Fri", showed as
 * Sun / Tue / Thu (found taking the screenshots, 2 Oct).
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'p1' }),
}));

const q = (data: unknown) => ({ data, isPending: false, isError: false, error: null, refetch: jest.fn() });
const PROGRAM = {
  id: 'p1', name: 'Push / Pull / Legs', status: 'active', description: null,
  days: [
    { id: 'd1', name: 'Push', day_index: 0, scheduled_weekday: 0, notes: null, exercises: [] },
    { id: 'd2', name: 'Pull', day_index: 1, scheduled_weekday: 2, notes: null, exercises: [] },
    { id: 'd3', name: 'Legs', day_index: 2, scheduled_weekday: 4, notes: null, exercises: [] },
  ],
};
jest.mock('@/lib/query/hooks', () => ({
  useProgram: () => q(PROGRAM),
  useAddPlanDay: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

import ProgramDetail from '../train/programs/[id]';

it('labels 0, 2 and 4 as Monday, Wednesday and Friday', () => {
  render(<ProgramDetail />);
  expect(screen.getByText(/^Mon · /)).toBeTruthy();
  expect(screen.getByText(/^Wed · /)).toBeTruthy();
  expect(screen.getByText(/^Fri · /)).toBeTruthy();
  expect(screen.queryByText(/^Sun · /)).toBeNull();
});
