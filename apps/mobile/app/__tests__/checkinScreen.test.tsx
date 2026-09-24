/**
 * Check in — weight and measurements together (G10). Blank fields are skipped,
 * imperial is converted, and every value goes through the outbox (I10).
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ router: { back: () => mockBack(), push: jest.fn() } }));
const mockQueue = jest.fn(async (_m: Record<string, unknown>) => ({}));
jest.mock('@/features/body/logMetric', () => ({ queueMetric: (m: Record<string, unknown>) => mockQueue(m) }));
jest.mock('@/lib/query/invalidation', () => ({ applyInvalidation: jest.fn(async () => {}) }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({}) }));

let mockUnits = 'metric';
const q = (data: unknown) => ({ data, isPending: false, isError: false, error: null, refetch: jest.fn() });
jest.mock('@/lib/query/hooks', () => ({
  useProfile: () => q({ preferred_unit_system: mockUnits }),
  useCheckins: () => q({ checkins: [{ local_date: '2026-09-01', values: { body_weight: 84 }, since_baseline: {} }] }),
}));
jest.mock('@/lib/session', () => ({ useSession: () => null }));

import CheckIn from '../progress/checkin';

beforeEach(() => { jest.clearAllMocks(); mockUnits = 'metric'; });

it('saves only what was filled in, then goes back', async () => {
  render(<CheckIn />);
  fireEvent.changeText(screen.getByTestId('checkin-weight'), '82,6');
  fireEvent.changeText(screen.getByTestId('checkin-waist_cm'), '90');
  await act(async () => { fireEvent.press(screen.getByTestId('checkin-save')); });
  expect(mockQueue.mock.calls.map(([m]) => [m.metric_key, m.value, m.unit])).toEqual([
    ['body_weight', 82.6, 'kg'], ['waist_cm', 90, 'cm'],
  ]);
  expect(mockBack).toHaveBeenCalled();
});

it('nothing filled in, nothing to save', () => {
  render(<CheckIn />);
  expect(screen.getByTestId('checkin-save').props.accessibilityState.disabled).toBe(true);
});

it('imperial is converted to canonical units on the way in', async () => {
  mockUnits = 'imperial';
  render(<CheckIn />);
  fireEvent.changeText(screen.getByTestId('checkin-weight'), '180');
  fireEvent.changeText(screen.getByTestId('checkin-waist_cm'), '35');
  await act(async () => { fireEvent.press(screen.getByTestId('checkin-save')); });
  const [w, waist] = mockQueue.mock.calls.map(([m]) => m);
  expect(w).toMatchObject({ metric_key: 'body_weight', unit: 'kg' });
  expect(w!.value).toBeCloseTo(81.6, 1);
  expect(waist).toMatchObject({ metric_key: 'waist_cm', unit: 'cm' });
  expect(waist!.value).toBeCloseTo(88.9, 1);
});

it('shows the last value beside the label — not as a placeholder that looks typed in', () => {
  render(<CheckIn />);
  expect(screen.getByTestId('checkin-weight-hint').props.children).toBe('Last: 84 kg');
  expect(screen.getByTestId('checkin-weight').props.placeholder).toBeUndefined();
});

it('the last value is in the units the user reads in', () => {
  mockUnits = 'imperial';
  render(<CheckIn />);
  expect(screen.getByTestId('checkin-weight-hint').props.children).toBe('Last: 185.2 lb');
});
