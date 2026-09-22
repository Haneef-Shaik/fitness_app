/**
 * The legend. **Always present for ≥2 series** (05 §3), absent for one — where
 * it only restates the title.
 *
 * Labels wear ink tokens, never the series colour: the swatch carries the
 * colour and the text stays readable (05 §3.5).
 */
import { View } from 'react-native';
import { Text } from '../index';
import { assignSeries, seriesColor } from './series';
import { space, useTheme } from '../../theme';

export interface LegendSeries {
  key: string;
  label: string;
}

export function ChartLegend({ series }: { series: readonly LegendSeries[] }) {
  const { scheme } = useTheme();
  if (series.length < 2) return null;

  const { slots } = assignSeries(series.map((s) => s.key));

  return (
    <View
      testID="chart-legend"
      accessibilityRole="list"
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.sm }}
    >
      {series.map((s) => {
        const slot = slots.get(s.key);
        if (!slot) return null;
        return (
          <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{
              width: 10, height: 10, borderRadius: 3,
              backgroundColor: seriesColor(slot, scheme),
            }} />
            <Text variant="caption" tone="ink2">{s.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
