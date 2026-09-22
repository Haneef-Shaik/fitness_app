/**
 * Heatmap — magnitude over a grid: week x muscle frequency (G-05).
 *
 * Uses the SEQUENTIAL ramp (05 §3.2), and for ordinal use starts no lighter
 * than `#86B6EF` on light and no darker than `#184F95` on dark — a tier that
 * disappears into the surface is not a tier.
 *
 * Zero is drawn as an empty cell rather than the palest blue: "did not train
 * this" and "trained this a little" must not look alike.
 */
import { View } from 'react-native';
import { Text } from '../index';
import { radius, space, useTheme } from '../../theme';

const RAMP = ['#86B6EF', '#5598E7', '#3987E5', '#2A78D6', '#184F95'] as const;

export interface HeatmapRow {
  key: string;
  label: string;
  /** One value per column, same length as `columns`. */
  values: readonly number[];
}

export function Heatmap({
  rows, columns, testID,
}: {
  rows: readonly HeatmapRow[];
  columns: readonly string[];
  testID?: string;
}) {
  const { c } = useTheme();
  const max = Math.max(...rows.flatMap((r) => [...r.values]), 0);

  const tier = (v: number): string | null => {
    if (v <= 0) return null;
    const index = Math.min(RAMP.length - 1, Math.floor((v / (max || 1)) * RAMP.length));
    return RAMP[index] ?? RAMP[0];
  };

  return (
    <View testID={testID}>
      <View style={{ flexDirection: 'row', gap: 3, marginLeft: 76, marginBottom: 3 }}>
        {columns.map((col) => (
          <Text key={col} variant="caption" tone="ink3"
                style={{ flex: 1, textAlign: 'center', fontSize: 9 }} numberOfLines={1}>
            {col}
          </Text>
        ))}
      </View>
      {rows.map((row) => (
        <View key={row.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 3 }}>
          <Text variant="caption" tone="ink2" numberOfLines={1} style={{ width: 73 }}>
            {row.label}
          </Text>
          {row.values.map((v, i) => {
            const fill = tier(v);
            return (
              <View
                key={`${row.key}-${i}`}
                testID={`cell-${row.key}-${i}`}
                accessibilityLabel={
                  `${row.label}, ${columns[i] ?? i}, ${v} session${v === 1 ? '' : 's'}`
                }
                style={{
                  flex: 1, height: 22, borderRadius: radius.row / 2,
                  backgroundColor: fill ?? c.sunken,
                  borderWidth: fill ? 0 : 1, borderColor: c.line,
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}
