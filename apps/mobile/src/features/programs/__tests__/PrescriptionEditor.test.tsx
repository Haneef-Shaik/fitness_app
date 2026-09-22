/**
 * C-07 renders from the exercise's tracked fields. One named test per shape,
 * because "it works for bench press" is exactly how a plank ends up with a load
 * field and a run ends up with a rep range.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Exercise, PlanExerciseIn } from '@volt/api-types';
import { PrescriptionEditor } from '../PrescriptionEditor';

function exercise(over: Partial<Exercise>): Exercise {
  return {
    id: 'ex-1', name: 'Test', equipment: 'barbell', movement_pattern: null, aliases: [],
    is_custom: false, status: 'active',
    tracks_load: true, tracks_reps: true, tracks_duration: false, tracks_distance: false,
    default_unit: 'kg', muscles: [],
    ...over,
  } as Exercise;
}

const EMPTY: PlanExerciseIn = { exercise_id: 'ex-1', load_unit: 'kg' } as PlanExerciseIn;

function show(ex: Exercise, value: PlanExerciseIn = EMPTY, onSave = jest.fn()) {
  render(
    <PrescriptionEditor
      visible
      onClose={jest.fn()}
      exercise={ex}
      value={value}
      onSave={onSave}
    />,
  );
  return { onSave };
}

describe('C-07 field shapes', () => {
  it('a load+reps exercise offers sets, a rep range and a load', () => {
    show(exercise({ name: 'Barbell Bench Press' }));

    expect(screen.getByTestId('target-sets')).toBeTruthy();
    expect(screen.getByTestId('rep-range')).toBeTruthy();
    expect(screen.getByTestId('target-load')).toBeTruthy();
    expect(screen.queryByTestId('target-duration')).toBeNull();
    expect(screen.queryByTestId('target-distance')).toBeNull();
  });

  it('a bodyweight exercise offers reps but no load', () => {
    // A pull-up has reps and no load to prescribe. Showing "Target load" here
    // invites a number that means nothing.
    show(exercise({ name: 'Pull-Up', equipment: 'bodyweight', tracks_load: false }));

    expect(screen.getByTestId('rep-range')).toBeTruthy();
    expect(screen.queryByTestId('target-load')).toBeNull();
    expect(screen.queryByTestId('target-duration')).toBeNull();
  });

  it('a timed exercise offers a time target and neither reps nor load', () => {
    // A plank is held, not repeated.
    show(exercise({
      name: 'Plank', equipment: 'bodyweight',
      tracks_load: false, tracks_reps: false, tracks_duration: true,
    }));

    expect(screen.getByTestId('target-duration')).toBeTruthy();
    expect(screen.queryByTestId('rep-range')).toBeNull();
    expect(screen.queryByTestId('target-load')).toBeNull();
  });

  it('a distance exercise offers a distance target and neither reps nor load', () => {
    show(exercise({
      name: 'Run', equipment: 'other',
      tracks_load: false, tracks_reps: false, tracks_distance: true,
    }));

    expect(screen.getByTestId('target-distance')).toBeTruthy();
    expect(screen.queryByTestId('rep-range')).toBeNull();
    expect(screen.queryByTestId('target-load')).toBeNull();
  });

  it('sets and rest are offered whatever the exercise tracks', () => {
    // Every shape is still sets-and-rest; that is what makes it a prescription.
    for (const ex of [
      exercise({ tracks_load: false, tracks_reps: false, tracks_duration: true }),
      exercise({ tracks_load: false, tracks_reps: false, tracks_distance: true }),
    ]) {
      const { unmount } = render(
        <PrescriptionEditor visible onClose={jest.fn()} exercise={ex} value={EMPTY} onSave={jest.fn()} />,
      );
      expect(screen.getByTestId('target-sets')).toBeTruthy();
      expect(screen.getByTestId('rest-seconds')).toBeTruthy();
      unmount();
    }
  });
});

describe('C-07 behaviour', () => {
  it('swaps a reversed rep range with a hint rather than blocking', () => {
    const onSave = jest.fn();
    show(exercise({}), { ...EMPTY, target_reps_min: 10, target_reps_max: 6 }, onSave);

    fireEvent.press(screen.getByLabelText('Save'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ target_reps_min: 6, target_reps_max: 10 }),
    );
  });

  it('leaves a correct rep range alone', () => {
    const onSave = jest.fn();
    show(exercise({}), { ...EMPTY, target_reps_min: 6, target_reps_max: 10 }, onSave);

    fireEvent.press(screen.getByLabelText('Save'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ target_reps_min: 6, target_reps_max: 10 }),
    );
  });

  it('steps the set count within 1–20', () => {
    show(exercise({}), { ...EMPTY, target_sets: 20 });
    fireEvent.press(screen.getByLabelText('Increase Target sets'));
    expect(screen.getByTestId('target-sets-value')).toHaveTextContent('20');
  });

  it('shows rest of 0 as "none" rather than 0:00', () => {
    show(exercise({}), { ...EMPTY, rest_seconds: 0 });
    expect(screen.getByTestId('rest-seconds-value')).toHaveTextContent('none');
  });

  it('keeps a blank load blank — "work up" is a valid prescription', () => {
    const onSave = jest.fn();
    show(exercise({}), EMPTY, onSave);
    fireEvent.press(screen.getByLabelText('Save'));
    expect(onSave.mock.calls[0][0].target_load).toBeUndefined();
  });
});
