/**
 * E-04 · Rest Timer.
 *
 * Reads a target instant on a tick rather than decrementing a number, so the
 * phone can sleep through the whole rest period and still be right — see
 * ../restTimer.ts. Backgrounding is the normal case here: the user puts the
 * phone down between sets.
 */
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Pill, Text } from '@/ui';
import { space, useTheme } from '@/theme';
import { formatRest, readTimer, restAnnouncement } from '../restTimer';
import { spokenDuration } from '../a11y';

export interface RestTimerProps {
  targetIso: string;
  totalSeconds: number;
  onDismiss: () => void;
  onAdjust: (deltaSeconds: number) => void;
}

export function RestTimer({ targetIso, totalSeconds, onDismiss, onAdjust }: RestTimerProps) {
  const { c } = useTheme();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 500);
    // Re-read on foreground: the interval did not run while backgrounded, and
    // the answer comes from the clock rather than from how many ticks we saw.
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setNow(new Date());
    });
    return () => { clearInterval(tick); sub.remove(); };
  }, [targetIso]);

  const { remaining, elapsed, progress } = readTimer(targetIso, totalSeconds, now);

  // The end of a rest is the one moment worth interrupting for. The label
  // changes too, but TalkBack only speaks a label that has its focus — and
  // between sets focus sits on "Save set", so the rest ended in silence
  // (G10 session). Announced once, on the transition.
  const wasElapsed = useRef(elapsed);
  useEffect(() => {
    if (elapsed && !wasElapsed.current) AccessibilityInfo.announceForAccessibility('Rest complete');
    wasElapsed.current = elapsed;
  }, [elapsed]);

  const adjust = (delta: number) => {
    onAdjust(delta);
    // The change is otherwise silent: focus stays on this button and the
    // timer's own label is only read when it has focus (G10).
    const next = Math.max(0, remaining + delta);
    AccessibilityInfo.announceForAccessibility(
      next > 0 ? `${spokenDuration(next)} of rest left` : 'Rest complete',
    );
  };

  return (
    <View
      testID="rest-timer"
      accessibilityRole="timer"
      // 15-second steps, not the second: a label that changes every second
      // churns the tree for TalkBack and tooling alike (a11y finding #5).
      accessibilityLabel={restAnnouncement(remaining, elapsed)}
      style={{
        borderBottomWidth: 1, borderColor: c.line,
        backgroundColor: c.surface, paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Ionicons name="timer-outline" size={20} color={elapsed ? c.goodInk : c.accent} />
        <Text
          variant="stat"
          style={{ color: elapsed ? c.goodInk : c.ink }}
          testID="rest-remaining"
          // The ticking digits are for the eye; the timer's label speaks for them.
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          {formatRest(remaining)}
        </Text>
        <Pill kind={elapsed ? 'good' : 'accent'}>{elapsed ? 'Rest done' : 'Resting'}</Pill>
        <View style={{ flex: 1 }} />
        {(['-15', '+15'] as const).map((label) => (
          <Button
            key={label}
            kind="secondary"
            size="sm"
            title={label}
            onPress={() => adjust(label === '+15' ? 15 : -15)}
            accessibilityLabel={`${label === '+15' ? 'Add' : 'Remove'} 15 seconds`}
          />
        ))}
        <Button
          kind="secondary"
          size="sm"
          title="Skip"
          onPress={onDismiss}
          accessibilityLabel="Skip rest"
        />
      </View>

      <View style={{ height: 4, borderRadius: 2, backgroundColor: c.sunken, overflow: 'hidden' }}>
        <View style={{
          width: `${Math.round(progress * 100)}%`, height: '100%',
          backgroundColor: elapsed ? c.good : c.accent,
        }} />
      </View>
    </View>
  );
}
