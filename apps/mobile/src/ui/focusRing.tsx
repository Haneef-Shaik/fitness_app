/**
 * The keyboard focus ring from docs/05: "a visible 2 px ring with 2 px offset
 * whenever focus is driven by an external keyboard … never removed."
 *
 * On Android a Pressable never receives `onFocus`: React Native reports
 * keyboard focus for ordinary views only as one app-wide `onHWKeyEvent`
 * ({ eventType: 'focus' | 'blur', tag }), where `tag` is the focused view.
 * Found in G10 on a phone — Tab moved focus and nothing on screen showed it.
 * So each control listens for that event and compares the tag with its own.
 *
 * Touch never moves this focus, so the ring appears only for a keyboard (or
 * Switch Control) — which is the rule. It is an overlay outside the control,
 * so gaining focus never shifts the layout.
 */
import React, { useEffect, useState, type RefObject } from 'react';
import { DeviceEventEmitter, View, findNodeHandle } from 'react-native';
import { useTheme } from '../theme';

const RING = 2;
const OFFSET = 2;

/** The event React Native's Android input helper emits on focus changes. */
export const HW_FOCUS_EVENT = 'onHWKeyEvent';

interface HWKeyEvent { eventType?: string; tag?: number }

/** True while the view behind `ref` holds keyboard focus. */
export function useFocusRing(ref: RefObject<View | null>): boolean {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(HW_FOCUS_EVENT, (e: HWKeyEvent) => {
      if (e.eventType !== 'focus' && e.eventType !== 'blur') return;
      const mine = ref.current ? findNodeHandle(ref.current) : null;
      if (mine == null) return;
      // A focus event anywhere else means this control has lost it.
      if (e.eventType === 'focus') setFocused(e.tag === mine);
      else if (e.tag === mine) setFocused(false);
    });
    return () => sub.remove();
  }, [ref]);

  return focused;
}

/** Render inside the focused control. `radius` is the control's own. */
export function FocusRing({ radius }: { radius: number }) {
  const { c } = useTheme();
  const out = RING + OFFSET;
  return (
    <View
      testID="focus-ring"
      pointerEvents="none"
      style={{
        position: 'absolute', top: -out, left: -out, right: -out, bottom: -out,
        borderWidth: RING, borderColor: c.focusRing, borderRadius: radius + out,
      }}
    />
  );
}
