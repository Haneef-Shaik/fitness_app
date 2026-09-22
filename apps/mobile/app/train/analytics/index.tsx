/**
 * G-01 · Analytics overview, and the entry to G-02 … G-07.
 *
 * Every card is a real number, not a teaser: a summary screen that only links
 * onward makes a user tap to learn nothing.
 */
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { Column, Meter, StatTile } from '@/ui/charts';
import { rangeOf, weekTick } from '@/features/analytics/range';
import { useAdherence, useWorkoutAnalytics } from '@/lib/query/hooks';
import { space } from '@/theme';

export default function AnalyticsOverview() {
  const range = useMemo(() => rangeOf(12), []);
  const volume = useWorkoutAnalytics({ ...range, groupBy: 'week' });
  const adherence = useAdherence(range);

  return (
    <ScreenScaffold title="Analytics">
      <View style={{ gap: space.lg }}>
        <DataBoundary
          query={volume}
          isEmpty={(d) => !d || d.buckets.length === 0}
          empty={{
            title: 'Nothing to chart yet',
            body: 'Finish a session and the trend starts here.',
          }}
        >
          {(data) => (
            <View>
              <Text variant="label" style={{ marginBottom: space.sm }}>Volume · 12 weeks</Text>
              <Card>
                <Column
                  testID="overview-volume"
                  data={data.buckets.map((b) => ({
                    label: b.start, value: b.volume_kg, tick: weekTick(b.start),
                  }))}
                  format={(v) => `${Math.round(v / 1000)}k`}
                />
              </Card>
              <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
                <StatTile
                  label="Total volume"
                  value={Math.round(data.total_volume_kg).toLocaleString('en-US')}
                  unit="kg"
                />
                <StatTile
                  label="Sessions"
                  value={String(data.buckets.reduce((n, b) => n + b.session_count, 0))}
                />
              </View>
            </View>
          )}
        </DataBoundary>

        <DataBoundary
          query={adherence}
          isEmpty={() => false}
          empty={{ title: 'No plan yet' }}
        >
          {(data) => (
            <Card>
              <Meter
                testID="overview-adherence"
                label="Adherence · 12 weeks"
                value={data.adherence ?? null}
                empty="No scheduled days yet — adherence needs a plan to measure against."
              />
            </Card>
          )}
        </DataBoundary>

        <View style={{ gap: space.sm }}>
          <Nav title="Muscle balance" body="Where the work actually went" to="/train/analytics/muscles" />
          <Nav title="Personal records" body="Your headline numbers" to="/train/analytics/records" />
          <Nav title="Frequency" body="How often each muscle gets trained" to="/train/analytics/frequency" />
          <Nav title="Adherence" body="Planned against completed" to="/train/analytics/adherence" />
        </View>
      </View>
    </ScreenScaffold>
  );
}

function Nav({ title, body, to }: { title: string; body: string; to: string }) {
  return (
    <Pressable
      onPress={() => router.push(to as never)}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${body}`}
    >
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="body">{title}</Text>
            <Text variant="caption" tone="ink3">{body}</Text>
          </View>
          <Text variant="title" tone="ink3">›</Text>
        </View>
      </Card>
    </Pressable>
  );
}
