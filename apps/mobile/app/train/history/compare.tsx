/**
 * F-06 · Session Comparison.
 *
 * Two or three finished sessions, newest first, aligned by exercise.
 *
 * **A missing cell is blank, never zero.** The endpoint returns `null` for an
 * exercise a session did not include, and this screen shows "—" for it. Reading
 * absence as 0 would draw a drop to nothing that never happened, which is the
 * single easiest way to make an honest chart lie.
 */
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import type { ComparisonCell, ComparisonRow } from '@volt/api-types';
import { Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { formatDuration, formatVolume } from '@/features/history/format';
import { useSessionComparison } from '@/lib/query/hooks';
import { space } from '@/theme';

export default function Compare() {
  const { sessions } = useLocalSearchParams<{ sessions: string }>();
  const ids = (sessions ?? '').split(',').filter(Boolean);
  const query = useSessionComparison(ids);

  return (
    <ScreenScaffold title="Compare" scroll={false}>
      <DataBoundary
        query={query}
        isEmpty={(d) => !d || d.sessions.length === 0}
        empty={{
          title: 'Nothing to compare',
          body: 'Pick two sessions from your history.',
        }}
      >
        {(data) => (
          <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
            <View style={{ flexDirection: 'row', gap: space.sm }} testID="compare-totals">
              {data.sessions.map((s) => (
                <Card key={s.id} style={{ flex: 1 }}>
                  <Text variant="caption" tone="ink3">{s.local_date}</Text>
                  <Text variant="body" style={{ marginTop: 4 }}>
                    {formatVolume(s.total_volume_kg) ?? '—'}
                  </Text>
                  <Text variant="caption" tone="ink3">
                    {s.set_count} set{s.set_count === 1 ? '' : 's'}
                  </Text>
                  <Text variant="caption" tone="ink3">
                    {formatDuration(s.duration_seconds) ?? '—'}
                  </Text>
                </Card>
              ))}
            </View>

            {data.exercises.map((row) => (
              <ExerciseComparison key={row.exercise_id} row={row} />
            ))}
          </ScrollView>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}

function ExerciseComparison({ row }: { row: ComparisonRow }) {
  return (
    <View>
      <Text variant="label" style={{ marginBottom: space.sm }}>
        {row.exercise_name ?? 'Exercise'}
      </Text>
      <Card>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {row.per_session.map((cell) => (
            <Cell key={cell.session_id} cell={cell} />
          ))}
        </View>
      </Card>
    </View>
  );
}

function Cell({ cell }: { cell: ComparisonCell }) {
  // `volume_kg === null` means the exercise was absent from that session. Not
  // the same as zero, and the screen must not flatten the two.
  const absent = cell.volume_kg === null || cell.volume_kg === undefined;
  return (
    <View style={{ flex: 1 }} accessibilityLabel={absent ? 'Not performed' : undefined}>
      <Text variant="body">{absent ? '—' : (formatVolume(cell.volume_kg) ?? '0 kg')}</Text>
      <Text variant="caption" tone="ink3">
        {absent
          ? 'not performed'
          : cell.best_set?.load_kg
            ? `best ${cell.best_set.load_kg} × ${cell.best_set.reps ?? '—'}`
            : `${cell.set_count ?? 0} sets`}
      </Text>
    </View>
  );
}
