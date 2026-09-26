/**
 * F-03, F-06 and F-07 render.
 *
 * Each carries one judgement worth pinning:
 *   F-03 marks warm-ups, because they are excluded from volume (I3) and an
 *        unexplained gap between the sets shown and the total reads as a bug.
 *   F-06 shows an absent exercise as "—" and never as 0.
 *   F-07 buckets by `local_date`, which is the user's day (I7 / AC-03).
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 's1', sessions: 's1,s2' }),
}));

const mockSession = {
  data: undefined as unknown,
  isPending: false, isError: false, error: null, refetch: jest.fn(),
};
const mockComparison = {
  data: undefined as unknown,
  isPending: false, isError: false, error: null, refetch: jest.fn(),
};
const mockHistory = {
  data: { pages: [{ data: [] as unknown[], meta: undefined as unknown }] },
  isPending: false, isError: false, isRefetching: false, isFetchingNextPage: false,
  hasNextPage: false, error: null, refetch: jest.fn(), fetchNextPage: jest.fn(),
};

jest.mock('@/features/workout-session/useSession', () => ({
  useSession: () => mockSession,
}));
jest.mock('@/lib/query/hooks', () => ({
  useSessionComparison: () => mockComparison,
  useWorkoutHistory: () => mockHistory,
  flattenHistory: (pages: { data: unknown[] }[] | undefined) =>
    (pages ?? []).flatMap((p) => p.data),
}));

import SessionDetail from '../train/history/[id]';
import Compare from '../train/history/compare';
import HistoryCalendar from '../train/history/calendar';

beforeEach(() => jest.clearAllMocks());

describe('F-03 · session detail', () => {
  it('marks a warm-up, so the volume total is explicable', () => {
    mockSession.data = {
      id: 's1', local_date: '2026-09-18', total_volume_kg: 500, duration_seconds: 3720,
      exercises: [{
        id: 'se1', exercise_name: 'Barbell Bench Press', order_index: 0,
        sets: [
          { id: 'x1', set_type: 'warmup', load_kg: 60, reps: 10, is_pr: false },
          { id: 'x2', set_type: 'working', load_kg: 100, reps: 5, is_pr: true },
        ],
      }],
    };

    render(<SessionDetail />);

    expect(screen.getByText('Barbell Bench Press')).toBeTruthy();
    expect(screen.getByText('warm-up')).toBeTruthy();
    expect(screen.getByText('PR')).toBeTruthy();
  });

  it('says a skipped exercise was skipped rather than showing nothing', () => {
    mockSession.data = {
      id: 's1', local_date: '2026-09-18', total_volume_kg: null, duration_seconds: null,
      exercises: [{ id: 'se1', exercise_name: 'Overhead Press', order_index: 0, sets: [] }],
    };

    render(<SessionDetail />);

    expect(screen.getByText('Skipped')).toBeTruthy();
    expect(screen.getByText('No sets recorded')).toBeTruthy();
  });

  it('shows what E-06 and E-07 recorded: type, effort and every note (G11)', () => {
    mockSession.data = {
      id: 's1', local_date: '2026-09-18', total_volume_kg: 480, duration_seconds: 3720,
      notes: 'Felt strong',
      exercises: [{
        id: 'se1', exercise_name: 'Barbell Bench Press', order_index: 0, notes: 'Seat on 4',
        sets: [
          { id: 'x1', set_type: 'drop', load_kg: 60, reps: 8, rpe: 8, rir: 2, note: 'Grip went', is_pr: false },
        ],
      }],
    };

    render(<SessionDetail />);

    expect(screen.getByText('Felt strong')).toBeTruthy();
    expect(screen.getByText('✎ Seat on 4')).toBeTruthy();
    expect(screen.getByText('drop')).toBeTruthy();
    expect(screen.getByText('RPE 8 · RIR 2')).toBeTruthy();
    expect(screen.getByText('Grip went')).toBeTruthy();
  });
});

describe('F-06 · comparison', () => {
  it('shows an absent exercise as a dash, never as zero', () => {
    // Reading absence as 0 draws a drop to nothing that never happened.
    mockComparison.data = {
      sessions: [
        { id: 's1', local_date: '2026-09-21', started_at: '2026-09-21T10:00:00Z',
          total_volume_kg: 8940, set_count: 21, duration_seconds: 3480 },
        { id: 's2', local_date: '2026-09-16', started_at: '2026-09-16T10:00:00Z',
          total_volume_kg: 8240, set_count: 20, duration_seconds: 3720 },
      ],
      exercises: [{
        exercise_id: 'e1', exercise_name: 'Incline Dumbbell Press',
        per_session: [
          { session_id: 's1' },
          { session_id: 's2', volume_kg: 810, set_count: 3,
            best_set: { load_kg: 30, reps: 10 } },
        ],
      }],
    };

    render(<Compare />);

    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.getByText('not performed')).toBeTruthy();
    expect(screen.getByText('810 kg')).toBeTruthy();
  });

  it('asks for two sessions when there is nothing to compare', () => {
    mockComparison.data = { sessions: [], exercises: [] };

    render(<Compare />);

    expect(screen.getByText('Nothing to compare')).toBeTruthy();
  });
});

describe('F-07 · calendar', () => {
  it('buckets by the local date, not the instant', () => {
    // 2026-09-21T18:40Z is the 22nd in Asia/Kolkata. The row already carries
    // the user's day, and the calendar must use it rather than re-deriving one.
    mockHistory.data = { pages: [{
      data: [{
        id: 's1', local_date: '2026-09-22', started_at: '2026-09-21T18:40:00Z',
        completed_at: '2026-09-21T19:40:00Z', logged_timezone: 'Asia/Kolkata',
        total_volume_kg: 500, duration_seconds: 3600, set_count: 5,
        exercise_names: ['Bench'],
      }],
      meta: { filtered: false, total_unfiltered: 1 },
    }] };

    render(<HistoryCalendar />);

    expect(screen.getByTestId('month-2026-09')).toBeTruthy();
    expect(screen.getByLabelText('2026-09-22, trained')).toBeTruthy();
    expect(screen.getByLabelText('2026-09-21, rest day')).toBeTruthy();
  });
});
