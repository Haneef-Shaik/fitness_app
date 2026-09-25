/**
 * The app's TextInput: React Native's, reachable by a hardware keyboard.
 *
 * On Android, RN 0.76's TextInput refuses every focus request from the OS —
 * `ReactEditText.requestFocus` is a deliberate no-op — so Tab could never
 * enter a text field (found on a phone in G10: the set logger's load and reps
 * were unreachable). A JS `focus()` is the one route the platform accepts, so a
 * focusable wrapper takes the keyboard's focus and hands it to the input.
 *
 * On Android it also carries the field's NAME where TalkBack reads it. TalkBack
 * names a text field by its hint and ignores its contentDescription — which is
 * what `accessibilityLabel` becomes — so in G10's TalkBack session the load
 * field was announced "—, 80, Edit box" (its placeholder) and the grams field
 * "100, Edit box" (no name at all). The label goes into the native hint; a
 * visible placeholder that differs from it is drawn over the empty field
 * instead, hidden from the reader.
 *
 * Screens import this one, never TextInput from 'react-native'
 * (`keyboardInput.test.tsx` enforces it).
 */
import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  DeviceEventEmitter, Platform, StyleSheet, Text, TextInput as RNTextInput, View,
  findNodeHandle, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { HW_FOCUS_EVENT } from './focusRing';
import { useTheme } from '../theme';

/**
 * What the native hint says, and what is drawn over the empty field instead.
 * The hint is the name TalkBack speaks, so a label always wins it; the
 * placeholder, when it says something else, moves to the overlay.
 */
export function hintFor(label?: string, placeholder?: string): { hint?: string; overlay?: string } {
  if (!label || label === placeholder) return { hint: placeholder };
  return { hint: label, overlay: placeholder };
}

/** Style keys that position text inside the field — the overlay copies them. */
const TEXT_KEYS = [
  'padding', 'paddingHorizontal', 'paddingVertical', 'paddingTop', 'paddingBottom',
  'paddingLeft', 'paddingRight', 'paddingStart', 'paddingEnd',
  'textAlign', 'fontSize', 'fontFamily', 'fontWeight', 'lineHeight', 'letterSpacing',
] as const;

function overlayStyle(inner: Record<string, unknown>, multiline: boolean): { box: ViewStyle; text: TextStyle } {
  const text: Record<string, unknown> = {};
  for (const k of TEXT_KEYS) if (inner[k] !== undefined) text[k] = inner[k];
  const inset = typeof inner.borderWidth === 'number' ? inner.borderWidth : 0;
  return {
    box: {
      position: 'absolute', top: inset, bottom: inset, left: inset, right: inset,
      justifyContent: multiline ? 'flex-start' : 'center',
    },
    text: text as TextStyle,
  };
}

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
  {
    style, placeholder, placeholderTextColor, accessibilityLabel, onChangeText, ...rest
  }, forwarded,
) {
  const { c } = useTheme();
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

  // Uncontrolled fields report emptiness through onChangeText; controlled ones
  // through `value`.
  const [typedEmpty, setTypedEmpty] = useState(!rest.defaultValue);
  const handleChange = useCallback((text: string) => {
    setTypedEmpty(text === '');
    onChangeText?.(text);
  }, [onChangeText]);
  const empty = rest.value !== undefined ? rest.value === '' : typedEmpty;

  const { outer, inner } = splitLayout(style);
  const { hint, overlay } = Platform.OS === 'android'
    ? hintFor(accessibilityLabel, placeholder)
    : { hint: placeholder, overlay: undefined };
  const moved = hint !== placeholder;
  const drawn = moved && overlay && empty ? overlayStyle(inner, Boolean(rest.multiline)) : null;
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
      <RNTextInput
        ref={setInput}
        {...rest}
        accessibilityLabel={accessibilityLabel}
        placeholder={hint}
        // The hint carries the name now; it must not also be painted.
        placeholderTextColor={moved ? 'transparent' : placeholderTextColor}
        onChangeText={handleChange}
        style={inner}
      />
      {drawn ? (
        <View
          testID="placeholder-overlay"
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={drawn.box}
        >
          <Text
            numberOfLines={rest.multiline ? undefined : 1}
            style={[drawn.text, { color: placeholderTextColor ?? c.ink3 }]}
          >
            {overlay}
          </Text>
        </View>
      ) : null}
    </View>
  );
});
