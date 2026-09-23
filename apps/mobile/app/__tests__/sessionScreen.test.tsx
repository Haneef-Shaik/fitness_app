/**
 * E-02/E-03, the route file itself.
 *
 * It had no tests until G4, and **both of G3's late bugs lived here**: a finish
 * summary computed after the draft had been cleared, and a sync dot that read
 * "Synced" while offline. These cover the first; the second is covered in
 * sessionController.test.ts, where the logic moved.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ActiveSession from '../session/[id]';
import { useSessionStore, configurePersistence } from '@/features/workout-session/store/sessionStore';
import { createMemoryStore } from '@/lib/db/memory';

const TRACKS = { load: true, reps: true, duration: false, distance: false };

const mockFinish = jest.fn();
const mockCancel = jest.fn();

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 's1' }),
}));

jest.mock('@/lib/query/hooks', () => ({
  useExercises: () => ({ data: [], isPending: false, isError: false, error: null, refetch: jest.fn() }),
  usePreviousPerformance: () => ({
    data: null, isPending: false, isError: false, error: null, refetch: jest.fn(),
  }),
  useMuscleGroups: () => ({ data: [], isPending: false, isError: false, error: null, refetch: jest.fn() }),
}));

jest.mock('@/features/workout-session/useSession', () => ({
  useSession: () => ({ data: undefined, isPending: false, isError: false, error: null, refetch: jest.fn() }),
  useFinishSession: () => mockFinish,
  useCancelSession: () => mockCancel,
  draftWithSetsFromServer: jest.fn(),
}));

jest.mock('@/features/workout-session/sessionController', () => ({
  flushAndReconcile: jest.fn(async () => {}),
  outbox: { flush: jest.fn(), status: jest.fn(async () => ({ pending: 0, failed: [] })) },
}));

function seed(setCount: number) {
  useSessionStore.getState().start({
    sessionId: 's1',
    startedAt: '2026-09-22T10:00:00Z',
    exercises: [{
      clientId: 'x1', exerciseId: 'e1', exerciseName: 'Bench',
      sessionExerciseId: 'se1', tracks: TRACKS,
    }],
  });
  for (let i = 0; i < setCount; i++) {
    useSessionStore.getState().commitSet('x1', {
      clientId: `0000000${i}-0000-4000-8000-00000000000${i}`, reps: 8, loadKg: 80,
    });
  }
}

beforeEach(async () => {
  jest.clearAllMocks();
  const store = createMemoryStore('user-1');
  await store.open();
  configurePersistence({ store });
  useSessionStore.setState({ draft: null, recoveryCandidate: null });
  // Faithful to the real hook: useFinishSession CLEARS the draft. A mock that
  // does not clear it makes the summary-after-finish bug invisible — which it
  // did, until reintroducing the bug produced no failure at all.
  mockFinish.mockImplementation(async () => {
    useSessionStore.getState().discard();
    return { records: [] };
  });
});

afterEach(() => configurePersistence(null));

describe('E-08 is computed from the draft as it was at finish', () => {
  it('reports every set, not whatever survives clearing the draft', async () => {
    // The bug: finish() clears the draft, and the summary was read afterwards —
    // so a 6-set workout reported 3 sets and half the volume.
    seed(6);

    render(<ActiveSession />);
    fireEvent.press(screen.getByTestId('finish-workout'));

    await waitFor(() => expect(screen.getByTestId('finish-summary')).toBeTruthy());

    expect(screen.getByText('6')).toBeTruthy();            // sets
    // Twice: the session total and the per-exercise line. Both must agree, and
    // both were wrong before the summary was snapshotted.
    expect(screen.getAllByText('3,840 kg')).toHaveLength(2);   // 6 x 80 x 8
  });

  it('still summarises correctly for a single set', async () => {
    seed(1);

    render(<ActiveSession />);
    fireEvent.press(screen.getByTestId('finish-workout'));

    await waitFor(() => expect(screen.getByTestId('finish-summary')).toBeTruthy());
    expect(screen.getAllByText('640 kg')).toHaveLength(2);  // total and exercise
  });
});

describe('the session screen', () => {
  it('says so plainly when there is no workout in progress', () => {
    render(<ActiveSession />);
    expect(screen.getByText('No workout in progress.')).toBeTruthy();
  });

  it('shows the committed sets with their contribution', () => {
    seed(2);
    render(<ActiveSession />);

    expect(screen.getByTestId('today-sets')).toBeTruthy();
    expect(screen.getAllByText('640 kg')).toHaveLength(2);
  });

  it('labels each set row for a screen reader', () => {
    seed(1);
    render(<ActiveSession />);
    expect(screen.getByLabelText('Set 1, 80 kilograms for 8 reps')).toBeTruthy();
  });

  it('deletes a set and re-densifies what is left', () => {
    seed(3);
    render(<ActiveSession />);

    fireEvent.press(screen.getByLabelText('Delete set 2'));

    const sets = useSessionStore.getState().draft!.exercises[0]!.sets;
    expect(sets).toHaveLength(2);
    expect(sets.map((s) => s.setIndex)).toEqual([0, 1]);
  });

  it('names the exact count when discarding', () => {
    seed(4);
    render(<ActiveSession />);

    fireEvent.press(screen.getByLabelText('Discard workout'));

    expect(screen.getByText(/1 exercise and 4 sets will be lost/)).toBeTruthy();
  });
});
