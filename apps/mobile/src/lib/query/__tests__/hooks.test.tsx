import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createTestQueryClient } from '../client';
import { useCreateGoal, useGoals, useProfile, useUpdateProfile } from '../hooks';
import { qk } from '../queryKeys';
import { goalsApi, profileApi } from '../../api';

jest.mock('../../api', () => ({
  profileApi: { get: jest.fn(), patch: jest.fn() },
  goalsApi: { list: jest.fn(), create: jest.fn() },
}));

const mockProfile = profileApi as jest.Mocked<typeof profileApi>;
const mockGoals = goalsApi as jest.Mocked<typeof goalsApi>;

// A QueryClient mounted through a provider keeps subscriptions alive; without
// unmounting them the Jest worker never becomes idle and the run hangs.
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

afterEach(() => {
  for (const c of live.splice(0)) {
    c.cancelQueries();
    c.unmount();
    c.clear();
  }
});

describe('reads', () => {
  it('caches the profile under the registry key, not an ad-hoc one', async () => {
    const { client, wrapper } = harness();
    mockProfile.get.mockResolvedValue({ timezone: 'Europe/London' } as never);

    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.getQueryData(qk.profile())).toEqual({ timezone: 'Europe/London' });
  });

  it('caches goals under the registry key', async () => {
    const { client, wrapper } = harness();
    mockGoals.list.mockResolvedValue([{ id: 'g1' }] as never);

    const { result } = renderHook(() => useGoals(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.getQueryData(qk.goals())).toEqual([{ id: 'g1' }]);
  });

  it('surfaces a failure as an error state rather than throwing', async () => {
    const { wrapper } = harness();
    mockGoals.list.mockRejectedValue(new Error('down'));

    const { result } = renderHook(() => useGoals(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('writes', () => {
  it('seeds the profile cache from the response instead of refetching', async () => {
    const { client, wrapper } = harness();
    mockProfile.patch.mockResolvedValue({ timezone: 'Asia/Kolkata' } as never);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });
    await act(async () => { await result.current.mutateAsync({ timezone: 'Asia/Kolkata' }); });

    expect(client.getQueryData(qk.profile())).toEqual({ timezone: 'Asia/Kolkata' });
    expect(mockProfile.get).not.toHaveBeenCalled();
  });

  it('invalidates goals after creating one', async () => {
    const { client, wrapper } = harness();
    mockGoals.create.mockResolvedValue({ id: 'g9' } as never);
    client.setQueryData(qk.goals(), []);

    const { result } = renderHook(() => useCreateGoal(), { wrapper });
    // await the mutation rather than firing and polling: an unawaited mutation
    // outlives the assertion and leaves the Jest worker busy.
    await act(async () => { await result.current.mutateAsync({ goal_type: 'fat_loss' } as never); });

    expect(client.getQueryState(qk.goals())?.isInvalidated).toBe(true);
  });
});
