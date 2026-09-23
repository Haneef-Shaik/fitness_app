/**
 * I-03 · Weight trend.
 *
 * **Two lines, one measure, one axis.** The daily figure and its 7-day mean are
 * the same quantity at two smoothings, drawn on the same scale. 05 §3 prohibits
 * dual-axis charts, and this is the screen where the temptation to add one —
 * weight against calories — is strongest. H-14 keeps them as two stacked charts
 * sharing an x-axis for exactly the same reason.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { Line } from '@/ui/charts';
import { delta, weight } from '@/features/body/format';
import { useBodyMetrics, useBodySeries, useDeleteBodyMetric } from '@/lib/query/hooks';
import { space } from '@/theme';

const RANGES = [
  { value: '30', label: '30 days' },
  { value: '90', label: '3 months' },
  { value: '365', label: 'A year' },
] as const;

function since(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function WeightTrend() {
  const [range, setRange] = useState<string>('90');
  const from = since(Number(range));

  const series = useBodySeries('body_weight', { from });
  const entries = useBodyMetrics('body_weight', { from });
  const remove = useDeleteBodyMetric();

  return (
    <ScreenScaffold
      title="Weight"
      action={{ label: '+ Log', onPress: () => router.push('/progress/log') }}
    >
      <DataBoundary
        query={series}
        isEmpty={(s) => s.points.length === 0}
        empty={{
          title: 'No weight logged yet',
          body: 'One entry a week is enough to see where you are going.',
          action: { label: 'Log your weight', onPress: () => router.push('/progress/log') },
        }}
      >
        {(data) => (
          <View style={{ gap: space.lg }}>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {RANGES.map((r) => (
                <Button
                  key={r.value}
                  title={r.label}
                  kind="ghost"
                  size="sm"
                  style={{ flex: 1 }}
                  testID={`range-${r.value}`}
                  onPress={() => setRange(r.value)}
                />
              ))}
            </View>

            <Card hero>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.md }}>
                <Text variant="display" style={{ fontSize: 32 }} testID="trend-latest">
                  {weight(data.latest?.value, data.unit)}
                </Text>
                {delta(data.change, data.unit) ? (
                  <Text variant="caption" tone="ink3" testID="trend-change">
                    {delta(data.change, data.unit)} over this range
                  </Text>
                ) : null}
              </View>

              {data.points.length >= 2 ? (
                <View style={{ marginTop: space.base }}>
                  <Line
                    testID="trend-line"
                    data={data.points.map((p) => ({ label: p.local_date, value: p.value }))}
                    comparison={data.points.map((p) => ({
                      label: p.local_date, value: p.moving_average ?? p.value,
                    }))}
                    format={(v) => v.toFixed(1)}
                  />
                  <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
                    The pale line is the 7-day average. Day to day, weight moves on water.
                  </Text>
                </View>
              ) : (
                <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }} testID="trend-one-entry">
                  One more entry and the trend appears.
                </Text>
              )}
            </Card>

            <View>
              <Text variant="label" style={{ marginBottom: space.sm }}>Every entry</Text>
              {(entries.data ?? []).map((row) => (
                <Card key={String(row.id)} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <View style={{ flex: 1 }}>
                      <Text variant="body">{weight(row.value, row.unit)}</Text>
                      <Text variant="caption" tone="ink3">
                        {row.local_date} · {row.measured_at.slice(11, 16)}
                      </Text>
                    </View>
                    {data.points.some(
                      (p) => p.local_date === row.local_date && p.value === row.value,
                    ) ? (
                      // The one the chart and the goals use (Q5).
                      <Pill kind="accent">counted</Pill>
                    ) : (
                      <Pill kind="mute">also logged</Pill>
                    )}
                    <Button
                      title="Delete"
                      kind="danger"
                      size="sm"
                      testID={`delete-${row.id}`}
                      onPress={() => remove.mutate(String(row.id))}
                    />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
