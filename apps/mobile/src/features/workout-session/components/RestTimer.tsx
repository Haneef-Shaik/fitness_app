/**
 * E-04 · Rest Timer.
 *
 * Reads a target instant on a tick rather than decrementing a number, so the
 * phone can sleep through the whole rest period and still be right — see
 * ../restTimer.ts. Backgrounding is the normal case here: the user puts the
 * phone down between sets.
 */
import React, { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { Pressable } from '@/ui/Pressable';
import { Text } from '@/ui';
import { radius, space, useTheme } from '@/theme';
import { formatRest, readTimer, restAnnouncement } from '../restTimer';

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

  return (
    <View
      testID="rest-timer"
      accessibilityRole="timer"
      // 15-second steps, not the second: a label that changes every second
      // churns the tree for TalkBack and tooling alike (a11y finding #5).
      accessibilityLabel={restAnnouncement(remaining, elapsed)}
      style={{
        borderRadius: radius.card, borderWidth: 1,
        borderColor: elapsed ? c.good : c.line2,
        backgroundColor: c.surface, padding: space.md, gap: space.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Text
          variant="stat"
          style={{ color: elapsed ? c.goodInk : c.ink }}
          testID="rest-remaining"
          // The ticking digits are for the eye; the timer's label speaks for them.
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          {elapsed ? 'Rest done' : formatRest(remaining)}
        </Text>
        <View style={{ flex: 1 }} />
        {(['-15', '+15'] as const).map((label) => (
          <Pressable
            key={label}
            onPress={() => onAdjust(label === '+15' ? 15 : -15)}
            accessibilityRole="button"
            accessibilityLabel={`${label === '+15' ? 'Add' : 'Remove'} 15 seconds`}
            hitSlop={8}
            style={{
              minWidth: 46, minHeight: 40, alignItems: 'center', justifyContent: 'center',
              borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
            }}
          >
            <Text variant="caption" tone="ink2">{label}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Skip rest"
          hitSlop={8}
          style={{ minWidth: 46, minHeight: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text variant="caption" tone="ink3">Skip</Text>
        </Pressable>
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
