/**
 * Loading placeholders shaped like the content they stand in for (00 §5.1):
 * never a centred spinner, never the word "Loading…" on a blank page.
 *
 * Static on purpose — a shimmer is motion for its own sake, and Reduce Motion
 * would have to switch it off anyway.
 */
import React from 'react';
import { View, type DimensionValue } from 'react-native';
import { radius, space, useTheme } from '@/theme';

export function Skeleton({
  width = '100%', height = 14, round = 6,
}: { width?: DimensionValue; height?: number; round?: number }) {
  const { c } = useTheme();
  return <View style={{ width, height, borderRadius: round, backgroundColor: c.surface2 }} />;
}

/** A card's worth of placeholder lines. One "Loading" stop for a screen reader. */
export function SkeletonCard({ lines = 3, testID = 'skeleton' }: { lines?: number; testID?: string }) {
  const { c } = useTheme();
  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      style={{
        backgroundColor: c.surface, borderWidth: 1, borderColor: c.line,
        borderRadius: radius.card, padding: space.base, gap: space.md,
      }}
    >
      <Skeleton width="40%" height={11} />
      <Skeleton width="70%" height={24} />
      {Array.from({ length: Math.max(0, lines - 2) }, (_, i) => (
        <Skeleton key={i} width={i % 2 ? '55%' : '85%'} />
      ))}
    </View>
  );
}
