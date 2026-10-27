import { render, screen, act, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Text } from 'react-native';
import { createReducedMotionStore, fixedReducedMotionStore, stackAnimation, systemReducedMotionSource, type ReducedMotionSource } from '../reduced-motion';
import { ReducedMotionProvider, useReducedMotion } from '../ReducedMotionProvider';
import { resetAnimations, setLaunchReducedMotion } from './reanimated-fake';

jest.mock('react-native-reanimated', () => jest.requireActual('./reanimated-fake'));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

const flush = () => new Promise<void>((resolve) => { setTimeout(resolve, 0); });

function controllableSource(answer: () => Promise<boolean>) {
  let emit: (enabled: boolean) => void = () => {};
  const detach = jest.fn();
  const source = {
    query: jest.fn(answer),
    subscribe: jest.fn((listener: (enabled: boolean) => void) => { emit = listener; return detach; }),
  } satisfies ReducedMotionSource;
  return { source, detach, emit: (enabled: boolean) => emit(enabled) };
}

function Probe() {
  return <Text testID="reduced">{String(useReducedMotion())}</Text>;
}

beforeEach(() => resetAnimations());

describe('reduced motion store', () => {
  it('is unknown until the platform answers, then holds the answer and tells listeners', async () => {
    const { source } = controllableSource(async () => true);
    const store = createReducedMotionStore(source);
    const listener = jest.fn();
    expect(store.getSnapshot()).toBeNull();
    const unsubscribe = store.subscribe(listener);
    await flush();
    expect(store.getSnapshot()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('follows the setting live while someone is listening', async () => {
    const { source, emit } = controllableSource(async () => false);
    const store = createReducedMotionStore(source);
    const unsubscribe = store.subscribe(() => {});
    await flush();
    emit(true);
    expect(store.getSnapshot()).toBe(true);
    emit(false);
    expect(store.getSnapshot()).toBe(false);
    unsubscribe();
  });

  it('never lets a slow first answer overwrite a newer change', async () => {
    const answer = deferred<boolean>();
    const { source, emit } = controllableSource(() => answer.promise);
    const store = createReducedMotionStore(source);
    const unsubscribe = store.subscribe(() => {});
    emit(true);
    answer.resolve(false);
    await flush();
    expect(store.getSnapshot()).toBe(true);
    unsubscribe();
  });

  it('stays unknown when the platform cannot answer', async () => {
    const { source } = controllableSource(() => Promise.reject(new Error('unavailable')));
    const store = createReducedMotionStore(source);
    const unsubscribe = store.subscribe(() => {});
    await flush();
    expect(store.getSnapshot()).toBeNull();
    unsubscribe();
  });

  it('subscribes to the platform once, detaches when the last listener leaves and ignores a late answer', async () => {
    const answer = deferred<boolean>();
    const { source, detach } = controllableSource(() => answer.promise);
    const store = createReducedMotionStore(source);
    const first = store.subscribe(() => {});
    const second = store.subscribe(() => {});
    expect(source.subscribe).toHaveBeenCalledTimes(1);
    first();
    expect(detach).not.toHaveBeenCalled();
    second();
    expect(detach).toHaveBeenCalledTimes(1);
    answer.resolve(true);
    await flush();
    expect(store.getSnapshot()).toBeNull();
  });

  it('reads and follows the operating system setting through AccessibilityInfo', async () => {
    const remove = jest.fn();
    jest.mocked(AccessibilityInfo.addEventListener).mockReturnValueOnce({ remove } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>);
    jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValueOnce(true);
    await expect(systemReducedMotionSource.query()).resolves.toBe(true);
    const listener = jest.fn();
    const detach = systemReducedMotionSource.subscribe(listener);
    expect(AccessibilityInfo.addEventListener).toHaveBeenCalledWith('reduceMotionChanged', listener);
    detach();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('makes screen changes immediate under Reduce Motion', () => {
    expect(stackAnimation(true)).toBe('none');
    expect(stackAnimation(false)).toBe('default');
  });
});

describe('useReducedMotion', () => {
  it('uses the launch reading until the platform answers, then follows live changes', async () => {
    setLaunchReducedMotion(true);
    const answer = deferred<boolean>();
    const { source, emit } = controllableSource(() => answer.promise);
    render(<ReducedMotionProvider store={createReducedMotionStore(source)}><Probe /></ReducedMotionProvider>);
    expect(screen.getByTestId('reduced')).toHaveTextContent('true');
    answer.resolve(false);
    await waitFor(() => expect(screen.getByTestId('reduced')).toHaveTextContent('false'));
    act(() => emit(true));
    expect(screen.getByTestId('reduced')).toHaveTextContent('true');
  });

  it('follows the system setting when no provider is given', async () => {
    jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValueOnce(true);
    render(<Probe />);
    await waitFor(() => expect(screen.getByTestId('reduced')).toHaveTextContent('true'));
    expect(AccessibilityInfo.addEventListener).toHaveBeenCalledWith('reduceMotionChanged', expect.any(Function));
  });

  it('answers from a fixed store for tests and previews', () => {
    render(<ReducedMotionProvider store={fixedReducedMotionStore(true)}><Probe /></ReducedMotionProvider>);
    expect(screen.getByTestId('reduced')).toHaveTextContent('true');
  });
});
