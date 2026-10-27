import { useCallback, useEffect } from 'react';
import { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from './ReducedMotionProvider';
import { easeOut, press, springs, toPhysicalSpring } from './tokens';

const EASE_OUT = Easing.bezier(...easeOut);

/**
 * Press feedback for a pressable surface: it dips to 0.94 in 100 ms on press-in and springs back on
 * release. Feedback starts on press-in, not when the tap completes. With Reduce Motion on the
 * surface keeps its size, and the press colour of the component carries the feedback.
 */
export function usePressScale() {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduced) scale.set(1);
  }, [reduced, scale]);

  const onPressIn = useCallback(() => {
    if (reduced) return;
    scale.set(withTiming(press.scale, { duration: press.durationMs, easing: EASE_OUT }));
  }, [reduced, scale]);

  const onPressOut = useCallback(() => {
    scale.set(reduced ? 1 : withSpring(1, toPhysicalSpring(springs.spatialFast)));
  }, [reduced, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return { style, onPressIn, onPressOut };
}
