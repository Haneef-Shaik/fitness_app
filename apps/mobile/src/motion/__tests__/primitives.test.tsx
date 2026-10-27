import type { ReactElement } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { Pop } from '../Pop';
import { Rise } from '../Rise';
import { usePressScale } from '../usePressScale';
import { useSpringValue } from '../useSpringValue';
import { createReducedMotionStore, fixedReducedMotionStore, type ReducedMotionSource, type ReducedMotionStore } from '../reduced-motion';
import { ReducedMotionProvider } from '../ReducedMotionProvider';
import { press, springs, toPhysicalSpring } from '../tokens';
import { finishAnimations, framesDrawn, resetAnimations, scheduled } from './reanimated-fake';

jest.mock('react-native-reanimated', () => jest.requireActual('./reanimated-fake'));

beforeEach(() => resetAnimations());

function renderWith(store: ReducedMotionStore, ui: ReactElement) {
  return render(<ReducedMotionProvider store={store}>{ui}</ReducedMotionProvider>);
}

/** A live setting that has already answered "motion allowed", so a test can turn Reduce Motion on mid-animation. */
async function liveSetting() {
  let emit: (enabled: boolean) => void = () => {};
  const source: ReducedMotionSource = {
    query: async () => false,
    subscribe: (listener) => { emit = listener; return () => {}; },
  };
  const store = createReducedMotionStore(source);
  const release = store.subscribe(() => {});
  await new Promise<void>((resolve) => { setTimeout(resolve, 0); });
  return { store, release, turnReduceMotion: (enabled: boolean) => act(() => emit(enabled)) };
}

function PressProbe({ onPress }: { onPress: () => void }) {
  const { style, onPressIn, onPressOut } = usePressScale();
  return <Pressable accessibilityRole="button" accessibilityLabel="Log set" onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
    <Animated.View testID="face" style={style}><Text>Log set</Text></Animated.View>
  </Pressable>;
}

function InlineSpring({ label }: { label: string }) {
  useSpringValue(1, { dampingRatio: 0.6, stiffness: 800 }, { from: 0 });
  return <Text>{label}</Text>;
}

describe('useSpringValue', () => {
  it('does not restart the spring when re-rendered with an equal inline token', () => {
    const motionAllowed = fixedReducedMotionStore(false);
    const view = renderWith(motionAllowed, <InlineSpring label="first" />);
    view.rerender(<ReducedMotionProvider store={motionAllowed}><InlineSpring label="second" /></ReducedMotionProvider>);
    expect(screen.getByText('second')).toBeTruthy();
    expect(scheduled).toEqual([{ kind: 'spring', to: 1, config: toPhysicalSpring(springs.spatialFast), delayMs: 0 }]);
  });
});

describe('Pop', () => {
  it('with Reduce Motion on, renders its end state on the first frame and schedules no animation', () => {
    renderWith(fixedReducedMotionStore(true), <Pop testID="chip"><Text>1 · 8 × 80 kg</Text></Pop>);
    expect(screen.getByTestId('chip')).toHaveStyle({ opacity: 1, transform: [{ scale: 1 }] });
    expect(framesDrawn()).toEqual([{ opacity: 1, transform: [{ scale: 1 }] }]);
    expect(scheduled).toEqual([]);
  });

  it('pops from 0.6 on the spatial-fast spring and fades in on the effects spring when motion is allowed', () => {
    renderWith(fixedReducedMotionStore(false), <Pop testID="chip"><Text>1 · 8 × 80 kg</Text></Pop>);
    expect(screen.getByTestId('chip')).toHaveStyle({ opacity: 0, transform: [{ scale: 0.6 }] });
    expect(scheduled).toEqual([
      { kind: 'spring', to: 1, config: toPhysicalSpring(springs.spatialFast), delayMs: 0 },
      { kind: 'spring', to: 1, config: toPhysicalSpring(springs.effectsDefault), delayMs: 0 },
    ]);
    act(() => finishAnimations());
    expect(screen.getByTestId('chip')).toHaveStyle({ opacity: 1, transform: [{ scale: 1 }] });
    expect(framesDrawn()).toEqual([{ opacity: 0, transform: [{ scale: 0.6 }] }, { opacity: 1, transform: [{ scale: 1 }] }]);
  });

  it('jumps to its end state when Reduce Motion turns on mid-animation', async () => {
    const setting = await liveSetting();
    renderWith(setting.store, <Pop testID="chip"><Text>1</Text></Pop>);
    expect(screen.getByTestId('chip')).toHaveStyle({ opacity: 0, transform: [{ scale: 0.6 }] });
    setting.turnReduceMotion(true);
    expect(screen.getByTestId('chip')).toHaveStyle({ opacity: 1, transform: [{ scale: 1 }] });
    setting.release();
  });

  it('never starts from scale 0', () => {
    renderWith(fixedReducedMotionStore(false), <Pop testID="badge" from={0}><Text>✓</Text></Pop>);
    expect(screen.getByTestId('badge')).toHaveStyle({ transform: [{ scale: 0.3 }] });
  });
});

