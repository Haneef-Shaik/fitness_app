/**
 * The store that replaced Zustand (**D19**).
 *
 * It is ~50 lines of this project's own code now, so it carries its own tests
 * rather than a library's reputation.
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { createStore } from '../createStore';

interface Counter { n: number; other: string; bump(): void }

const make = () => createStore<Counter>((set, get) => ({
  n: 0,
  other: 'unchanged',
  bump: () => set({ n: get().n + 1 }),
}));

describe('outside React', () => {
  it('exposes the initial state', () => {
    expect(make().getState().n).toBe(0);
  });

  it('applies a partial update without touching the rest', () => {
    const s = make();
    s.setState({ n: 5 });
    expect(s.getState()).toMatchObject({ n: 5, other: 'unchanged' });
  });

  it('accepts an updater function', () => {
    const s = make();
    s.setState((prev) => ({ n: prev.n + 3 }));
    expect(s.getState().n).toBe(3);
  });

  it('runs actions defined in the initialiser', () => {
    const s = make();
    s.getState().bump();
    s.getState().bump();
    expect(s.getState().n).toBe(2);
  });

  it('notifies subscribers', () => {
    const s = make();
    const seen: number[] = [];
    s.subscribe(() => seen.push(s.getState().n));

    s.setState({ n: 1 });
    s.setState({ n: 2 });

    expect(seen).toEqual([1, 2]);
  });

  it('does NOT notify when nothing actually changed', () => {
    // The reducers return the same object when nothing changed, so reference
    // equality per key is exact — and it stops a no-op re-rendering the logger.
    const s = make();
    const listener = jest.fn();
    s.subscribe(listener);

    s.setState({ n: 0 });

    expect(listener).not.toHaveBeenCalled();
  });

  it('unsubscribes', () => {
    const s = make();
    const listener = jest.fn();
    const off = s.subscribe(listener);

    off();
    s.setState({ n: 9 });

    expect(listener).not.toHaveBeenCalled();
  });

  it('survives a listener that unsubscribes during the notification', () => {
    // Iterating the live Set would skip a listener here.
    const s = make();
    const second = jest.fn();
    const off = s.subscribe(() => off());
    s.subscribe(second);

    s.setState({ n: 1 });

    expect(second).toHaveBeenCalled();
  });
});

describe('inside React', () => {
  function Probe({ store }: { store: ReturnType<typeof make> }) {
    const n = store((s) => s.n);
    return <Text testID="n">{String(n)}</Text>;
  }

  it('renders the selected slice', () => {
    const s = make();
    render(<Probe store={s} />);
    expect(screen.getByTestId('n')).toHaveTextContent('0');
  });

  it('re-renders when the selected slice changes', () => {
    const s = make();
    render(<Probe store={s} />);

    act(() => { s.setState({ n: 7 }); });

    expect(screen.getByTestId('n')).toHaveTextContent('7');
  });

  it('does not re-render for an unrelated key', () => {
    const s = make();
    let renders = 0;
    function Counting() {
      renders += 1;
      const n = s((st) => st.n);
      return <Text>{String(n)}</Text>;
    }
    render(<Counting />);
    const before = renders;

    act(() => { s.setState({ other: 'changed' }); });

    expect(renders).toBe(before);
  });
});
