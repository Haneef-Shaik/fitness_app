/**
 * G-05 · Frequency — a week × muscle heatmap.
 *
 * Counts SESSIONS, not exercises: a three-movement chest day is one chest day.
 * The sequential ramp carries magnitude, and zero is an empty cell rather than
 * the palest blue — "did not train this" must not look like "trained it once".
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { Heatmap } from '@/ui/charts';
import { rangeOf, weekTick } from '@/features/analytics/range';
import { useFrequency } from '@/lib/query/hooks';
import { space } from '@/theme';

/** Only the top-level groups — a heatmap of 22 rows on a phone is a wall. */
const TOP_LEVEL = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];

export default function FrequencyScreen() {
  const range = useMemo(() => rangeOf(8), []);
  const query = useFrequency(range);

  return (
    <ScreenScaffold title="Frequency" subtitle="Last 8 weeks">
      <DataBoundary
        query={query}
        isEmpty={(d) => !d || d.cells.length === 0}
        empty={{
          title: 'Nothing to show yet',
          body: 'Train a few sessions and the pattern appears.',
        }}
      >
        {(data) => {
          const weeks = data.weeks.map(String);
          const rows = TOP_LEVEL.map((slug) => {
            const named = data.cells.find((c) => c.slug === slug);
            return {
              key: slug,
              label: named?.name ?? slug,
              values: weeks.map((w) =>
                data.cells.find((c) => c.slug === slug && String(c.week_start) === w)?.sessions ?? 0),
            };
          });
          return (
            <View style={{ gap: space.lg }}>
              <Card>
                <Heatmap testID="frequency-heatmap" rows={rows} columns={weeks.map(weekTick)} />
              </Card>
              <Text variant="caption" tone="ink3">
                One square per week. A session counts once per muscle, however many
                exercises hit it.
              </Text>
            </View>
          );
        }}
      </DataBoundary>
    </ScreenScaffold>
  );
}
