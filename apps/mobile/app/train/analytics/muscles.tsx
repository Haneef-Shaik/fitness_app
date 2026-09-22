/**
 * G-02 · Muscle balance — a sorted horizontal bar.
 *
 * Weighted primary ×1.0, secondary ×0.5 (**D7 / I4**) and rolled up the muscle
 * tree, both decided by the server. The screen states the weighting rather than
 * leaving a user to wonder why a triceps number looks halved: it is halved, on
 * purpose.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { HorizontalBar } from '@/ui/charts';
import { rangeOf } from '@/features/analytics/range';
import { useMuscleVolume } from '@/lib/query/hooks';
import { space } from '@/theme';

export default function MuscleBalance() {
  const range = useMemo(() => rangeOf(12), []);
  const query = useMuscleVolume(range);

  return (
    <ScreenScaffold title="Muscle balance" subtitle="Last 12 weeks">
      <DataBoundary
        query={query}
        empty={{
          title: 'No volume yet',
          body: 'Finish a session and this fills in.',
        }}
      >
        {(rows) => (
          <View style={{ gap: space.lg }}>
            <Card>
              {/* Sorted by the server; re-sorting here would be a second order
                  to keep in step. */}
              <HorizontalBar
                testID="muscle-volume"
                data={rows.map((r) => ({ key: r.slug, label: r.name, value: r.volume_kg }))}
              />
            </Card>
            <Text variant="caption" tone="ink3">
              Counted as primary ×1.0 and secondary ×0.5, and rolled up — work on
              Upper Chest counts as Chest too.
            </Text>
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
