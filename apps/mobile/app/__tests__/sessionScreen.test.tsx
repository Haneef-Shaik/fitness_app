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
  useProfile: () => ({ data: mockProfile() }),
}));

const mockProfile = jest.fn((): unknown => undefined);

jest.mock('@/features/workout-session/useSession', () => ({
  useSession: (id: string) => ({
    data: id ? mockServerSession(id) : undefined,
    isPending: false, isError: false, error: null, refetch: jest.fn(),
  }),
  useFinishSession: () => mockFinish,
  useCancelSession: () => mockCancel,
  draftWithSetsFromServer: (s: unknown) => mockFromServer(s),
}));

const mockUnsent = jest.fn(async (_id: string) => 0);

jest.mock('@/features/workout-session/sessionController', () => ({
  flushAndReconcile: jest.fn(async () => {}),
  unsentFor: (id: string) => mockUnsent(id),
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
  mockUnsent.mockImplementation(async () => 0);
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

describe('a commit renders one row, not the list (D16)', () => {
  // G11 gave each row an inline onEdit, so React.memo never held and every
  // commit re-rendered every row: the phone's p95 went from 67.4 ms (G10) to
  // 164.6 ms over 100 sets. Each row render names itself once, so the labels
  // counted here are the rows that rendered.
  it('saving set 21 renders only set 21', () => {
    const a11y = require('@/features/workout-session/a11y');
    seed(20);
    render(<ActiveSession />);
    const label = jest.spyOn(a11y, 'setRowLabel');

    fireEvent.press(screen.getByText('Save set 21'));

    const rendered = label.mock.calls.map(([set]) => (set as { setIndex: number }).setIndex);
    expect(rendered.length).toBeGreaterThan(0);
    expect(new Set(rendered)).toEqual(new Set([20]));
    label.mockRestore();
  });
});

describe('finishing waits for every queued change (G11)', () => {
  it('does not finish while changes are still waiting to upload', async () => {
    // The server closes the workout on finish and then refuses the sets still
    // in the queue — so the last sets of an offline workout were lost.
    seed(2);
    mockUnsent.mockImplementation(async () => 2);

    render(<ActiveSession />);
    fireEvent.press(screen.getByTestId('finish-workout'));

    await waitFor(() => expect(screen.getByTestId('finish-error')).toBeTruthy());
    expect(mockFinish).not.toHaveBeenCalled();
    expect(screen.getByText(/2 changes still waiting to upload/)).toBeTruthy();
    expect(useSessionStore.getState().draft).not.toBeNull();
  });

  it('says so, and keeps the workout open, when finishing fails', async () => {
    seed(1);
    mockFinish.mockImplementation(async () => { throw new Error('The server is busy. Try again.'); });

    render(<ActiveSession />);
    fireEvent.press(screen.getByTestId('finish-workout'));

    await waitFor(() => expect(screen.getByText('The server is busy. Try again.')).toBeTruthy());
    expect(useSessionStore.getState().draft).not.toBeNull();
  });
});

describe('E-06 · the advanced set editor', () => {
  it('shapes the next set: type, RPE and a note travel with it', async () => {
    seed(0);
    render(<ActiveSession />);

    fireEvent.press(screen.getByTestId('entry-more'));
    fireEvent.press(screen.getByTestId('advanced-type-failure'));
    fireEvent.press(screen.getByTestId('advanced-rpe-inc'));   // 0 → 0.5
    fireEvent.changeText(screen.getByTestId('advanced-note'), 'Grip went');
    fireEvent.press(screen.getByTestId('advanced-done'));

    fireEvent.changeText(screen.getByTestId('entry-load-input'), '80');
    fireEvent.changeText(screen.getByTestId('entry-reps-input'), '6');
    fireEvent.press(screen.getByTestId('entry-commit'));

    const set = useSessionStore.getState().draft!.exercises[0]!.sets[0]!;
    expect(set).toMatchObject({ setType: 'failure', rpe: 0.5, rir: 9.5, note: 'Grip went' });
  });

  it('effort never carries over to the set after', async () => {
    seed(0);
    render(<ActiveSession />);

    fireEvent.press(screen.getByTestId('entry-more'));
    fireEvent.press(screen.getByTestId('advanced-rpe-inc'));
    fireEvent.press(screen.getByTestId('advanced-done'));
    fireEvent.changeText(screen.getByTestId('entry-reps-input'), '6');
    fireEvent.press(screen.getByTestId('entry-commit'));
    fireEvent.press(screen.getByTestId('entry-commit'));

    const sets = useSessionStore.getState().draft!.exercises[0]!.sets;
    expect(sets[0]!.rpe).toBe(0.5);
    expect(sets[1]!.rpe).toBeNull();
  });

  it('edits a committed set from its row', async () => {
    seed(1);
    render(<ActiveSession />);

    fireEvent.press(screen.getByTestId('set-row-0'));
    fireEvent.press(screen.getByTestId('advanced-type-drop'));
    fireEvent.press(screen.getByTestId('advanced-done'));

    expect(useSessionStore.getState().draft!.exercises[0]!.sets[0]!.setType).toBe('drop');
    expect(screen.getByText('D')).toBeTruthy();
  });

  it('deletes a committed set from its row', async () => {
    seed(2);
    render(<ActiveSession />);

    fireEvent.press(screen.getByTestId('set-row-1'));
    fireEvent.press(screen.getByTestId('advanced-delete'));

    expect(useSessionStore.getState().draft!.exercises[0]!.sets).toHaveLength(1);
  });
});

describe('E-07 · notes', () => {
  it('a quick tag becomes the workout note', async () => {
    seed(0);
    render(<ActiveSession />);

    fireEvent.press(screen.getByTestId('session-notes'));
    fireEvent.press(screen.getByTestId('notes-tag-felt-strong'));
    fireEvent.press(screen.getByTestId('notes-done'));

    expect(useSessionStore.getState().draft!.notes).toBe('Felt strong');
  });

  it('an exercise note is kept on the exercise', async () => {
    seed(0);
    render(<ActiveSession />);

    fireEvent.press(screen.getByTestId('exercise-notes'));
    fireEvent.changeText(screen.getByTestId('notes-input'), 'Seat on 4');
    fireEvent.press(screen.getByTestId('notes-done'));

    expect(useSessionStore.getState().draft!.exercises[0]!.notes).toBe('Seat on 4');
  });
});

describe('K-04 preferences reach the logger', () => {
  afterEach(() => mockProfile.mockImplementation(() => undefined));

  it('shows RPE on the logger when asked, and it travels with the set', () => {
    mockProfile.mockImplementation(() => ({ show_rpe: true }));
    seed(0);
    render(<ActiveSession />);

    fireEvent.press(screen.getByTestId('entry-rpe-inc'));
    fireEvent.changeText(screen.getByTestId('entry-reps-input'), '5');
    fireEvent.press(screen.getByTestId('entry-commit'));

    expect(useSessionStore.getState().draft!.exercises[0]!.sets[0]!.rpe).toBe(0.5);
  });

  it('keeps RPE off the logger by default', () => {
    seed(0);
    render(<ActiveSession />);
    expect(screen.queryByTestId('entry-rpe')).toBeNull();
  });

  it('starts the default rest when the plan sets none', () => {
    mockProfile.mockImplementation(() => ({ default_rest_seconds: 90 }));
    seed(0);
    render(<ActiveSession />);

    fireEvent.changeText(screen.getByTestId('entry-reps-input'), '5');
    fireEvent.press(screen.getByTestId('entry-commit'));

    expect(screen.getByTestId('rest-timer')).toBeTruthy();
  });

  it('counts warm-ups in the finish summary when the user does', async () => {
    mockProfile.mockImplementation(() => ({ warmups_in_volume: true }));
    seed(0);
    useSessionStore.getState().commitSet('x1', {
      clientId: '0000000a-0000-4000-8000-00000000000a', reps: 10, loadKg: 40, setType: 'warmup',
    });
    render(<ActiveSession />);
    fireEvent.press(screen.getByTestId('finish-workout'));

    await waitFor(() => expect(screen.getByTestId('finish-summary')).toBeTruthy());
    expect(screen.getAllByText('400 kg')).toHaveLength(2);
  });

  it('E-12 · the plate calculator loads the bar for the entered weight', () => {
    seed(0);
    render(<ActiveSession />);

    fireEvent.changeText(screen.getByTestId('entry-load-input'), '100');
    fireEvent.press(screen.getByTestId('entry-plates'));

    expect(screen.getByTestId('plate-per-side').props.children).toBe('25 · 15');
    expect(screen.getByTestId('plate-exact')).toBeTruthy();
  });

  it('E-12 · offers the nearest load when the exact one cannot be made', () => {
    seed(0);
    render(<ActiveSession />);

    fireEvent.changeText(screen.getByTestId('entry-load-input'), '101');
    fireEvent.press(screen.getByTestId('entry-plates'));
    fireEvent.press(screen.getByTestId('plate-use'));

    expect(screen.getByTestId('entry-load-input').props.value).toBe('100');
  });
});

describe('changing the plan mid-workout (BRD 5.1)', () => {
  function seedTwo() {
    seed(0);
    useSessionStore.getState().addExercise({
      clientId: '5a5a5a5a-0000-4000-8000-00000000000b', exerciseId: 'e2', exerciseName: 'Row', tracks: TRACKS,
    });
  }

  it('skips an exercise and keeps what was logged', () => {
    seed(2);
    render(<ActiveSession />);
    fireEvent.press(screen.getByTestId('exercise-options'));
    fireEvent.press(screen.getByTestId('menu-skip'));

    const ex = useSessionStore.getState().draft!.exercises[0]!;
    expect(ex.skipped).toBe(true);
    expect(ex.sets).toHaveLength(2);
  });

  it('moves an exercise later and stays on it', () => {
    seedTwo();
    render(<ActiveSession />);
    fireEvent.press(screen.getByTestId('exercise-options'));
    fireEvent.press(screen.getByTestId('menu-later'));

    expect(useSessionStore.getState().draft!.exercises.map((e) => e.exerciseName)).toEqual(['Row', 'Bench']);
  });

  it('asks before removing an exercise with sets, naming them', () => {
    seed(3);
    render(<ActiveSession />);
    fireEvent.press(screen.getByTestId('exercise-options'));
    fireEvent.press(screen.getByTestId('menu-remove'));

    expect(screen.getByText('Remove Bench and its 3 sets from this workout?')).toBeTruthy();
    fireEvent.press(screen.getByTestId('remove-yes'));
    expect(useSessionStore.getState().draft!.exercises).toHaveLength(0);
  });

  it('offers swap only while nothing is logged', () => {
    seed(1);
    render(<ActiveSession />);
    fireEvent.press(screen.getByTestId('exercise-options'));
    expect(screen.getByTestId('menu-swap').props.accessibilityState).toMatchObject({ disabled: true });
  });
});

describe('E-13 · supersets in the logger', () => {
  afterEach(() => mockProfile.mockImplementation(() => undefined));

  function seedSuperset() {
    useSessionStore.getState().start({
      sessionId: 's1',
      startedAt: '2026-09-22T10:00:00Z',
      exercises: [
        { clientId: 'x1', exerciseId: 'e1', exerciseName: 'Curl', sessionExerciseId: 'se1', supersetGroup: 1, tracks: TRACKS },
        { clientId: 'x2', exerciseId: 'e2', exerciseName: 'Pushdown', sessionExerciseId: 'se2', supersetGroup: 1, tracks: TRACKS },
      ],
    });
  }

  it('moves to the partner after a set and rests only after the round', () => {
    mockProfile.mockImplementation(() => ({ default_rest_seconds: 90 }));
    seedSuperset();
    render(<ActiveSession />);
    expect(screen.getByText('Superset A · 1 of 2')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('entry-reps-input'), '10');
    fireEvent.press(screen.getByTestId('entry-commit'));

    expect(screen.getByText('Superset A · 2 of 2')).toBeTruthy();
    expect(screen.queryByTestId('rest-timer')).toBeNull();

    fireEvent.changeText(screen.getByTestId('entry-reps-input'), '12');
    fireEvent.press(screen.getByTestId('entry-commit'));

    expect(screen.getByText('Superset A · 1 of 2')).toBeTruthy();
    expect(screen.getByTestId('rest-timer')).toBeTruthy();
  });

  it('two exercises can be made a superset mid-workout', () => {
    seed(0);
    useSessionStore.getState().addExercise({
      clientId: '5a5a5a5a-0000-4000-8000-00000000000c', exerciseId: 'e2', exerciseName: 'Row', tracks: TRACKS,
    });
    render(<ActiveSession />);
    fireEvent.press(screen.getByTestId('exercise-options'));
    fireEvent.press(screen.getByTestId('menu-superset'));

    const groups = useSessionStore.getState().draft!.exercises.map((e) => e.supersetGroup);
    expect(groups[0]).toBe(groups[1]);
    expect(groups[0]).not.toBeNull();
  });
});
