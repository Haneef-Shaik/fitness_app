/**
 * A deterministic stand-in for Reanimated in Jest. Shared values keep their state between renders,
 * and an animation is recorded instead of played, so a test can see what a primitive scheduled,
 * what it drew on the first frame, and where it lands once `finishAnimations()` lets time pass.
 * It checks our motion logic only. How motion feels is judged on a release build (docs/22 §5).
 *
 * Use it with: jest.mock('react-native-reanimated', () => jest.requireActual('./reanimated-fake'));
 */
import { useEffect, useReducer, useState } from 'react';
import { View } from 'react-native';

export interface FakeAnimation {
  readonly kind: 'spring' | 'timing';
  readonly to: number;
  readonly config: unknown;
  readonly delayMs: number;
}

type Assignable = number | FakeAnimation;

class FakeSharedValue {
  private current: number;
  private pending: FakeAnimation | null = null;
  private readonly repaint: () => void;

  constructor(initial: number, repaint: () => void) {
    this.current = initial;
    this.repaint = repaint;
  }

  get = (): number => this.current;

  set = (next: Assignable): void => {
    if (typeof next === 'number') {
      this.pending = null;
      this.write(next);
      return;
    }
    scheduled.push(next);
    this.pending = next;
  };

  finish(): void {
    if (!this.pending) return;
    const { to } = this.pending;
    this.pending = null;
    this.write(to);
  }

  private write(next: number): void {
    if (next === this.current) return;
    this.current = next;
    // Stands in for the UI thread drawing the new value.
    this.repaint();
  }
}

/** Every animation handed to a shared value, in order. */
export const scheduled: FakeAnimation[] = [];
/** Every animated style computed for drawing, in order, including the first frame. */
const drawn: unknown[] = [];
const live = new Set<FakeSharedValue>();
let launchReducedMotion = false;

export function useSharedValue(initial: number): FakeSharedValue {
  const [, repaint] = useReducer((frame: number) => frame + 1, 0);
  const [value] = useState(() => new FakeSharedValue(initial, () => repaint()));
  useEffect(() => {
    live.add(value);
    return () => { live.delete(value); };
  }, [value]);
  return value;
}

export function useAnimatedStyle<T>(updater: () => T): T {
  const style = updater();
  drawn.push(style);
  return style;
}

/** The distinct styles drawn so far, in the order each first appeared. */
export function framesDrawn(): unknown[] {
  const frames = new Map<string, unknown>();
  drawn.forEach((frame) => { if (!frames.has(JSON.stringify(frame))) frames.set(JSON.stringify(frame), frame); });
  return [...frames.values()];
}

export function withSpring(to: number, config?: unknown): FakeAnimation {
  return { kind: 'spring', to, config, delayMs: 0 };
}

export function withTiming(to: number, config?: unknown): FakeAnimation {
  return { kind: 'timing', to, config, delayMs: 0 };
}

export function withDelay(delayMs: number, animation: FakeAnimation): FakeAnimation {
  return { ...animation, delayMs };
}

/** Reanimated's launch-time reading of the system setting. */
export function useReducedMotion(): boolean {
  return launchReducedMotion;
}

export const Easing = {
  bezier: (..._points: number[]) => ({ factory: () => (progress: number) => progress }),
};

/** Lets every running animation reach its target, as if all its frames had played. */
export function finishAnimations(): void {
  live.forEach((value) => value.finish());
}

export function resetAnimations(): void {
  scheduled.length = 0;
  drawn.length = 0;
  launchReducedMotion = false;
}

export function setLaunchReducedMotion(reduced: boolean): void {
  launchReducedMotion = reduced;
}

const Animated = { View };
export default Animated;
