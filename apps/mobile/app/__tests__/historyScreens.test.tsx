/**
 * The two screen behaviours that are criteria rather than polish.
 *
 * **F-05 must say when it widened.** PRD §7.2 makes it part of the normative
 * rule: *"the query widens to `role IN ('primary','secondary')` and the UI
 * states that it widened."* A silently widened answer is a wrong answer
 * presented as a right one — the user asked for their last chest day and got
 * something else without being told.
 *
 * **F-01 must tell filtered-empty from empty (I13).** Both are an empty array
 * and they are opposite messages: one says start training, the other says
 * change the filter.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ muscle: 'chest' }),
}));

const mockPrevious = {
  data: null as unknown,
  isPending: false,
  isError: false,
  error: null,
  refetch: jest.fn(),
};
const mockHistory = {
  data: { pages: [{ data: [] as unknown[], meta: undefined as unknown }] },
  isPending: false,
  isError: false,
  isRefetching: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  error: null,
  refetch: jest.fn(),
  fetchNextPage: jest.fn(),
};

jest.mock('@/lib/query/hooks', () => ({
  usePreviousOccurrence: () => mockPrevious,
  useWorkoutHistory: () => mockHistory,
  useMuscleGroups: () => ({
    data: [{ id: 'm1', slug: 'chest', name: 'Chest' }],
    isPending: false, isError: false, refetch: jest.fn(),
  }),
  flattenHistory: (pages: { data: unknown[] }[] | undefined) =>
    (pages ?? []).flatMap((p) => p.data),
}));

import PreviousOccurrence from '../train/history/previous';
import HistoryList from '../train/history/index';

const occurrence = (over: Record<string, unknown> = {}) => ({
  session_id: 's1',
  completed_at: '2026-09-18T12:00:00Z',
  local_date: '2026-09-18',
  total_volume_kg: 8240,
  duration_seconds: 3720,
  exercise_names: ['Barbell Bench Press'],
  muscle_slug: 'chest',
  muscle_name: 'Chest',
  widened: false,
  role_matched: 'primary',
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPrevious.data = null;
  mockHistory.data = { pages: [{ data: [], meta: undefined }] };
  mockHistory.hasNextPage = false;
});

describe('F-05 · AC-05', () => {
  it('SAYS it widened when no session had the muscle as primary', () => {
    mockPrevious.data = occurrence({ widened: true, role_matched: 'secondary' });

    render(<PreviousOccurrence />);

    expect(screen.getByTestId('widened-notice')).toBeTruthy();
    expect(screen.getByText(/No session had chest as a primary muscle/)).toBeTruthy();
  });

  it('stays quiet when it did not widen', () => {
    // The notice must not be decoration that always shows: a user told "we
    // widened" on a direct hit learns to ignore it, and then misses the case
    // that mattered.
    mockPrevious.data = occurrence({ widened: false, role_matched: 'primary' });

    render(<PreviousOccurrence />);

    expect(screen.queryByTestId('widened-notice')).toBeNull();
  });

  it('names which role actually matched', () => {
    mockPrevious.data = occurrence({ widened: true, role_matched: 'secondary' });

    render(<PreviousOccurrence />);

    expect(screen.getByText(/as a secondary muscle/)).toBeTruthy();
  });

  it('offers a prompt, not an error, when the muscle was never trained', () => {
    mockPrevious.data = null;

    render(<PreviousOccurrence />);

    expect(screen.getByText(/haven't trained chest yet/)).toBeTruthy();
  });
});

describe('F-01 · I13', () => {
  it('says "no workouts yet" when there is genuinely no history', () => {
    mockHistory.data = { pages: [{ data: [], meta: { filtered: false, total_unfiltered: 0 } }] };

    render(<HistoryList />);

    expect(screen.getByText('No workouts yet')).toBeTruthy();
  });

  it('renders the rows it has', () => {
    mockHistory.data = { pages: [{
      data: [{
        id: 's1',
        local_date: new Date().toISOString().slice(0, 10),
        started_at: '2026-09-18T10:00:00Z',
        completed_at: '2026-09-18T11:00:00Z',
        logged_timezone: 'UTC',
        total_volume_kg: 8240,
        duration_seconds: 3720,
        set_count: 20,
        exercise_names: ['Barbell Bench Press'],
      }],
      meta: { filtered: false, total_unfiltered: 1 },
    }] };

    render(<HistoryList />);

    expect(screen.getByText('Barbell Bench Press')).toBeTruthy();
  });
});

describe('F-01 · filtered-empty is not empty (I13)', () => {
  it('says nothing matches, and how much history there actually is', () => {
    // Same empty array, opposite message. "No workouts yet" here would tell a
    // user with seven sessions that they have never trained.
    mockHistory.data = {
      pages: [{ data: [], meta: { filtered: true, total_unfiltered: 7 } }],
    };

    render(<HistoryList />);

    // Apply a filter through the sheet, the way a user reaches this state.
    fireEvent.press(screen.getByLabelText('Filters'));
    fireEvent.press(screen.getByText('Chest'));
    fireEvent.press(screen.getByText('Apply'));

    expect(screen.getByText('Nothing matches that')).toBeTruthy();
    expect(screen.getByText(/You have 7 sessions, just none matching/)).toBeTruthy();
    expect(screen.queryByText('No workouts yet')).toBeNull();
  });
});
