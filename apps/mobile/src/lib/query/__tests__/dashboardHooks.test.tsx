/**
 * The dashboard and body hooks (G9).
 *
 * Two things here decide whether AC-11 stays true after this goal:
 *
 * **The dashboard asks for no date.** `useDashboard()` with no argument sends
 * `/dashboard` and nothing else — the server resolves the day from the profile
 * timezone (**I7**). A `?date=` computed on the device would be right for
 * almost every user and wrong for exactly the ones who travel.
 *
 * **A timezone change drops the whole cache.** The server re-files every
 * session, meal and weigh-in onto the day it now falls on (T4), so every cached
 * read keyed by a day is wrong — which is all of them.
 */
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createTestQueryClient } from '../client';
import {
  useBodyMetrics, useBodySeries, useDashboard, useDeleteBodyMetric,
  useLogBodyMetric, useUpdateTimezone,
} from '../hooks';
import { qk } from '../queryKeys';
import { bodyApi } from '../../api-body';
import { profileApi } from '../../api';
import { queueMetric } from '../../../features/body/logMetric';

jest.mock('../../api-body', () => ({
  bodyApi: {
    dashboard: jest.fn(), metrics: jest.fn(), series: jest.fn(),
    deleteMetric: jest.fn(), photos: jest.fn(), createPhoto: jest.fn(),
    deletePhoto: jest.fn(),
  },
}));

jest.mock('../../api', () => ({
  profileApi: { get: jest.fn(), patch: jest.fn(() => Promise.resolve({})) },
  goalsApi: { list: jest.fn(), get: jest.fn(), create: jest.fn(), patch: jest.fn() },
  api: { get: jest.fn(), getPaged: jest.fn(), post: jest.fn(), patch: jest.fn(), del: jest.fn() },
}));

jest.mock('../../../features/body/logMetric', () => ({
  queueMetric: jest.fn(() => Promise.resolve({ clientId: 'c1', idempotencyKey: 'k1' })),
}));

const body = bodyApi as jest.Mocked<typeof bodyApi>;
const mockQueue = queueMetric as jest.MockedFunction<typeof queueMetric>;
const live: ReturnType<typeof createTestQueryClient>[] = [];

