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
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable } from '@/ui/Pressable';
import { Button, Card, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { SectionHeader } from '@/ui/SectionHeader';
import { Line } from '@/ui/charts';
import { delta, weight } from '@/features/body/format';
import { useBodyMetrics, useBodySeries, useDeleteBodyMetric, useProfile } from '@/lib/query/hooks';
import { formatClockTime } from '@/lib/datetime';
import { humanDate } from '@/lib/datetime/humanDate';
import { font, radius, space, useTheme } from '@/theme';

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
  const { c } = useTheme();
  const [range, setRange] = useState<string>('90');
  const from = since(Number(range));
  // A label, not a decision (I7): which day it is only matters for the words.
  const today = new Date().toISOString().slice(0, 10);

  const series = useBodySeries('body_weight', { from });
  const entries = useBodyMetrics('body_weight', { from });
  const remove = useDeleteBodyMetric();
  // Times are the profile's wall clock, like its days (I7) — not the UTC in the ISO string.
  const timeZone = useProfile().data?.timezone;

  return (
    <ScreenScaffold
      title="Weight"
      footer={<Button title="Log a weigh-in" icon="add" size="lg" onPress={() => router.push('/progress/log')} />}
    >
      <DataBoundary
        query={series}
        isEmpty={(s) => s.points.length === 0}
        empty={{
          icon: 'scale-outline',
          title: 'No weight logged yet',
          body: 'One entry a week is enough to see where you are going.',
          action: { label: 'Log your weight', onPress: () => router.push('/progress/log') },
        }}
      >
        {(data) => (
          <View style={{ gap: space.base }}>
            {/* Which range is on screen has to be visible, not remembered. */}
            <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: c.surface, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line, padding: 3 }}>
              {RANGES.map((r) => {
                const on = range === r.value;
                return (
                  <Pressable
                    key={r.value}
                    onPress={() => setRange(r.value)}
                    accessibilityRole="tab"
                    accessibilityLabel={r.label}
                    accessibilityState={{ selected: on }}
                    testID={`range-${r.value}`}
                    style={{ flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.row, backgroundColor: on ? c.accent : 'transparent' }}
                  >
                    <Text variant="caption" weight="semi" style={{ color: on ? c.accentInk : c.ink2 }}>{r.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Card hero label="Weight vs 7-day average">
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.md, flexWrap: 'wrap' }}>
                <Text variant="display" testID="trend-latest">
                  {weight(data.latest?.value, data.unit)}
                </Text>
                {delta(data.change, data.unit) ? (
                  <Text variant="caption" tone="ink2" testID="trend-change">
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
              <SectionHeader title="Every entry" detail={`${entries.data?.length ?? 0} in this range`} />
              <Card pad="none">
                {(entries.data ?? []).map((row, i, all) => {
                  const counted = data.points.some((p) => p.local_date === row.local_date && p.value === row.value);
                  return (
                    <View
                      key={String(row.id)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 60,
                        paddingHorizontal: space.md, paddingVertical: space.sm,
                        borderBottomWidth: i === all.length - 1 ? 0 : 1, borderBottomColor: c.line,
                      }}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text variant="body" weight="semi" style={{ fontFamily: font.dataSemi, fontSize: 18 }}>{weight(row.value, row.unit)}</Text>
                        <Text variant="caption" tone="ink3">
                          {humanDate(row.local_date, today)} · {formatClockTime(new Date(row.measured_at), timeZone)}
                        </Text>
                      </View>
                      {/* The one the chart and the goals use (Q5). */}
                      {counted ? <Pill kind="good" icon="checkmark">counted</Pill> : <Pill kind="mute">also logged</Pill>}
                      <Pressable
                        onPress={() => remove.mutate(String(row.id))}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${weight(row.value, row.unit)} from ${humanDate(row.local_date, today)}`}
                        testID={`delete-${row.id}`}
                        hitSlop={6}
                        style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.row }}
                      >
                        <Ionicons name="trash-outline" size={20} color={c.ink3} />
                      </Pressable>
                    </View>
                  );
                })}
              </Card>
            </View>
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