describe('Rise', () => {
  it('with Reduce Motion on, renders in place on the first frame and schedules no animation', () => {
    renderWith(fixedReducedMotionStore(true), <Rise testID="card" index={3}><Text>Today</Text></Rise>);
    expect(screen.getByTestId('card')).toHaveStyle({ opacity: 1, transform: [{ translateY: 0 }] });
    expect(framesDrawn()).toEqual([{ opacity: 1, transform: [{ translateY: 0 }] }]);
    expect(scheduled).toEqual([]);
  });

  it('rises 28 dp on the spatial-default spring, 60 ms after the card before it, when motion is allowed', () => {
    renderWith(fixedReducedMotionStore(false), <Rise testID="card" index={2}><Text>Today</Text></Rise>);
    expect(screen.getByTestId('card')).toHaveStyle({ opacity: 0, transform: [{ translateY: 28 }] });
    expect(scheduled).toEqual([
      { kind: 'spring', to: 0, config: toPhysicalSpring(springs.spatialDefault), delayMs: 120 },
      { kind: 'spring', to: 1, config: toPhysicalSpring(springs.effectsDefault), delayMs: 120 },
    ]);
    act(() => finishAnimations());
    expect(screen.getByTestId('card')).toHaveStyle({ opacity: 1, transform: [{ translateY: 0 }] });
  });

  it('jumps into place when Reduce Motion turns on mid-animation', async () => {
    const setting = await liveSetting();
    renderWith(setting.store, <Rise testID="card"><Text>Today</Text></Rise>);
    expect(screen.getByTestId('card')).toHaveStyle({ opacity: 0, transform: [{ translateY: 28 }] });
    setting.turnReduceMotion(true);
    expect(screen.getByTestId('card')).toHaveStyle({ opacity: 1, transform: [{ translateY: 0 }] });
    setting.release();
  });
});

describe('usePressScale', () => {
  it('with Reduce Motion on, keeps full size through a press and schedules no animation', () => {
    const onPress = jest.fn();
    renderWith(fixedReducedMotionStore(true), <PressProbe onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Log set' });
    fireEvent(button, 'pressIn');
    expect(screen.getByTestId('face')).toHaveStyle({ transform: [{ scale: 1 }] });
    fireEvent(button, 'pressOut');
    fireEvent.press(button);
    expect(framesDrawn()).toEqual([{ transform: [{ scale: 1 }] }]);
    expect(scheduled).toEqual([]);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('dips to 0.94 in 100 ms on press-in and springs back on spatial fast when motion is allowed', () => {
    renderWith(fixedReducedMotionStore(false), <PressProbe onPress={jest.fn()} />);
    const button = screen.getByRole('button', { name: 'Log set' });
    fireEvent(button, 'pressIn');
    expect(scheduled).toEqual([expect.objectContaining({ kind: 'timing', to: press.scale, config: expect.objectContaining({ duration: press.durationMs }) })]);
    act(() => finishAnimations());
    expect(screen.getByTestId('face')).toHaveStyle({ transform: [{ scale: 0.94 }] });
    fireEvent(button, 'pressOut');
    expect(scheduled[1]).toEqual({ kind: 'spring', to: 1, config: toPhysicalSpring(springs.spatialFast), delayMs: 0 });
    act(() => finishAnimations());
    expect(screen.getByTestId('face')).toHaveStyle({ transform: [{ scale: 1 }] });
  });

  it('returns to full size when Reduce Motion turns on mid-press', async () => {
    const setting = await liveSetting();
    renderWith(setting.store, <PressProbe onPress={jest.fn()} />);
    fireEvent(screen.getByRole('button', { name: 'Log set' }), 'pressIn');
    act(() => finishAnimations());
    expect(screen.getByTestId('face')).toHaveStyle({ transform: [{ scale: 0.94 }] });
    setting.turnReduceMotion(true);
    expect(screen.getByTestId('face')).toHaveStyle({ transform: [{ scale: 1 }] });
    setting.release();
  });
});