function harness() {
  const client = createTestQueryClient();
  live.push(client);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

const seed = (client: ReturnType<typeof createTestQueryClient>, key: readonly unknown[]) =>
  client.setQueryData(key as unknown[], { seeded: true });

const stale = (client: ReturnType<typeof createTestQueryClient>, key: readonly unknown[]) =>
  client.getQueryState(key as unknown[])?.isInvalidated ?? false;

beforeEach(() => jest.clearAllMocks());

afterEach(() => {
  for (const c of live.splice(0)) {
    c.cancelQueries();
    c.unmount();
    c.clear();
  }
});

describe('the dashboard', () => {
  it('asks for no date, and caches under "today"', async () => {
    const { client, wrapper } = harness();
    body.dashboard.mockResolvedValue({ local_date: '2026-09-23' } as never);

    const { result } = renderHook(() => useDashboard(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(body.dashboard).toHaveBeenCalledWith(undefined);
    expect(client.getQueryData(qk.dashboard())).toBeTruthy();
  });

  it('keys an explicit past day separately from today', async () => {
    const { client, wrapper } = harness();
    body.dashboard.mockResolvedValue({ local_date: '2026-09-21' } as never);

    const { result } = renderHook(() => useDashboard('2026-09-21'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Yesterday's dashboard is a real thing to want, and it is not today's.
    expect(client.getQueryData(qk.dashboard('2026-09-21'))).toBeTruthy();
    expect(client.getQueryData(qk.dashboard())).toBeUndefined();
  });
});

describe('body reads', () => {
  it('keys the series and the raw list apart', async () => {
    const { client, wrapper } = harness();
    body.series.mockResolvedValue({ points: [] } as never);
    body.metrics.mockResolvedValue([] as never);

    const s = renderHook(() => useBodySeries('body_weight'), { wrapper });
    const m = renderHook(() => useBodyMetrics('body_weight'), { wrapper });
    await waitFor(() => expect(s.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(m.result.current.isSuccess).toBe(true));

    // One point per day versus every entry — different questions.
    expect(client.getQueryData(qk.bodySeries('body_weight'))).toBeTruthy();
    expect(client.getQueryData(qk.bodyMetrics('body_weight'))).toBeTruthy();
  });

  it('keys each metric separately', async () => {
    const { client, wrapper } = harness();
    body.series.mockResolvedValue({ points: [] } as never);

    const { result } = renderHook(() => useBodySeries('waist_cm'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.getQueryData(qk.bodySeries('waist_cm'))).toBeTruthy();
    expect(client.getQueryData(qk.bodySeries('body_weight'))).toBeUndefined();
  });
});

describe('logging a measurement', () => {
  it('goes through the OUTBOX, not a direct post', async () => {
    const { wrapper } = harness();
    const { result } = renderHook(() => useLogBodyMetric(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        metric_key: 'body_weight', value: 78.4, unit: 'kg',
        measured_at: null, notes: null, client_id: null,
      });
    });

    // A bathroom is where the signal is worst in any building.
    expect(mockQueue).toHaveBeenCalledTimes(1);
  });

  it('reaches the body, the dashboard and the goals — and nothing else', async () => {
    const { client, wrapper } = harness();
    for (const key of [
      qk.bodySeries('body_weight'), qk.dashboard(), qk.goals(),
      qk.nutritionDay('today'), qk.analyticsWorkouts(),
    ]) seed(client, key);

    const { result } = renderHook(() => useLogBodyMetric(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        metric_key: 'body_weight', value: 78.4, unit: 'kg',
        measured_at: null, notes: null, client_id: null,
      });
    });

    expect(stale(client, qk.bodySeries('body_weight'))).toBe(true);
    expect(stale(client, qk.dashboard())).toBe(true);
    // A goal's progress is measured against the latest weigh-in.
    expect(stale(client, qk.goals())).toBe(true);
    // Stepping on a scale changes neither of these.
    expect(stale(client, qk.nutritionDay('today'))).toBe(false);
    expect(stale(client, qk.analyticsWorkouts())).toBe(false);
  });

  it('deleting one invalidates the same way', async () => {
    const { client, wrapper } = harness();
    seed(client, qk.dashboard());
    body.deleteMetric.mockResolvedValue({ id: 'm1' } as never);

    const { result } = renderHook(() => useDeleteBodyMetric(), { wrapper });
    await act(async () => { await result.current.mutateAsync('m1'); });

    // Deleting the first entry of a day promotes the second to canonical, so
    // the day really has changed.
    expect(stale(client, qk.dashboard())).toBe(true);
  });
});

describe('changing the timezone', () => {
  it('drops the entire cache, because every day-keyed read is now wrong', async () => {
    const { client, wrapper } = harness();
    for (const key of [
      qk.dashboard(), qk.nutritionDay('today'), qk.bodySeries('body_weight'),
      qk.history(), qk.analyticsWorkouts(),
    ]) seed(client, key);

    const { result } = renderHook(() => useUpdateTimezone(), { wrapper });
    await act(async () => { await result.current.mutateAsync('Pacific/Auckland'); });

    expect(profileApi.patch).toHaveBeenCalledWith({ timezone: 'Pacific/Auckland' });
    // T4: the server re-files every session, meal and weigh-in. A targeted
    // invalidation here would be a guess.
    expect(client.getQueryData(qk.dashboard())).toBeUndefined();
    expect(client.getQueryData(qk.nutritionDay('today'))).toBeUndefined();
    expect(client.getQueryData(qk.history())).toBeUndefined();
  });
});
