/**
 * E-03's entry controls. The field shapes mirror C-07's, deliberately: both read
 * `tracks_*`, so a plank never gets a load field in either the plan or the log.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Exercise } from '@volt/api-types';
import { LOGGER_TARGET, SetEntry, type SetEntryValue } from '../SetEntry';

const EMPTY: SetEntryValue = {
  reps: null, loadKg: null, durationSeconds: null, distanceM: null, setType: 'working',
};

const ex = (over: Partial<Exercise> = {}) => ({
  tracks_load: true, tracks_reps: true, tracks_duration: false, tracks_distance: false,
  default_unit: 'kg', ...over,
} as Exercise);

function show(exercise: Exercise, value: SetEntryValue = EMPTY) {
  const onChange = jest.fn();
  const onCommit = jest.fn();
  render(
    <SetEntry exercise={exercise} value={value} onChange={onChange} onCommit={onCommit} />,
  );
  return { onChange, onCommit };
}

describe('fields follow the exercise, not a fixed form', () => {
  it('a load+reps lift offers load and reps', () => {
    show(ex());
    expect(screen.getByTestId('entry-load')).toBeTruthy();
    expect(screen.getByTestId('entry-reps')).toBeTruthy();
    expect(screen.queryByTestId('entry-duration')).toBeNull();
  });

  it('a bodyweight exercise offers reps but no load', () => {
    show(ex({ tracks_load: false }));
    expect(screen.getByTestId('entry-reps')).toBeTruthy();
    expect(screen.queryByTestId('entry-load')).toBeNull();
  });

  it('a timed hold offers time and neither reps nor load', () => {
    show(ex({ tracks_load: false, tracks_reps: false, tracks_duration: true }));
    expect(screen.getByTestId('entry-duration')).toBeTruthy();
    expect(screen.queryByTestId('entry-reps')).toBeNull();
    expect(screen.queryByTestId('entry-load')).toBeNull();
  });

  it('cardio offers time and distance', () => {
    show(ex({ tracks_load: false, tracks_reps: false, tracks_duration: true, tracks_distance: true }));
    expect(screen.getByTestId('entry-duration')).toBeTruthy();
    expect(screen.getByTestId('entry-distance')).toBeTruthy();
  });

  it('a weighted carry offers load and distance', () => {
    show(ex({ tracks_reps: false, tracks_distance: true }));
    expect(screen.getByTestId('entry-load')).toBeTruthy();
    expect(screen.getByTestId('entry-distance')).toBeTruthy();
    expect(screen.queryByTestId('entry-reps')).toBeNull();
  });
});

describe('the controls are sized for a hand mid-workout', () => {
  it('the commit button meets the 56 px logger target', () => {
    // docs/05 — 56 px in the logger, not the 44 px used elsewhere.
    show(ex());
    const commit = screen.getByTestId('entry-commit');
    const style = Array.isArray(commit.props.style)
      ? Object.assign({}, ...commit.props.style.filter(Boolean))
      : commit.props.style;
    expect(style.minHeight).toBeGreaterThanOrEqual(LOGGER_TARGET);
  });
});

describe('entry behaviour', () => {
  it('steppers move load by 2.5 and reps by 1', () => {
    const { onChange } = show(ex(), { ...EMPTY, loadKg: 60, reps: 8 });

    fireEvent.press(screen.getByTestId('entry-load-inc'));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ loadKg: 62.5 }));

    fireEvent.press(screen.getByTestId('entry-reps-inc'));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ reps: 9 }));
  });

  it('never steps reps below 1 — a set of zero reps is not a set', () => {
    const { onChange } = show(ex(), { ...EMPTY, reps: 1 });
    fireEvent.press(screen.getByTestId('entry-reps-dec'));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ reps: 1 }));
  });

  it('never steps load below zero', () => {
    const { onChange } = show(ex(), { ...EMPTY, loadKg: 0 });
    fireEvent.press(screen.getByTestId('entry-load-dec'));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ loadKg: 0 }));
  });

  it('accepts a comma as a decimal separator', () => {
    const { onChange } = show(ex());
    fireEvent.changeText(screen.getByTestId('entry-load-input'), '62,5');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ loadKg: 62.5 }));
  });

  it('clearing a field means empty, not zero', () => {
    const { onChange } = show(ex(), { ...EMPTY, loadKg: 60 });
    fireEvent.changeText(screen.getByTestId('entry-load-input'), '');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ loadKg: null }));
  });

  it('toggles a set to a warm-up', () => {
    const { onChange } = show(ex());
    fireEvent.press(screen.getByTestId('entry-warmup'));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ setType: 'warmup' }));
  });

  it('shows a validation error inline, never as a modal', () => {
    render(
      <SetEntry
        exercise={ex()} value={EMPTY} onChange={jest.fn()} onCommit={jest.fn()}
        error="Add reps, time or distance to save this set."
      />,
    );
    expect(screen.getByTestId('entry-error')).toBeTruthy();
  });
});
