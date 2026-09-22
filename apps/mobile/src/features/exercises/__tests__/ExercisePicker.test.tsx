/**
 * C-06 · Exercise Picker (H2.2).
 *
 * The selection is CONTROLLED. G3 reuses this sheet for the logger's add and swap,
 * where the selection belongs to the session draft — so these tests drive it the
 * way the logger will, through props rather than through internal mockState.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ExercisePicker } from '../ExercisePicker';

const EXERCISES = [
  { id: 'e1', name: 'Barbell Bench Press', equipment: 'barbell', muscles: [
    { id: 'm1', slug: 'chest', name: 'Chest', role: 'primary' },
  ] },
  { id: 'e2', name: 'Dumbbell Bench Press', equipment: 'dumbbell', muscles: [] },
  { id: 'e3', name: 'Cable Fly', equipment: 'cable', muscles: [] },
];

const mockState = {
  exercises: { data: EXERCISES, isPending: false, isError: false, error: null, refetch: jest.fn() },
  groups: { data: [{ id: 'g1', slug: 'chest', name: 'Chest', parent_id: null, sort_order: 0 }] },
};

jest.mock('../../../lib/query/hooks', () => ({
  useExercises: () => mockState.exercises,
  useMuscleGroups: () => mockState.groups,
}));

function show(props: Partial<React.ComponentProps<typeof ExercisePicker>> = {}) {
  const onChange = jest.fn();
  const onCommit = jest.fn();
  const utils = render(
    <ExercisePicker
      visible
      onClose={jest.fn()}
      selected={[]}
      onChange={onChange}
      onCommit={onCommit}
      {...props}
    />,
  );
  return { onChange, onCommit, ...utils };
}

beforeEach(() => {
  mockState.exercises = {
    data: EXERCISES, isPending: false, isError: false, error: null, refetch: jest.fn(),
  } as never;
});

describe('multi-select', () => {
  it('reports a pick to the caller rather than keeping it', () => {
    const { onChange } = show({ selected: [] });
    fireEvent.press(screen.getByLabelText(/Barbell Bench Press/));
    expect(onChange).toHaveBeenCalledWith(['e1']);
  });

  it('appends in pick order, because the plan day uses that order', () => {
    const { onChange } = show({ selected: ['e3'] });
    fireEvent.press(screen.getByLabelText(/Barbell Bench Press/));
    expect(onChange).toHaveBeenCalledWith(['e3', 'e1']);
  });

  it('deselects an already-selected row', () => {
    const { onChange } = show({ selected: ['e1', 'e2'] });
    fireEvent.press(screen.getByLabelText(/Barbell Bench Press/));
    expect(onChange).toHaveBeenCalledWith(['e2']);
  });

  it('reflects the caller\'s selection rather than its own', () => {
    show({ selected: ['e2'] });
    expect(screen.getByLabelText(/Dumbbell Bench Press/).props.accessibilityState.checked).toBe(true);
    expect(screen.getByLabelText(/Barbell Bench Press/).props.accessibilityState.checked).toBe(false);
  });

  it('max=1 replaces the selection — the logger\'s swap', () => {
    const { onChange } = show({ selected: ['e1'], max: 1 });
    fireEvent.press(screen.getByLabelText(/Cable Fly/));
    expect(onChange).toHaveBeenCalledWith(['e3']);
  });

  it('commits the selection to the caller', () => {
    const { onCommit } = show({ selected: ['e1', 'e2'] });
    fireEvent.press(screen.getByLabelText('Add 2'));
    expect(onCommit).toHaveBeenCalledWith(['e1', 'e2']);
  });

  it('cannot commit an empty selection', () => {
    const { onCommit } = show({ selected: [] });
    fireEvent.press(screen.getByLabelText('Add'));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('hints that an exercise is already in the day without blocking it', () => {
    // Bench heavy then bench light is a real plan, so this is a hint, not a rule.
    show({ selected: [], alreadyPresent: ['e1'] });
    expect(screen.getByLabelText(/Barbell Bench Press.*already in this day/)).toBeTruthy();
  });
});

describe('filtered-empty (I13)', () => {
  it('offers a way out of the filter instead of "you have no exercises"', () => {
    mockState.exercises = {
      data: [], isPending: false, isError: false, error: null, refetch: jest.fn(),
    } as never;

    show({ selected: [] });
    fireEvent.changeText(screen.getByTestId('picker-search'), 'zzzz');

    expect(screen.queryByText('No exercises yet')).toBeNull();
    expect(screen.getByText('Clear filters')).toBeTruthy();
    expect(screen.getByText(/zzzz/)).toBeTruthy();
  });

  it('shows the genuinely-empty copy when nothing is filtered', () => {
    mockState.exercises = {
      data: [], isPending: false, isError: false, error: null, refetch: jest.fn(),
    } as never;

    show({ selected: [] });

    expect(screen.getByText('No exercises yet')).toBeTruthy();
    expect(screen.queryByText('Clear filters')).toBeNull();
  });

  it('offers "create" from the search text when nothing matches', () => {
    mockState.exercises = {
      data: [], isPending: false, isError: false, error: null, refetch: jest.fn(),
    } as never;
    const onCreate = jest.fn();

    show({ selected: [], allowCreate: true, onCreate });
    fireEvent.changeText(screen.getByTestId('picker-search'), 'sissy squat');
    fireEvent.press(screen.getByText(/Create "sissy squat"/));

    expect(onCreate).toHaveBeenCalledWith('sissy squat');
  });
});
