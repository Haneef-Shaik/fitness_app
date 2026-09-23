/**
 * The app's Pressable: React Native's, plus the keyboard focus ring (docs/05).
 *
 * Screens import this one, never `Pressable` from 'react-native' — the ring
 * lives here so no control can be missed (`focusRing.test.tsx` enforces it).
 */
import React, { forwardRef, useCallback, useRef } from 'react';
import {
  Pressable as RNPressable, StyleSheet,
  type PressableProps, type PressableStateCallbackType, type View,
} from 'react-native';
import { FocusRing, useFocusRing } from './focusRing';

function radiusOf(style: PressableProps['style']): number {
  const resolved = typeof style === 'function'
    ? style({ pressed: false } as PressableStateCallbackType) : style;
  const r = StyleSheet.flatten(resolved)?.borderRadius;
  return typeof r === 'number' ? r : 0;
}

export const Pressable = forwardRef<View, PressableProps>(function Pressable(
  { children, style, ...rest }, forwarded,
) {
  const own = useRef<View | null>(null);
  const focused = useFocusRing(own);
  // Keep our ref AND the caller's.
  const ref = useCallback((node: View | null) => {
    own.current = node;
    if (typeof forwarded === 'function') forwarded(node);
    else if (forwarded) forwarded.current = node;
  }, [forwarded]);

  return (
    <RNPressable ref={ref} {...rest} style={style}>
      {(state) => (
        <>
          {typeof children === 'function' ? children(state) : children}
          {focused ? <FocusRing radius={radiusOf(style)} /> : null}
        </>
      )}
    </RNPressable>
  );
});
