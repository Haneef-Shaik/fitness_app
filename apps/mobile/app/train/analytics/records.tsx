/**
 * G-04 · Personal records — a KPI row of stat tiles.
 *
 * No colour job (05 §3.4): the numbers are the point, and a coloured tile
 * spends a hue on decoration.
 *
 * The e1RM formula version is shown. A board mixing versions is silently wrong,
 * and the only defence is saying which one produced these (**I5**).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { StatTile } from '@/ui/charts';
import { rangeOf } from '@/features/analytics/range';
import { usePersonalRecords } from '@/lib/query/hooks';
import { space } from '@/theme';

export default function Records() {
  const range = useMemo(() => rangeOf(52), []);
  const query = usePersonalRecords(range);

  return (
    <ScreenScaffold title="Personal records" subtitle="Last 12 months">
      <DataBoundary
        query={query}
        empty={{
          title: 'No records yet',
          body: 'Log a working set and your first numbers appear here.',
        }}
      >
        {(rows) => (
          <View style={{ gap: space.lg }}>
            {rows.map((r) => (
              <View key={String(r.exercise_id)}>
                <Text variant="label" style={{ marginBottom: space.sm }} numberOfLines={1}>
                  {r.exercise_name ?? 'Exercise'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                  <StatTile
                    label="Heaviest"
                    value={r.max_load_kg === null || r.max_load_kg === undefined
                      ? '—' : String(r.max_load_kg)}
                    unit="kg"
                  />
                  <StatTile
                    label="Best e1RM"
                    value={r.estimated_1rm_kg === null || r.estimated_1rm_kg === undefined
                      ? '—' : String(Math.round(r.estimated_1rm_kg))}
                    unit="kg"
                  />
                </View>
              </View>
            ))}
            <Text variant="caption" tone="ink3">
              e1RM estimated with {rows[0]?.formula_version ?? 'epley_v1'}. Warm-ups
              never count towards a record.
            </Text>
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
