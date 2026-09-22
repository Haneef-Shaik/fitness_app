/**
 * G-03 / G-07 · Exercise progression — a line with emphasis.
 *
 * One axis, never two (05 §3.4). The series states its `formula_version`,
 * because plotting values from different Epley versions as one line is wrong in
 * a way nobody can see (**I5**).
 */
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import { Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { Line, StatTile } from '@/ui/charts';
import { rangeOf, weekTick } from '@/features/analytics/range';
import { useExerciseProgression } from '@/lib/query/hooks';
import { space } from '@/theme';

export default function ExerciseProgressionScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const range = useMemo(() => rangeOf(26), []);
  const query = useExerciseProgression(exerciseId ?? '', range);

  return (
    <ScreenScaffold title="Progression" subtitle="Last 6 months">
      <DataBoundary
        query={query}
        isEmpty={(d) => !d || d.points.length === 0}
        empty={{
          title: 'Not performed yet',
          body: 'Log this exercise and its trend starts here.',
        }}
      >
        {(data) => {
          const points = data.points
            .filter((p) => p.e1rm_kg !== null && p.e1rm_kg !== undefined)
            .map((p) => ({ label: weekTick(String(p.local_date)), value: p.e1rm_kg as number }));
          const best = points.reduce((m, p) => Math.max(m, p.value), 0);
          const latest = points[points.length - 1]?.value ?? 0;
          return (
            <View style={{ gap: space.lg }}>
              <Text variant="label">{data.exercise_name ?? 'Exercise'}</Text>
              <Card>
                <Line testID="progression-line" data={points} />
              </Card>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <StatTile label="Latest e1RM" value={String(Math.round(latest))} unit="kg" />
                <StatTile label="Best e1RM" value={String(Math.round(best))} unit="kg" />
              </View>
              <Text variant="caption" tone="ink3">
                Estimated with {data.formula_version}. Warm-ups are excluded.
              </Text>
            </View>
          );
        }}
      </DataBoundary>
    </ScreenScaffold>
  );
}
