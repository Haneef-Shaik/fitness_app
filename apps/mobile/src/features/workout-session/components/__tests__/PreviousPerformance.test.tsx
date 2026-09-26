/**
 * **AC-04** — "the previous-performance strip shows the prior session's sets
 * before any input". Every state of it, because the one that is easiest to get
 * wrong is the one a new user sees for every exercise.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { PreviousPerformance } from '@fitlog/api-types';
import { PreviousPerformanceStrip } from '../PreviousPerformance';

const set = (id: string, load: number, reps: number, type = 'working') => ({
  id, client_id: id, set_index: 0, set_type: type, reps, load_kg: load,
  duration_seconds: null, distance_m: null, rpe: null, rir: null, completed: true,
  performed_at: '2026-09-16T10:00:00Z', load_unit_entered: 'kg', e1rm_kg: null,
  formula_version: null, is_pr: false, note: null,
});

const previous = (sets: unknown[]): PreviousPerformance => ({
  session_id: 's-old', local_date: '2026-09-16', completed_at: '2026-09-16T11:00:00Z',
  target_snapshot: null, best_e1rm_kg: 100, sets,
} as PreviousPerformance);

function show(props: Partial<React.ComponentProps<typeof PreviousPerformanceStrip>> = {}) {
  const onRetry = jest.fn();
  render(
    <PreviousPerformanceStrip
      data={undefined} isPending={false} isError={false} onRetry={onRetry} {...props}
    />,
  );
  return { onRetry };
}

describe('AC-04 · what you did last time', () => {
  it('shows the prior session\'s sets', () => {
    show({ data: previous([set('a', 30, 10), set('b', 30, 9)]) });

    expect(screen.getByTestId('previous-performance')).toBeTruthy();
    expect(screen.getByText('30 × 10')).toBeTruthy();
    expect(screen.getByText('30 × 9')).toBeTruthy();
  });

  it('dates it from the SERVER\'s local_date, never a recomputed one (I7)', () => {
    show({ data: previous([set('a', 30, 10)]) });
    expect(screen.getByText(/16 Sep/)).toBeTruthy();
  });

  it('leaves warm-ups out of the comparison', () => {
    // Comparing against a warm-up is comparing against nothing.
    show({ data: previous([set('w', 20, 12, 'warmup'), set('a', 30, 10)]) });

    expect(screen.getByText('30 × 10')).toBeTruthy();
    expect(screen.queryByText('20 × 12')).toBeNull();
  });

  it('says so plainly when the last session was warm-ups only', () => {
    show({ data: previous([set('w', 20, 12, 'warmup')]) });
    expect(screen.getByText('Warm-ups only')).toBeTruthy();
  });

  it('is a prompt, not an error, the first time (the server returns null)', () => {
    // The state a NEW user sees for every exercise in their first workout.
    show({ data: null });

    expect(screen.getByTestId('previous-never')).toBeTruthy();
    expect(screen.getByText(/First time doing this one/)).toBeTruthy();
  });

  it('shows a placeholder while loading, never a blocking spinner', () => {
    show({ isPending: true });
    expect(screen.getByTestId('previous-loading')).toBeTruthy();
  });

  it('degrades to a retry chip on failure and never blocks entry', () => {
    const { onRetry } = show({ isError: true });

    expect(screen.getByTestId('previous-error')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Retry last time'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('announces the whole strip to a screen reader in one label', () => {
    show({ data: previous([set('a', 30, 10)]) });
    expect(screen.getByLabelText(/Last time.*30 by 10/)).toBeTruthy();
  });
});
