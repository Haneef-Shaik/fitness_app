/**
 * I-04 · One measurement over time.
 *
 * The same shape as I-03 for any other metric key, because "waist" and "weight"
 * are the same question asked of a different number — and a second bespoke
 * chart screen is how a design system stops being one.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { Line } from '@/ui/charts';
import { delta, metricLabel, metricUnit } from '@/features/body/format';
import { useBodySeries } from '@/lib/query/hooks';
import { space } from '@/theme';

export default function MeasurementDetail() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const metricKey = key ?? 'waist_cm';
  const series = useBodySeries(metricKey);
  const unit = metricUnit(metricKey);

  return (
    <ScreenScaffold
      title={metricLabel(metricKey)}
      action={{ label: '+ Log', onPress: () => router.push('/progress/log') }}
    >
      <DataBoundary
        query={series}
        isEmpty={(s) => s.points.length === 0}
        empty={{
          title: `No ${metricLabel(metricKey).toLowerCase()} logged yet`,
          action: { label: 'Log one', onPress: () => router.push('/progress/log') },
        }}
      >
        {(data) => (
          <View style={{ gap: space.lg }}>
            <Card hero>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.md }}>
                <Text variant="display" style={{ fontSize: 30 }} testID="measurement-latest">
                  {data.latest?.value.toFixed(1)} {unit}
                </Text>
                {delta(data.change, unit) ? (
                  <Text variant="caption" tone="ink3">{delta(data.change, unit)}</Text>
                ) : null}
              </View>

              {data.points.length >= 2 ? (
                <View style={{ marginTop: space.base }}>
                  <Line
                    testID="measurement-line"
                    data={data.points.map((p) => ({ label: p.local_date, value: p.value }))}
                    format={(v) => v.toFixed(1)}
                  />
                </View>
              ) : (
                <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
                  One more entry and the trend appears.
                </Text>
              )}
            </Card>
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
