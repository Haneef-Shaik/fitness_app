/**
 * G-06 · Adherence — a meter plus a per-week dot strip.
 *
 * **PRD W07.7**: completed planned sessions ÷ planned sessions. Null when
 * nothing was planned, and the screen says "no plan yet" rather than drawing
 * 0% — someone without a program has not failed to adhere to anything.
 *
 * A missed week is an outline, never red (**I11**).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { DotStrip, Meter, type Dot } from '@/ui/charts';
import { rangeOf, weekTick } from '@/features/analytics/range';
import { useAdherence } from '@/lib/query/hooks';
import { space } from '@/theme';

export default function AdherenceScreen() {
  const range = useMemo(() => rangeOf(8), []);
  const query = useAdherence(range);

  return (
    <ScreenScaffold title="Adherence" subtitle="Last 8 weeks">
      <DataBoundary query={query} isEmpty={() => false} empty={{ title: 'No plan yet' }}>
        {(data) => {
          const dots: Dot[] = data.weeks.map((w) => ({
            key: String(w.week_start),
            label: weekTick(String(w.week_start)),
            state: w.planned === 0 ? 'none'
              : w.completed_planned >= w.planned ? 'done' : 'planned',
          }));
          return (
            <View style={{ gap: space.lg }}>
              <Card>
                <Meter
                  testID="adherence-meter"
                  label="Planned sessions completed"
                  value={data.adherence ?? null}
                  empty="Schedule a day in a program and this starts measuring."
                />
                {data.planned > 0 ? (
                  <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
                    {data.completed_planned} of {data.planned} planned sessions
                  </Text>
                ) : null}
              </Card>

              {dots.length > 0 ? (
                <View>
                  <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>By week</Text>
                  <Card>
                    <DotStrip testID="adherence-weeks" dots={dots} />
                  </Card>
                </View>
              ) : null}
            </View>
          );
        }}
      </DataBoundary>
    </ScreenScaffold>
  );
}
