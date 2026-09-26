/**
 * E-03's entry controls. The field shapes mirror C-07's, deliberately: both read
 * `tracks_*`, so a plank never gets a load field in either the plan or the log.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { Exercise } from '@fitlog/api-types';
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

describe('typing into the numeric fields (G10, found on a device)', () => {
  /**
   * The field used to be fully controlled: every keystroke went up to a
   * reducer and came back as a new `value` prop, and the native text was
   * re-set underneath the keyboard. On hardware that races — typing `80` into
   * a field showing `80` produced **800**.
   *
   * These tests cannot reproduce the race (RNTL sets text atomically), so they
   * pin the behaviour the fix depends on instead: the field shows what was
   * typed, a stepper still wins, and a prop change from elsewhere still wins.
   */
  const entry = (over: Partial<SetEntryValue> = {}): SetEntryValue => ({
    ...EMPTY, loadKg: 80, reps: 8, ...over,
  });

  it('shows what was typed, not what the parent last sent', () => {
    const { onChange } = show(ex(), entry());

    fireEvent.changeText(screen.getByTestId('entry-load-input'), '82.5');

    expect(screen.getByTestId('entry-load-input').props.value).toBe('82.5');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ loadKg: 82.5 }));
  });

  it('keeps a half-typed decimal rather than swallowing the point', () => {
    show(ex(), entry());

    // "82." parses to 82, and a controlled field would immediately rewrite the
    // text to "82" — deleting the point the user just pressed.
    fireEvent.changeText(screen.getByTestId('entry-load-input'), '82.');
    expect(screen.getByTestId('entry-load-input').props.value).toBe('82.');
  });

  it('clearing it means "not set", never zero', () => {
    const { onChange } = show(ex(), entry());

    fireEvent.changeText(screen.getByTestId('entry-load-input'), '');

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ loadKg: null }));
    expect(screen.getByTestId('entry-load-input').props.value).toBe('');
  });

  it('a stepper tap still wins over what is on screen', () => {
    // A LIVE parent, because that is the only faithful test of this: in the app
    // the value goes up on every keystroke and comes back down, and the whole
    // point of the fix is that the round trip no longer fights the keyboard.
    function Live() {
      const [value, setValue] = React.useState<SetEntryValue>(entry());
      return (
        <SetEntry
          exercise={ex()}
          value={value}
          onChange={setValue}
          onCommit={jest.fn()}
        />
      );
    }
    render(<Live />);

    fireEvent.changeText(screen.getByTestId('entry-load-input'), '77');
    expect(screen.getByTestId('entry-load-input').props.value).toBe('77');

    fireEvent.press(screen.getByLabelText('Increase Load (kg)'));

    // The stepper steps from what the user typed, not from a stale prop.
    expect(screen.getByTestId('entry-load-input').props.value).toBe('79.5');
  });

  it('a live parent round trip does not rewrite what is being typed', () => {
    function Live() {
      const [value, setValue] = React.useState<SetEntryValue>(entry());
      return (
        <SetEntry
          exercise={ex()}
          value={value}
          onChange={setValue}
          onCommit={jest.fn()}
        />
      );
    }
    render(<Live />);

    // Character by character, the way a keyboard does it. Each one goes up to
    // the parent and comes back; none of them may disturb the text.
    for (const next of ['8', '82', '82.', '82.5']) {
      fireEvent.changeText(screen.getByTestId('entry-load-input'), next);
      expect(screen.getByTestId('entry-load-input').props.value).toBe(next);
    }
  });

  it('a LAGGING parent echo never rewrites newer typing (800 for 80, again)', () => {
    // The emulator run of the release APK logged "800 × 86" (G10, 25 Sep): the
    // parent's echo of an EARLIER keystroke ("8") arrived after the next one
    // ("80") and was taken for a change from elsewhere — the field reset to
    // "8" under the keyboard and the next key landed on top. A device's
    // reducer can lag a keystroke; this parent lags on purpose.
    const pending: SetEntryValue[] = [];
    let flush: () => void = () => {};
    function Lagging() {
      const [value, setValue] = React.useState<SetEntryValue>(entry());
      flush = () => { const v = pending.shift(); if (v) setValue(v); };
      return (
        <SetEntry exercise={ex()} value={value} onChange={(v) => { pending.push(v); }} onCommit={jest.fn()} />
      );
    }
    render(<Lagging />);
    const field = () => screen.getByTestId('entry-load-input');

    fireEvent.changeText(field(), '');
    fireEvent.changeText(field(), '8');
    fireEvent.changeText(field(), '80');
    // Now the echoes arrive, late, one by one.
    act(() => flush());           // null (the erase)
    expect(field().props.value).toBe('80');
    act(() => flush());           // 8 — stale: the user has typed "80" since
    expect(field().props.value).toBe('80');
    act(() => flush());           // 80
    expect(field().props.value).toBe('80');
  });

  it('focusing a field selects its value, so typing replaces it (G10, emulator)', () => {
    // Tapping the middle of a centred "80" put the caret between 8 and 0:
    // backspace removed the 8 and typing "80" gave "800" (and "8" before a
    // "6" gave "86"). A person tapping the field got the same.
    show(ex(), entry());
    expect(screen.getByTestId('entry-load-input').props.selectTextOnFocus).toBe(true);
    expect(screen.getByTestId('entry-reps-input').props.selectTextOnFocus).toBe(true);
  });

  it('a change from elsewhere still wins after typing (a repeated set)', () => {
    function Live({ external }: { external: number | null }) {
      const [value, setValue] = React.useState<SetEntryValue>(entry());
      React.useEffect(() => { if (external !== null) setValue((v) => ({ ...v, loadKg: external })); }, [external]);
      return <SetEntry exercise={ex()} value={value} onChange={setValue} onCommit={jest.fn()} />;
    }
    const { rerender } = render(<Live external={null} />);
    fireEvent.changeText(screen.getByTestId('entry-load-input'), '82.5');
    rerender(<Live external={100} />);
    expect(screen.getByTestId('entry-load-input').props.value).toBe('100');
  });
});

describe('keyboard order follows the screen (found on a phone in G10)', () => {
  /**
   * With Fabric's view flattening, each stepper's row View is layout-only and
   * disappears natively — so every control in the logger became a sibling of
   * every other, and Android's Tab order sorted that one flat list into
   * COLUMNS: both "−" buttons, Warm-up, Save, then the two fields, then both
   * "+". A keyboard user typing reps had to go round the whole screen to Save.
   * Each row must stay a real native group so it is ordered as a row.
   */
  it('keeps each stepper row a native group', () => {
    show(ex());
    for (const id of ['entry-load', 'entry-reps']) {
      const row = screen.getByTestId(`${id}-row`);
      expect(row.props.collapsable).toBe(false);
    }
    // And the entry as a whole, so Warm-up and Save sit among the fields.
    expect(screen.getByTestId('set-entry').props.collapsable).toBe(false);
  });
});
