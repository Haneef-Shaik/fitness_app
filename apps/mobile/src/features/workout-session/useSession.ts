/**
 * The session lifecycle hooks — start, adopt, finish.
 *
 * None of this is on the commit path (**I10**). Starting and finishing are the
 * two moments the logger is *allowed* to wait for the network, because the user
 * is not mid-set for either of them.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SessionFinish, WorkoutSession } from '@volt/api-types';
import { api } from '../../lib/api';
import { applyInvalidation } from '../../lib/query/invalidation';
import { qk } from '../../lib/query/queryKeys';
import { staleTimes } from '../../lib/query/client';
import { useSessionStore } from './store/sessionStore';
import type { StartDraftInput } from './store/reducers';

/** Turns a server session into the local draft shape. */
export function draftFromServer(s: WorkoutSession): StartDraftInput {
  return {
    sessionId: s.id,
    startedAt: s.started_at,
    planDayId: s.plan_day_id ?? null,
    notes: s.notes ?? null,
    exercises: (s.exercises ?? []).map((e) => ({
      clientId: e.id,
      sessionExerciseId: e.id,
      exerciseId: e.exercise_id,
      exerciseName: e.exercise_name ?? null,
      targetSnapshot: (e.target_snapshot as Record<string, unknown> | null) ?? null,
      // The logger reads the FROZEN snapshot (I1); tracked fields come from the
      // catalog and are filled in by the screen.
      tracks: { load: true, reps: true, duration: false, distance: false },
    })),
  };
}

export function useActiveSession() {
  return useQuery<WorkoutSession | null>({
    queryKey: qk.activeSession(),
    queryFn: () => api.get<WorkoutSession | null>('/workout-sessions/active'),
    staleTime: staleTimes.activeSession,
  });
}

export function useSession(id: string) {
  return useQuery<WorkoutSession>({
    queryKey: qk.session(id),
    queryFn: () => api.get<WorkoutSession>(`/workout-sessions/${id}`),
    staleTime: staleTimes.activeSession,
    enabled: Boolean(id),
  });
}

export function useStartSession() {
  const client = useQueryClient();
  return async (body: Record<string, unknown>): Promise<WorkoutSession> => {
    const session = await api.post<WorkoutSession>('/workout-sessions', body);
    useSessionStore.getState().start(draftFromServer(session));
    await applyInvalidation(client, 'session.started');
    return session;
  };
}

export function useFinishSession() {
  const client = useQueryClient();
  return async (sessionId: string): Promise<SessionFinish> => {
    const result = await api.post<SessionFinish>(`/workout-sessions/${sessionId}/finish`, {});
    useSessionStore.getState().discard();
    await applyInvalidation(client, 'session.finished', { sessionId });
    return result;
  };
}

export function useCancelSession() {
  const client = useQueryClient();
  return async (sessionId: string): Promise<void> => {
    await api.post(`/workout-sessions/${sessionId}/cancel`, {});
    useSessionStore.getState().discard();
    await applyInvalidation(client, 'session.lifecycleChanged', { sessionId });
  };
}
