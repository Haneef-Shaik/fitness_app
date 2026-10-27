import { useEffect } from 'react';
import { useSharedValue, withDelay, withSpring, type SharedValue } from 'react-native-reanimated';
import { useReducedMotion } from './ReducedMotionProvider';
import { toPhysicalSpring, type SpringToken } from './tokens';

export interface SpringValueOptions {
  /** Where the value starts on mount when motion is allowed. Defaults to `target`. */
  readonly from?: number;
  readonly delayMs?: number;
}

/**
 * A number that springs to `target` on the UI thread. With Reduce Motion on, it holds `target`
 * from the first frame, and switching Reduce Motion on mid-animation jumps it there at once.
 */
export function useSpringValue(target: number, spring: SpringToken, { from, delayMs = 0 }: SpringValueOptions = {}): SharedValue<number> {
  const reduced = useReducedMotion();
  const value = useSharedValue(reduced ? target : from ?? target);
  // Keyed on the numbers, so an inline token object does not restart the spring on every render.
  const { dampingRatio, stiffness } = spring;

  useEffect(() => {
    if (reduced) {
      // Setting a plain value also cancels a spring already running.
      value.set(target);
      return;
    }
    const animation = withSpring(target, toPhysicalSpring({ dampingRatio, stiffness }));
    value.set(delayMs > 0 ? withDelay(delayMs, animation) : animation);
  }, [reduced, target, dampingRatio, stiffness, delayMs, value]);

  return value;
}
