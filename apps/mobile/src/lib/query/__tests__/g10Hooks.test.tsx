/**
 * The hooks G10 added or wired — each through its registry key and its
 * invalidation event, because a hook that caches under an ad-hoc key or
 * invalidates the wrong prefix is exactly the bug the query layer exists to
 * rule out (docs/03 §6).
 *
 * Also the ones CI's coverage gate found untested in G10: goals by id, the
 * starter programs, the check-ins, progress photos and the Sync Center's
 * outbox hooks.
 */
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createTestQueryClient } from '../client';
import {
  useCheckins, useCreateProgressPhoto, useDeleteProgressPhoto, useDiscardQueued,
  useDiscardUnattributed, useFood, useGoal, useNutritionRange, useOutbox,
  usePreviousPerformance, useProgramTemplates, useProgressPhotos, useRetryAllQueued,
  useRetryQueued, useStartTemplate, useUnattributed, useUpdateGoal,
} from '../hooks';
import { qk } from '../queryKeys';
import { goalsApi } from '../../api';
import { catalogApi, programsApi } from '../../api-catalog';
import { analyticsApi } from '../../api-analytics';
import { bodyApi } from '../../api-body';
import { nutritionApi } from '../../api-nutrition';
import { store } from '../../db';
import { flushAndReconcile } from '../../../features/workout-session/sessionController';

jest.mock('../../api', () => ({
  goalsApi: { list: jest.fn(), get: jest.fn(), create: jest.fn(), patch: jest.fn() },
  profileApi: { get: jest.fn(), patch: jest.fn() },
}));
jest.mock('../../api-catalog', () => ({
  catalogApi: { previousPerformance: jest.fn() },
  programsApi: { templates: jest.fn(), startTemplate: jest.fn() },
}));
jest.mock('../../api-analytics', () => ({ analyticsApi: { nutrition: jest.fn() } }));
jest.mock('../../api-body', () => ({
  bodyApi: { checkins: jest.fn(), photos: jest.fn(), createPhoto: jest.fn(), deletePhoto: jest.fn() },
}));
jest.mock('../../api-nutrition', () => ({ nutritionApi: { food: jest.fn() } }));
jest.mock('../../db', () => ({
  store: {
    allEntries: jest.fn(), requeue: jest.fn(), discard: jest.fn(),
    unattributedCount: jest.fn(), discardUnattributed: jest.fn(),
  },
}));
jest.mock('../../../features/workout-session/sessionController', () => ({
  flushAndReconcile: jest.fn(() => Promise.resolve()),
}));

const goals = goalsApi as jest.Mocked<typeof goalsApi>;
const catalog = catalogApi as jest.Mocked<typeof catalogApi>;
const programs = programsApi as jest.Mocked<typeof programsApi>;
const analytics = analyticsApi as jest.Mocked<typeof analyticsApi>;
const body = bodyApi as jest.Mocked<typeof bodyApi>;
const nutrition = nutritionApi as jest.Mocked<typeof nutritionApi>;
const db = store as jest.Mocked<typeof store>;
const flush = flushAndReconcile as jest.MockedFunction<typeof flushAndReconcile>;

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
  client.getQueryState(key as unknown[])?.isInvalidated;

beforeEach(() => jest.clearAllMocks());
// Mounted hooks are unmounted too: the outbox polls every 3 s, and a poller
// left mounted keeps the Jest worker alive after the last test.
const mounted: (() => void)[] = [];
afterEach(() => {
  for (const u of mounted.splice(0)) u();
  for (const c of live.splice(0)) { c.cancelQueries(); c.unmount(); c.clear(); }
});

/** renderHook, remembered so afterEach can unmount it. */
function mount<T>(hook: () => T, wrapper: React.ComponentType<{ children: React.ReactNode }>) {
  const r = renderHook(hook, { wrapper });
  mounted.push(r.unmount);
  return r;
}

async function read<T>(hook: () => { isSuccess: boolean; data?: T }) {
  const h = harness();
  const { result, unmount } = renderHook(hook, { wrapper: h.wrapper });
  mounted.push(unmount);
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  return { ...h, data: result.current.data };
}

