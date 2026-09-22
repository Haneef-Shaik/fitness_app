/**
 * Typed reads and writes, keyed from ./queryKeys and invalidated through
 * ./invalidation. Screens call these; no screen builds a query key, sets a
 * staleTime, or decides what to invalidate on its own.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Goal, GoalIn, Profile, ProfilePatch } from '@volt/api-types';
import { goalsApi, profileApi } from '../api';
import { staleTimes } from './client';
import { applyInvalidation } from './invalidation';
import { qk } from './queryKeys';

export function useProfile() {
  return useQuery<Profile>({
    queryKey: qk.profile(),
    queryFn: () => profileApi.get(),
    staleTime: staleTimes.profile,
  });
}

export function useGoals() {
  return useQuery<Goal[]>({
    queryKey: qk.goals(),
    queryFn: () => goalsApi.list(),
    staleTime: staleTimes.goals,
  });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => profileApi.patch(patch),
    onSuccess: (profile) => {
      // The response is the new profile, so seed the cache rather than refetch it.
      client.setQueryData(qk.profile(), profile);
      return applyInvalidation(client, 'profile.updated');
    },
  });
}

export function useCreateGoal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (goal: GoalIn) => goalsApi.create(goal),
    onSuccess: (goal) => applyInvalidation(client, 'goal.changed', { goalId: goal.id }),
  });
}
