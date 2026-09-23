/**
 * The app's TextInput: React Native's, reachable by a hardware keyboard.
 *
 * On Android, RN 0.76's TextInput refuses every focus request from the OS —
 * `ReactEditText.requestFocus` is a deliberate no-op — so Tab could never
 * enter a text field (found on a phone in G10: the set logger's load and reps
 * were unreachable). A JS `focus()` is the one route the platform accepts, so a
 * focusable wrapper takes the keyboard's focus and hands it to the input.
 *
 * Screens import this one, never TextInput from 'react-native'
 * (`keyboardInput.test.tsx` enforces it).
 */
import React, { forwardRef, useCallback, useEffect, useRef } from 'react';
import {
  DeviceEventEmitter, StyleSheet, TextInput as RNTextInput, View, findNodeHandle,
  type TextInputProps, type ViewStyle,
} from 'react-native';
import { HW_FOCUS_EVENT } from './focusRing';

/** Style keys that size and place the field — they belong on the wrapper. */
const LAYOUT_KEYS = new Set<string>([
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'width', 'minWidth', 'maxWidth',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'marginHorizontal', 'marginVertical', 'marginStart', 'marginEnd',
  'position', 'top', 'bottom', 'left', 'right', 'zIndex',
]);

function splitLayout(style: TextInputProps['style']) {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(flat)) (LAYOUT_KEYS.has(k) ? outer : inner)[k] = v;
  // The input fills the wrapper wherever the wrapper was told to grow.
  if (outer.flex !== undefined || outer.flexGrow !== undefined) inner.flexGrow = 1;
  return { outer: outer as ViewStyle, inner };
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(
  { style, ...rest }, forwarded,
) {
  const wrapper = useRef<View | null>(null);
  const input = useRef<RNTextInput | null>(null);
  const setInput = useCallback((node: RNTextInput | null) => {
    input.current = node;
    if (typeof forwarded === 'function') forwarded(node);
    else if (forwarded) forwarded.current = node;
  }, [forwarded]);

  useEffect(() => {
    let previous: number | undefined;
    const sub = DeviceEventEmitter.addListener(
      HW_FOCUS_EVENT, (e: { eventType?: string; tag?: number }) => {
        if (e.eventType !== 'focus') return;
        const mine = wrapper.current ? findNodeHandle(wrapper.current) : null;
        const inner = input.current ? findNodeHandle(input.current) : null;
        // Coming back out of the input (Shift+Tab) must be allowed to leave.
        if (mine != null && e.tag === mine && previous !== inner) input.current?.focus();
        previous = e.tag;
      },
    );
    return () => sub.remove();
  }, []);

  const { outer, inner } = splitLayout(style);
  return (
    <View
      ref={wrapper}
      testID="keyboard-bridge"
      focusable
      // Only a keyboard stop: a screen reader goes straight to the input.
      importantForAccessibility="no"
      accessible={false}
      style={outer}
    >
      <RNTextInput ref={setInput} {...rest} style={inner} />
    </View>
  );
});
