/**
 * Sorted horizontal bar — comparing magnitude across ~8 muscle groups (G-02).
 *
 * Horizontal because the categories have names and names read horizontally;
 * a column chart with eight rotated labels is the alternative.
 *
 * Sorted by the SERVER. Sorting here as well would be a second ordering to keep
 * in step with the first.
 */
import { View } from 'react-native';
import { Text } from '../index';
import { radius, space, useTheme } from '../../theme';

export interface BarRow {
  key: string;
  label: string;
  value: number;
}

const FILL = { dark: '#3987E5', light: '#2A78D6' } as const;

export function HorizontalBar({
  data, format, testID,
}: {
  data: readonly BarRow[];
  format?: (v: number) => string;
  testID?: string;
}) {
  const { c, scheme } = useTheme();
  const max = Math.max(...data.map((d) => d.value), 0);
  const show = format ?? ((v: number) => `${Math.round(v).toLocaleString('en-US')} kg`);

  return (
    <View testID={testID} style={{ gap: space.sm }}>
      {data.map((d) => (
        <View key={d.key} accessibilityLabel={`${d.label}, ${show(d.value)}`}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text variant="caption" tone="ink2" style={{ flex: 1 }} numberOfLines={1}>
              {d.label}
            </Text>
            {/* Value in ink, never in the series colour (§3.5). */}
            <Text variant="caption" tone="ink3">{show(d.value)}</Text>
          </View>
          <View style={{
            height: 8, backgroundColor: c.sunken, borderRadius: radius.pill,
            marginTop: 3, overflow: 'hidden',
          }}>
            <View
              testID={`bar-${d.key}`}
              style={{
                width: `${(d.value / (max || 1)) * 100}%`,
                height: '100%',
                backgroundColor: FILL[scheme],
                borderRadius: radius.pill,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
