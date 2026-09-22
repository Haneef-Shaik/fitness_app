/**
 * G5's reads. The one with real logic is the paging loop.
 *
 * `useWorkoutHistory` is an infinite query, and `getNextPageParam` is where the
 * cursor convention (H5.1) actually lands: it must ask for page two with the
 * blob page one handed back, and must stop when the server says there is no
 * more — not when a page happens to come back short.
 */
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { createTestQueryClient } from '../client';
import {
  flattenHistory, usePreviousOccurrence, useSessionComparison, useWorkoutHistory,
} from '../hooks';
import { historyApi } from '../../api-history';

jest.mock('../../api-history', () => ({
  historyApi: { workouts: jest.fn(), previousOccurrence: jest.fn(), compare: jest.fn() },
}));

const mockApi = historyApi as jest.Mocked<typeof historyApi>;

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
  for (const c of live.splice(0)) {
    c.cancelQueries();
    c.unmount();
    c.clear();
  }
});

const row = (id: string) => ({
  id,
  local_date: '2026-09-18',
  started_at: '2026-09-18T10:00:00Z',
  completed_at: '2026-09-18T11:00:00Z',
  logged_timezone: 'UTC',
  total_volume_kg: 100,
  duration_seconds: 600,
  set_count: 2,
  exercise_names: ['Bench'],
});

describe('useWorkoutHistory — the paging loop', () => {
  it('asks for the next page with the cursor the last one gave it', async () => {
    mockApi.workouts
      .mockResolvedValueOnce({
        data: [row('a')],
        meta: { has_more: true, next_cursor: 'CURSOR-1', limit: 1, count: 1 },
      })
      .mockResolvedValueOnce({
        data: [row('b')],
        meta: { has_more: false, next_cursor: null, limit: 1, count: 1 },
      });

    const { wrapper } = harness();
    const { result } = renderHook(() => useWorkoutHistory({ limit: 1 }), { wrapper });

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));

    // The cursor went back untouched — nothing here parses or rebuilds it.
    expect(mockApi.workouts).toHaveBeenNthCalledWith(2, { limit: 1, cursor: 'CURSOR-1' });
    expect(flattenHistory(result.current.data?.pages).map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('stops when the server says so, not when a page looks short', async () => {
    // An exactly-full last page is the case that catches a `has_more` inferred
    // from "did we fill it?". The server counts one row past the page instead.
    mockApi.workouts.mockResolvedValueOnce({
      data: [row('a'), row('b')],
      meta: { has_more: false, next_cursor: null, limit: 2, count: 2 },
    });

    const { wrapper } = harness();
    const { result } = renderHook(() => useWorkoutHistory({ limit: 2 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });

  it('does not page on when a cursor is present but has_more is false', async () => {
    // Trusting `next_cursor` alone would loop for ever against a server that
    // always echoes one.
    mockApi.workouts.mockResolvedValue({
      data: [row('a')],
      meta: { has_more: false, next_cursor: 'STALE', limit: 1, count: 1 },
    });

    const { wrapper } = harness();
    const { result } = renderHook(() => useWorkoutHistory({ limit: 1 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });

  it('survives a response with no meta at all', async () => {
    mockApi.workouts.mockResolvedValue({ data: [row('a')] });

    const { wrapper } = harness();
    const { result } = renderHook(() => useWorkoutHistory(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });
});

describe('flattenHistory', () => {
  it('is empty, not undefined, before anything has loaded', () => {
    expect(flattenHistory(undefined)).toEqual([]);
  });

  it('concatenates the pages in order', () => {
    expect(flattenHistory([{ data: [row('a')] }, { data: [row('b')] }]).map((r) => r.id))
      .toEqual(['a', 'b']);
  });
});

describe('usePreviousOccurrence', () => {
  it('passes null straight through — never trained is an answer', async () => {
    mockApi.previousOccurrence.mockResolvedValue(null);

    const { wrapper } = harness();
    const { result } = renderHook(() => usePreviousOccurrence('chest'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('does not fire without a muscle', () => {
    const { wrapper } = harness();
    renderHook(() => usePreviousOccurrence(''), { wrapper });

    expect(mockApi.previousOccurrence).not.toHaveBeenCalled();
  });
});

describe('useSessionComparison', () => {
  it('does not fire with nothing to compare', () => {
    const { wrapper } = harness();
    renderHook(() => useSessionComparison([]), { wrapper });

    expect(mockApi.compare).not.toHaveBeenCalled();
  });

  it('caches by the SET of sessions, so order does not split the cache', async () => {
    mockApi.compare.mockResolvedValue({ sessions: [], exercises: [] });

    const { wrapper } = harness();
    const { result } = renderHook(() => useSessionComparison(['b', 'a']), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const { result: swapped } = renderHook(() => useSessionComparison(['a', 'b']), { wrapper });
    await waitFor(() => expect(swapped.current.isSuccess).toBe(true));

    // "Compare A with B" and "compare B with A" are one question.
    expect(mockApi.compare).toHaveBeenCalledTimes(1);
  });
});