describe('reads cache under their registry keys', () => {
  it('a goal by id', async () => {
    goals.get.mockResolvedValue({ id: 'g1' } as never);
    const { client } = await read(() => useGoal('g1'));
    expect(client.getQueryData(qk.goal('g1'))).toEqual({ id: 'g1' });
  });

  it('previous performance, and nothing is asked for without an exercise', async () => {
    catalog.previousPerformance.mockResolvedValue({ sets: [] } as never);
    const { client } = await read(() => usePreviousPerformance('e1'));
    expect(client.getQueryData(qk.previousPerformance('e1'))).toEqual({ sets: [] });

    const { wrapper } = harness();
    mount(() => usePreviousPerformance(''), wrapper);
    expect(catalog.previousPerformance).toHaveBeenCalledTimes(1);
  });

  it('the starter programs', async () => {
    programs.templates.mockResolvedValue([{ key: 'gzclp' }] as never);
    const { client } = await read(() => useProgramTemplates());
    expect(client.getQueryData(qk.programTemplates())).toEqual([{ key: 'gzclp' }]);
  });

  it('nutrition over a range, keyed by the range (H-14)', async () => {
    analytics.nutrition.mockResolvedValue({ days: 7 } as never);
    const range = { from: '2026-09-18', to: '2026-09-24' };
    const { client } = await read(() => useNutritionRange(range));
    expect(analytics.nutrition).toHaveBeenCalledWith(range);
    expect(client.getQueryData(qk.nutritionAnalytics(range))).toEqual({ days: 7 });
  });

  it('a food by id', async () => {
    nutrition.food.mockResolvedValue({ id: 'f1' } as never);
    const { client } = await read(() => useFood('f1'));
    expect(client.getQueryData(qk.food('f1'))).toEqual({ id: 'f1' });
  });

  it('the check-ins and the progress photos', async () => {
    body.checkins.mockResolvedValue({ checkins: [] } as never);
    body.photos.mockResolvedValue([] as never);
    const a = await read(() => useCheckins());
    expect(a.client.getQueryData(qk.bodyCheckins())).toEqual({ checkins: [] });
    const b = await read(() => useProgressPhotos());
    expect(b.client.getQueryData(qk.progressPhotos())).toEqual([]);
  });

  it('the outbox and the writes no account can claim — both local, both cached', async () => {
    db.allEntries.mockResolvedValue([] as never);
    db.unattributedCount.mockResolvedValue(3);
    const a = await read(() => useOutbox());
    expect(a.data).toEqual([]);
    const b = await read(() => useUnattributed());
    expect(b.data).toBe(3);
  });
});

describe('writes invalidate what they change, and only that', () => {
  it('updating a goal', async () => {
    const { client, wrapper } = harness();
    goals.patch.mockResolvedValue({ id: 'g1' } as never);
    seed(client, qk.goals());
    seed(client, qk.foods());
    const { result } = mount(() => useUpdateGoal(), wrapper);
    await act(async () => { await result.current.mutateAsync({ id: 'g1', body: { target_value: 70 } }); });
    expect(goals.patch).toHaveBeenCalledWith('g1', { target_value: 70 });
    expect(stale(client, qk.goals())).toBe(true);
    expect(stale(client, qk.foods())).toBe(false);
  });

  it('starting a starter program marks the programs list stale', async () => {
    const { client, wrapper } = harness();
    programs.startTemplate.mockResolvedValue({ id: 'p9' } as never);
    seed(client, qk.programs());
    const { result } = mount(() => useStartTemplate(), wrapper);
    await act(async () => { await result.current.mutateAsync('gzclp'); });
    expect(programs.startTemplate).toHaveBeenCalledWith('gzclp');
    expect(stale(client, qk.programs())).toBe(true);
  });

  it('adding and deleting a progress photo', async () => {
    const { client, wrapper } = harness();
    body.createPhoto.mockResolvedValue({ id: 'ph1' } as never);
    body.deletePhoto.mockResolvedValue({} as never);
    seed(client, qk.progressPhotos());
    const add = mount(() => useCreateProgressPhoto(), wrapper);
    await act(async () => { await add.result.current.mutateAsync({ image_key: 'k' } as never); });
    expect(stale(client, qk.progressPhotos())).toBe(true);

    seed(client, qk.progressPhotos());
    const del = mount(() => useDeleteProgressPhoto(), wrapper);
    await act(async () => { await del.result.current.mutateAsync('ph1'); });
    expect(body.deletePhoto).toHaveBeenCalledWith('ph1');
    expect(stale(client, qk.progressPhotos())).toBe(true);
  });

  it('retrying one queued write keeps its key, and drains now', async () => {
    const { client, wrapper } = harness();
    seed(client, qk.outbox());
    const { result } = mount(() => useRetryQueued(), wrapper);
    await act(async () => { await result.current.mutateAsync(7); });
    expect(db.requeue).toHaveBeenCalledWith(7, expect.any(String));
    expect(flush).toHaveBeenCalledTimes(1);
    expect(stale(client, qk.outbox())).toBe(true);
  });

  it('retrying everything requeues each, then drains once', async () => {
    const { wrapper } = harness();
    const { result } = mount(() => useRetryAllQueued(), wrapper);
    await act(async () => { await result.current.mutateAsync([1, 2, 3]); });
    expect(db.requeue.mock.calls.map(([id]) => id)).toEqual([1, 2, 3]);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('discarding one write, and discarding the unclaimable ones', async () => {
    const { client, wrapper } = harness();
    db.discardUnattributed.mockResolvedValue(3);
    seed(client, qk.outbox());
    const one = mount(() => useDiscardQueued(), wrapper);
    await act(async () => { await one.result.current.mutateAsync(4); });
    expect(db.discard).toHaveBeenCalledWith(4);
    expect(stale(client, qk.outbox())).toBe(true);

    seed(client, qk.outbox());
    const all = mount(() => useDiscardUnattributed(), wrapper);
    await act(async () => { await all.result.current.mutateAsync(); });
    expect(db.discardUnattributed).toHaveBeenCalledTimes(1);
    expect(stale(client, qk.outbox())).toBe(true);
  });
});
