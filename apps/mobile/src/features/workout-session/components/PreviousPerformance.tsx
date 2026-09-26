/**
 * E-03 region ① · Previous performance — **AC-04**.
 *
 * *"The previous-performance strip shows the prior session's sets before any
 * input."* Always visible, never behind a tap: the number a user is trying to
 * beat is the reason they are looking at this screen, and making them tap for it
 * is making them stop mid-workout.
 *
 * A failure degrades to a retry chip and **never blocks entry** — the set they
 * are about to do does not depend on knowing the last one.
 */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { Pressable } from '@/ui/Pressable';
import type { PreviousPerformance as Previous } from '@fitlog/api-types';
import { Text } from '@/ui';
import { formatServerDate } from '@/lib/datetime';
import { font, radius, space, useTheme } from '@/theme';

export interface PreviousPerformanceStripProps {
  data: Previous | null | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function PreviousPerformanceStrip({
  data, isPending, isError, onRetry,
}: PreviousPerformanceStripProps) {
  const { c } = useTheme();

  const frame = (children: React.ReactNode, testID: string) => (
    <View
      testID={testID}
      style={{
        borderRadius: radius.row, borderWidth: 1, borderColor: c.line,
        backgroundColor: c.sunken, padding: space.md, gap: 6,
      }}
    >
      {children}
    </View>
  );

  if (isPending) {
    // A skeleton, not a spinner: entry stays fully usable underneath.
    return frame(
      <Text variant="caption" tone="ink3">Last time…</Text>,
      'previous-loading',
    );
  }

  if (isError) {
    return frame(
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Text variant="caption" tone="ink3" style={{ flex: 1 }}>
          Couldn't load last time
        </Text>
        <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="Retry last time" hitSlop={8}>
          <Text variant="caption" style={{ color: c.accent }}>Retry</Text>
        </Pressable>
      </View>,
      'previous-error',
    );
  }

  if (!data) {
    // The first-time state: a prompt, not an error (the server returns null).
    return frame(
      <Text variant="caption" tone="ink3">First time doing this one.</Text>,
      'previous-never',
    );
  }

  const working = (data.sets ?? []).filter((s) => s.set_type !== 'warmup');

  return frame(
    <>
      <Text variant="caption" tone="ink3">
        Last time · {formatServerDate(data.local_date)}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View
          style={{ flexDirection: 'row', gap: space.md }}
          accessibilityLabel={
            `Last time, ${formatServerDate(data.local_date)}: `
            + working.map((s) => `${s.load_kg ?? '—'} by ${s.reps ?? '—'}`).join(', ')
          }
        >
          {working.length === 0 ? (
            <Text variant="caption" tone="ink3">Warm-ups only</Text>
          ) : working.map((s) => (
            <Text key={s.id} variant="body" style={{ fontFamily: font.dataSemi }}>
              {s.load_kg ?? '—'} × {s.reps ?? '—'}
            </Text>
          ))}
        </View>
      </ScrollView>
    </>,
    'previous-performance',
  );
}
