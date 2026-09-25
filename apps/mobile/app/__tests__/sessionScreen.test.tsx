/**
 * E-02/E-03, the route file itself.
 *
 * It had no tests until G4, and **both of G3's late bugs lived here**: a finish
 * summary computed after the draft had been cleared, and a sync dot that read
 * "Synced" while offline. These cover the first; the second is covered in
 * sessionController.test.ts, where the logic moved.
 */
import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ActiveSession from '../session/[id]';
import { useSessionStore, configurePersistence } from '@/features/workout-session/store/sessionStore';
import { createMemoryStore } from '@/lib/db/memory';

const TRACKS = { load: true, reps: true, duration: false, distance: false };

const mockFinish = jest.fn();
const mockCancel = jest.fn();
const mockServerSession = jest.fn((_id: string): unknown => undefined);
const mockFromServer = jest.fn();

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
  useSession: (id: string) => ({
    data: id ? mockServerSession(id) : undefined,
    isPending: false, isError: false, error: null, refetch: jest.fn(),
  }),
  useFinishSession: () => mockFinish,
  useCancelSession: () => mockCancel,
  draftWithSetsFromServer: (s: unknown) => mockFromServer(s),
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
  mockServerSession.mockImplementation(() => undefined);
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

describe('a finished workout stays finished', () => {
  it('does not adopt the completed session back as an open draft', async () => {
    // G10's TalkBack session: finishing cleared the draft while the summary
    // was up, the screen fetched its session — now COMPLETED — and adopted it
    // as open. The active-session bar then offered to resume a finished workout.
    seed(3);
    mockServerSession.mockImplementation((id) => ({ id, status: 'completed', exercises: [] }));

    render(<ActiveSession />);
    fireEvent.press(screen.getByTestId('finish-workout'));
    await waitFor(() => expect(screen.getByTestId('finish-summary')).toBeTruthy());

    expect(mockFromServer).not.toHaveBeenCalled();
    expect(useSessionStore.getState().draft).toBeNull();
  });

  it('still adopts an open session this phone has no draft for', () => {
    // Resume from another device, a deep link or a reload.
    mockServerSession.mockImplementation((id) => ({ id, status: 'in_progress', exercises: [] }));
    mockFromServer.mockReturnValue(null);

    render(<ActiveSession />);

    expect(mockFromServer).toHaveBeenCalledWith(expect.objectContaining({ status: 'in_progress' }));
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

  it('the exercise switcher is a named stop with room for the focus ring (a11y #17)', () => {
    // Android makes a horizontal ScrollView a keyboard stop of its own; it had
    // no name, and it clipped the 2 px ring + 2 px offset of the tab in focus.
    seed(1);
    render(<ActiveSession />);
    const scroller = screen.getByTestId('exercise-switcher');
    expect(scroller.props.accessibilityLabel).toBe('Exercises in this workout');
    expect(scroller.props.contentContainerStyle).toMatchObject({ padding: 4 });
  });

  it('reads each set row as ONE stop, sync state included (TalkBack session)', () => {
    // Labelled but not a group, the row was read and then every child again:
    // six swipes per set. The figures are one accessible element now.
    seed(1);
    render(<ActiveSession />);
    const row = screen.getByLabelText('Set 1, 80 kilograms for 8 reps. Waiting to sync');
    expect(row.props.accessible).toBe(true);
    // Delete stays its own stop, outside the group.
    expect(screen.getByLabelText('Delete set 1')).toBeTruthy();
  });

  it('says a set was saved — the new row and the renumbered button are silent', () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
    seed(1);
    render(<ActiveSession />);
    fireEvent.press(screen.getByText('Save set 2'));
    expect(announce).toHaveBeenCalledWith('Set 2 saved: 80 kilograms for 8 reps');
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

describe('the entry stays in reach (G10)', () => {
  // Each set lands above the entry, so Save walked down the screen one row per
  // set; by set 17 it was below the fold (seen on the phone and in the p95 run).
  it('scrolls to keep the entry in view after a set is saved — and only then', () => {
    const { ScrollView } = jest.requireActual('react-native');
    const toEnd = jest.spyOn(ScrollView.prototype, 'scrollToEnd').mockImplementation(() => {});
    seed(1);
    render(<ActiveSession />);
    expect(toEnd).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Save set 2'));
    expect(toEnd).toHaveBeenCalledTimes(1);
    toEnd.mockRestore();
  });
});
