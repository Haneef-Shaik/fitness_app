import type { PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { rise, springs, staggerDelay } from './tokens';
import { useSpringValue } from './useSpringValue';

/**
 * Brings a card or banner in once, on mount: it rises 28 dp and fades in, about 60 ms after the
 * card before it (`index`). With Reduce Motion on it is in place from the first frame. Not for rows
 * of a virtualized list, which remount while scrolling.
 */
export function Rise({ index = 0, style, children, ...props }: PropsWithChildren<ViewProps & { index?: number }>) {
  const delayMs = staggerDelay(index);
  const translateY = useSpringValue(0, springs.spatialDefault, { from: rise.fromTranslateY, delayMs });
  const opacity = useSpringValue(1, springs.effectsDefault, { from: 0, delayMs });
  const animated = useAnimatedStyle(() => ({ opacity: opacity.get(), transform: [{ translateY: translateY.get() }] }));
  return <Animated.View {...props} style={[style, animated]}>{children}</Animated.View>;
}
