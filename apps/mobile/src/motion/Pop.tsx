import type { PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { pop, popScale, springs } from './tokens';
import { useSpringValue } from './useSpringValue';

/**
 * Grows its content into place once, on mount: the logged chip (from 0.6), the check badge (0.4),
 * the record burst (0.3). Scale moves on the spatial-fast spring; opacity on the effects spring.
 * With Reduce Motion on it shows its final state at once.
 */
export function Pop({ from = pop.fromScale, style, children, ...props }: PropsWithChildren<ViewProps & { from?: number }>) {
  const scale = useSpringValue(1, springs.spatialFast, { from: popScale(from) });
  const opacity = useSpringValue(1, springs.effectsDefault, { from: 0 });
  const animated = useAnimatedStyle(() => ({ opacity: opacity.get(), transform: [{ scale: scale.get() }] }));
  return <Animated.View {...props} style={[style, animated]}>{children}</Animated.View>;
}
