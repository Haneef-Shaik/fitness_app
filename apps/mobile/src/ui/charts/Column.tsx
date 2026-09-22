/**
 * Column chart — session volume over time (G-02), per 05 §3.4.
 *
 * Sequential hue, because the data's job is magnitude over time rather than
 * comparing named categories.
 *
 * Two rules from §3.5 that are easy to lose:
 *   - bars are rounded at the DATA END only, square at the baseline
 *   - **selective** direct labels — first, last and max. Never every point.
 */
import { View } from 'react-native';
import { Text } from '../index';
import { space, useTheme } from '../../theme';

export interface ColumnPoint {
  label: string;
  value: number;
  /** Shown on the axis; defaults to `label`. */
  tick?: string;
}

export interface ColumnProps {
  data: readonly ColumnPoint[];
  height?: number;
  format?: (v: number) => string;
  testID?: string;
}

/** The sequential blue ramp (05 §3.2), mid-range so it reads on both surfaces. */
const FILL = { dark: '#3987E5', light: '#2A78D6' } as const;

export function Column({ data, height = 140, format, testID }: ColumnProps) {
  const { c, scheme } = useTheme();
  const max = Math.max(...data.map((d) => d.value), 0);
  const show = format ?? ((v: number) => Math.round(v).toLocaleString('en-US'));

  // First, last and max — and only those. A number on every column is noise at
  // any width a phone has.
  const maxIndex = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? -1) ? i : best), 0);
  const labelled = new Set([0, data.length - 1, maxIndex].filter((i) => i >= 0));

  return (
    <View testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height }}>
        {data.map((d, i) => {
          // `max || 1` so an all-zero range renders flat rather than dividing
          // by zero — a fresh account opens on exactly that.
          const ratio = d.value / (max || 1);
          return (
            <View key={`${d.label}-${i}`} style={{ flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              {labelled.has(i) && d.value > 0 ? (
                <Text testID={`column-value-${i}`} variant="caption" tone="ink3" style={{ marginBottom: 2 }}>
                  {show(d.value)}
                </Text>
              ) : null}
              <View
                testID={`column-bar-${i}`}
                accessibilityLabel={`${d.label}, ${show(d.value)}`}
                style={{
                  width: '100%',
                  // A zero bar still draws a 2px stub: the column exists and
                  // read nothing, which is different from not being there.
                  height: Math.max(2, ratio * (height - 20)),
                  backgroundColor: d.value > 0 ? FILL[scheme] : c.line2,
                  borderTopLeftRadius: 4, borderTopRightRadius: 4,
                }}
              />
            </View>
          );
        })}
      </View>
      {/* Horizontal hairline only — no vertical grid, no chart border (§3.5). */}
      <View style={{ height: 1, backgroundColor: c.line, marginTop: 2 }} />
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
        {data.map((d, i) => (
          <Text
            key={`tick-${d.label}-${i}`}
            variant="caption"
            tone="ink3"
            numberOfLines={1}
            style={{ flex: 1, textAlign: 'center', fontSize: 9 }}
          >
            {labelled.has(i) ? (d.tick ?? d.label) : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}
