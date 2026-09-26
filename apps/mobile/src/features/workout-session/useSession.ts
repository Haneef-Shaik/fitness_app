/**
 * The session lifecycle hooks — start, adopt, finish.
 *
 * None of this is on the commit path (**I10**). Starting and finishing are the
 * two moments the logger is *allowed* to wait for the network, because the user
 * is not mid-set for either of them.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SessionFinish, WorkoutSession } from '@fitlog/api-types';
import { api } from '../../lib/api';
import { applyInvalidation } from '../../lib/query/invalidation';
import { qk } from '../../lib/query/queryKeys';
import { staleTimes } from '../../lib/query/client';
import { useSessionStore } from './store/sessionStore';
import { startDraft, type StartDraftInput } from './store/reducers';
import type { SessionDraft } from './store/types';

/** Turns a server session into the local draft shape, sets included. */
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

/**
 * A full draft for a session that already exists server-side — resume, and E-10's
 * "adopt the server session" row.
 *
 * The sets have to come across. A resumed workout that shows nothing logged reads
 * as lost work, which is the single most alarming thing this screen can do.
 */
export function draftWithSetsFromServer(s: WorkoutSession): SessionDraft {
  const base = startDraft(draftFromServer(s));
  return {
    ...base,
    exercises: base.exercises.map((e) => {
      const server = (s.exercises ?? []).find((x) => x.id === e.clientId);
      return {
        ...e,
        notes: server?.notes ?? null,
        skipped: server?.skipped ?? false,
        sets: (server?.sets ?? []).map((set, i) => ({
          // client_id is what the outbox keys on, so a resumed set keeps its
          // identity and a replay stays a no-op (I8).
          clientId: set.client_id ?? set.id,
          setIndex: i,
          setType: set.set_type,
          reps: set.reps ?? null,
          loadKg: set.load_kg ?? null,
          loadUnitEntered: (set.load_unit_entered as 'kg' | 'lb') ?? 'kg',
          durationSeconds: set.duration_seconds ?? null,
          distanceM: set.distance_m ?? null,
          rpe: set.rpe ?? null,
          rir: set.rir ?? null,
          completed: set.completed,
          performedAt: set.performed_at,
          // It came FROM the server, so it is synced by definition.
          syncState: 'synced' as const,
          syncError: null,
        })),
      };
    }),
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
