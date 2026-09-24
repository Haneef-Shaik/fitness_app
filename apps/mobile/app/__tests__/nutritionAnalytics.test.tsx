/**
 * H-14 · Nutrition analytics (G10). What the screen must never do: average
 * over days nobody logged, draw a chart from two days, or put weight and
 * calories on two y-axes.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

const q = (data: unknown) => ({ data, isPending: false, isError: false, error: null, refetch: jest.fn() });
const mockRange = jest.fn();
let mockData: unknown = null;
jest.mock('@/lib/query/hooks', () => ({
  useDashboard: () => q({ local_date: '2026-09-24' }),
  useNutritionRange: (r: unknown) => { mockRange(r); return q(mockData); },
}));

import NutritionAnalytics from '../nutrition/analytics';

const day = (d: string, kcal: number | null, over: Record<string, unknown> = {}) => ({
  local_date: d, calories: kcal, protein_g: kcal ? 150 : null, trained: false, body_weight_kg: null, ...over,
});

const FULL = {
  from: '2026-09-18', to: '2026-09-24', days: 7, logged_days: 5, enough_data: true,
  averages: { calories: 2280, protein_g: 168, carbs_g: 241, fat_g: 73 },
  macro_split: { protein: 29, carbs: 42, fat: 29 },
  target_kcal: 2340, within_target_days: 4, incomplete_days: 1,
  training: { days: 3, calories: 2410, protein_g: 181 }, rest: { days: 2, calories: 2020, protein_g: 142 },
  daily: [
    day('2026-09-18', 2300, { body_weight_kg: 80.1, trained: true }), day('2026-09-19', null),
    day('2026-09-20', 2200), day('2026-09-21', 2500, { trained: true }), day('2026-09-22', null),
    day('2026-09-23', 2100, { body_weight_kg: 79.6 }), day('2026-09-24', 2300, { trained: true }),
  ],
};

beforeEach(() => { jest.clearAllMocks(); mockData = FULL; });

it('opens on the last seven days, ending on the server\'s today', () => {
  render(<NutritionAnalytics />);
  expect(mockRange).toHaveBeenLastCalledWith({ from: '2026-09-18', to: '2026-09-24' });
  expect(screen.getByText('18 – 24 Sep 2026 · 7 days')).toBeTruthy();
});

it('states the average WITH the number of days it is over', () => {
  render(<NutritionAnalytics />);
  expect(screen.getByTestId('avg-kcal').props.children).toBe('2,280');
  expect(screen.getByText('Averages use the 5 days you logged.')).toBeTruthy();
  expect(screen.getByTestId('within-target').props.children).toBe('4');
});

it('compares training and rest days', () => {
  render(<NutritionAnalytics />);
  expect(screen.getByText(/Training \(3\)/)).toBeTruthy();
  expect(screen.getByText(/Rest \(2\)/)).toBeTruthy();
});

it('draws weight as its OWN chart under intake — never a second axis', () => {
  render(<NutritionAnalytics />);
  expect(screen.getByTestId('intake-chart')).toBeTruthy();
  expect(screen.getByTestId('weight-chart')).toBeTruthy();
});

it('says when macro data is incomplete', () => {
  render(<NutritionAnalytics />);
  expect(screen.getByText(/1 day has foods without macro data/)).toBeTruthy();
});

it('with fewer than three logged days, says so instead of drawing a chart', () => {
  mockData = { ...FULL, logged_days: 2, enough_data: false };
  render(<NutritionAnalytics />);
  expect(screen.getByText('Not enough data yet')).toBeTruthy();
  expect(screen.queryByTestId('intake-chart')).toBeNull();
});

it('switches to a month', () => {
  render(<NutritionAnalytics />);
  fireEvent.press(screen.getByTestId('range-month'));
  expect(mockRange).toHaveBeenLastCalledWith({ from: '2026-08-26', to: '2026-09-24' });
});

it('a custom range is checked before it is asked for', () => {
  render(<NutritionAnalytics />);
  fireEvent.press(screen.getByTestId('range-custom'));
  fireEvent.changeText(screen.getByTestId('custom-from'), '2026-09-20');
  fireEvent.changeText(screen.getByTestId('custom-to'), '2026-09-01');
  expect(screen.getByTestId('custom-error').props.children).toMatch(/before it starts/);
  fireEvent.changeText(screen.getByTestId('custom-to'), '2026-09-22');
  expect(mockRange).toHaveBeenLastCalledWith({ from: '2026-09-20', to: '2026-09-22' });
});
