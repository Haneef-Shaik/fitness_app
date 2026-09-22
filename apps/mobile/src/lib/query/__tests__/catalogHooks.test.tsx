/**
 * The catalog and planning hooks (G2).
 *
 * The point of each test is the same: the read lands under its REGISTRY key, and
 * the write routes through applyInvalidation. A hook that invents its own key is
 * a screen nobody can invalidate.
 */
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createTestQueryClient } from '../client';
import {
  useAddPlanDay, useCreateExercise, useCreateProgram, useExercise, useExerciseHistory,
  useExerciseStats, useExercises, useMuscleGroups, useProgram, usePrograms,
  useSetDayExercises, useUpdatePlanDay,
} from '../hooks';
import { qk } from '../queryKeys';
import { catalogApi, programsApi } from '../../api-catalog';

jest.mock('../../api-catalog', () => ({
  catalogApi: {
    muscleGroups: jest.fn(), exercises: jest.fn(), exercise: jest.fn(),
    createExercise: jest.fn(), history: jest.fn(), stats: jest.fn(),
  },
  programsApi: {
    list: jest.fn(), get: jest.fn(), create: jest.fn(), addDay: jest.fn(),
    updateDay: jest.fn(), setDayExercises: jest.fn(),
  },
}));
jest.mock('../../api', () => ({ profileApi: {}, goalsApi: {} }));

const cat = catalogApi as jest.Mocked<typeof catalogApi>;
const prog = programsApi as jest.Mocked<typeof programsApi>;

const live: ReturnType<typeof createTestQueryClient>[] = [];
function harness() {
  const client = createTestQueryClient();
  live.push(client);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}
beforeEach(() => jest.clearAllMocks());
afterEach(() => { for (const c of live.splice(0)) { c.cancelQueries(); c.unmount(); c.clear(); } });

async function expectCachedUnder<T>(
  hook: () => { isSuccess: boolean },
  key: readonly unknown[],
  value: T,
) {
  const { client, wrapper } = harness();
  const { result } = renderHook(hook, { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(client.getQueryData(key)).toEqual(value);
}

describe('catalog reads use the registry keys', () => {
  it('muscle groups', async () => {
    cat.muscleGroups.mockResolvedValue([{ slug: 'chest' }] as never);
    await expectCachedUnder(() => useMuscleGroups(), qk.muscleGroups(), [{ slug: 'chest' }]);
  });

  it('exercises, keyed by their filters', async () => {
    cat.exercises.mockResolvedValue([{ id: 'e1' }] as never);
    await expectCachedUnder(
      () => useExercises({ muscle: 'chest' }), qk.exercises({ muscle: 'chest' }), [{ id: 'e1' }],
    );
  });

  it('one exercise', async () => {
    cat.exercise.mockResolvedValue({ id: 'e1' } as never);
    await expectCachedUnder(() => useExercise('e1'), qk.exercise('e1'), { id: 'e1' });
  });

  it('exercise history', async () => {
    cat.history.mockResolvedValue([{ session_id: 's1' }] as never);
    await expectCachedUnder(
      () => useExerciseHistory('e1'), qk.exerciseHistory('e1'), [{ session_id: 's1' }],
    );
  });

  it('exercise stats', async () => {
    cat.stats.mockResolvedValue({ session_count: 2 } as never);
    await expectCachedUnder(() => useExerciseStats('e1'), qk.exerciseStats('e1'), { session_count: 2 });
  });

  it('does not fetch without an id', async () => {
    const { wrapper } = harness();
    renderHook(() => useExercise(''), { wrapper });
    expect(cat.exercise).not.toHaveBeenCalled();
  });
});

describe('planning reads use the registry keys', () => {
  it('programs', async () => {
    prog.list.mockResolvedValue([{ id: 'p1' }] as never);
    await expectCachedUnder(() => usePrograms(), qk.programs(), [{ id: 'p1' }]);
  });

  it('one program', async () => {
    prog.get.mockResolvedValue({ id: 'p1' } as never);
    await expectCachedUnder(() => useProgram('p1'), qk.program('p1'), { id: 'p1' });
  });
});

describe('writes route through the invalidation map', () => {
  it('creating an exercise invalidates the catalog', async () => {
    const { client, wrapper } = harness();
    client.setQueryData(qk.exercises(), []);
    cat.createExercise.mockResolvedValue({ id: 'e9' } as never);

    const { result } = renderHook(() => useCreateExercise(), { wrapper });
    await act(async () => { await result.current.mutateAsync({ name: 'X' } as never); });

    expect(client.getQueryState(qk.exercises())?.isInvalidated).toBe(true);
  });

  it('creating a program invalidates the program list', async () => {
    const { client, wrapper } = harness();
    client.setQueryData(qk.programs(), []);
    prog.create.mockResolvedValue({ id: 'p9' } as never);

    const { result } = renderHook(() => useCreateProgram(), { wrapper });
    await act(async () => { await result.current.mutateAsync({ name: 'PPL' } as never); });

    expect(client.getQueryState(qk.programs())?.isInvalidated).toBe(true);
  });

  it('adding a day invalidates its program', async () => {
    const { client, wrapper } = harness();
    client.setQueryData(qk.program('p1'), { id: 'p1' });
    prog.addDay.mockResolvedValue({ id: 'p1' } as never);

    const { result } = renderHook(() => useAddPlanDay('p1'), { wrapper });
    await act(async () => { await result.current.mutateAsync({ name: 'Push' } as never); });

    expect(client.getQueryState(qk.program('p1'))?.isInvalidated).toBe(true);
  });

  it('editing a day invalidates its program', async () => {
    const { client, wrapper } = harness();
    client.setQueryData(qk.program('p1'), { id: 'p1' });
    prog.updateDay.mockResolvedValue({ id: 'p1' } as never);

    const { result } = renderHook(() => useUpdatePlanDay('p1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ dayId: 'd1', body: { name: 'Push' } as never });
    });

    expect(client.getQueryState(qk.program('p1'))?.isInvalidated).toBe(true);
  });

  it('AC-12: saving prescriptions never invalidates performed data', async () => {
    const { client, wrapper } = harness();
    client.setQueryData(qk.program('p1'), { id: 'p1' });
    client.setQueryData(qk.sessions(), []);
    client.setQueryData(qk.records('e1'), {});
    prog.setDayExercises.mockResolvedValue({ id: 'p1' } as never);

    const { result } = renderHook(() => useSetDayExercises('p1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ dayId: 'd1', body: [] });
    });

    expect(client.getQueryState(qk.program('p1'))?.isInvalidated).toBe(true);
    expect(client.getQueryState(qk.sessions())?.isInvalidated).toBe(false);
    expect(client.getQueryState(qk.records('e1'))?.isInvalidated).toBe(false);
  });
});
