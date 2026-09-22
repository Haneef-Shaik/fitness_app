/**
 * G6's reads. Thin by design — the server already deferred every number to the
 * domain, which is what AC-06 rests on, so there is nothing for a hook to get
 * creatively wrong. What IS worth pinning is that they do not quietly recompute
 * or re-sort anything on the way past.
 */
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { createTestQueryClient } from '../client';
import {
  useAdherence, useExerciseProgression, useFrequency, useMuscleVolume,
  usePersonalRecords, useWorkoutAnalytics,
} from '../hooks';
import { analyticsApi } from '../../api-analytics';

jest.mock('../../api-analytics', () => ({
  analyticsApi: {
    workouts: jest.fn(), muscleVolume: jest.fn(), exercise: jest.fn(),
    personalRecords: jest.fn(), frequency: jest.fn(), adherence: jest.fn(),
  },
}));

const mockApi = analyticsApi as jest.Mocked<typeof analyticsApi>;
const live: ReturnType<typeof createTestQueryClient>[] = [];

function harness() {
  const client = createTestQueryClient();
  live.push(client);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper };
}

beforeEach(() => jest.clearAllMocks());
afterEach(() => {
  for (const c of live.splice(0)) { c.cancelQueries(); c.unmount(); c.clear(); }
});

it('passes the range straight through, without reinterpreting the dates', async () => {
  // The dates are already the user's local days (I7). Any massaging here would
  // be a second opinion about which day a session belongs to.
  mockApi.workouts.mockResolvedValue({ group_by: 'week', buckets: [], total_volume_kg: 0 });
  const { wrapper } = harness();
  const range = { from: '2026-07-01', to: '2026-09-30', groupBy: 'week' as const };

  const { result } = renderHook(() => useWorkoutAnalytics(range), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(mockApi.workouts).toHaveBeenCalledWith(range);
});

it('keeps the server order for muscle volume', async () => {
  // The server sorts. Re-sorting here would be a second ordering to maintain,
  // and the two would drift the first time a tie-break changed.
  mockApi.muscleVolume.mockResolvedValue([
    { slug: 'chest', name: 'Chest', volume_kg: 900, set_count: 9 },
    { slug: 'back', name: 'Back', volume_kg: 400, set_count: 4 },
  ]);
  const { wrapper } = harness();

  const { result } = renderHook(() => useMuscleVolume(), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data?.map((r) => r.slug)).toEqual(['chest', 'back']);
});

it('carries the formula version through to the screen', async () => {
  // I5. The screen prints it; if the hook dropped it a chart could mix versions
  // and look fine.
  mockApi.exercise.mockResolvedValue({
    exercise_id: 'e1', exercise_name: 'Bench', formula_version: 'epley_v1', points: [],
  });
  const { wrapper } = harness();

  const { result } = renderHook(() => useExerciseProgression('e1'), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data?.formula_version).toBe('epley_v1');
});

it('does not ask about an exercise that was not chosen', () => {
  const { wrapper } = harness();
  renderHook(() => useExerciseProgression(''), { wrapper });
  expect(mockApi.exercise).not.toHaveBeenCalled();
});

it('passes a null adherence through as null, never 0', async () => {
  // "No plan" is not "0% adherent", and coercing here would erase that.
  mockApi.adherence.mockResolvedValue({
    planned: 0, completed_planned: 0, adherence: null, weeks: [],
  });
  const { wrapper } = harness();

  const { result } = renderHook(() => useAdherence(), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data?.adherence).toBeNull();
});

it('fetches records and frequency', async () => {
  mockApi.personalRecords.mockResolvedValue([]);
  mockApi.frequency.mockResolvedValue({ weeks: [], cells: [] });
  const { wrapper } = harness();

  const records = renderHook(() => usePersonalRecords(), { wrapper });
  const frequency = renderHook(() => useFrequency(), { wrapper });

  await waitFor(() => expect(records.result.current.isSuccess).toBe(true));
  await waitFor(() => expect(frequency.result.current.isSuccess).toBe(true));
  expect(mockApi.personalRecords).toHaveBeenCalled();
  expect(mockApi.frequency).toHaveBeenCalled();
});
