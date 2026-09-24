/**
 * I-01 · Progress overview.
 *
 * **Every empty state here is a sentence and a way out, never a zeroed chart.**
 * A new user has no weight, no goal and no measurements, and a screen of flat
 * lines at zero is worse than one that says what to do.
 *
 * "Last logged 18 days ago" is a fact, not a scold (the wireframe is explicit).
 */
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { NavGroup, NavRow } from '@/ui/NavRow';
import { Line } from '@/ui/charts';
import { GoalRow } from '../home';
import { delta, sinceLabel, weight } from '@/features/body/format';
import { useBodySeries, useCheckins, useDashboard } from '@/lib/query/hooks';
import { JourneyCard, weightGoalOf } from '@/features/body/JourneyCard';
import { CheckinCard } from '@/features/body/CheckinCard';
import { space } from '@/theme';

export default function Progress() {
  const board = useDashboard();
  const series = useBodySeries('body_weight');
  const checkins = useCheckins();

  // A tab root (00 §4): reached from the tab bar, so it has no back arrow.
  // Before the tab bar existed (G10) that made it a dead end.
  return (
    <ScreenScaffold
      root
      title="Progress"
      action={{ label: '+ Log', onPress: () => router.push('/progress/log') }}
      onRefresh={() => { void board.refetch(); void series.refetch(); void checkins.refetch(); }}
    >
      <DataBoundary query={board} isEmpty={() => false} empty={{ title: 'Nothing yet' }}>
        {(data) => {
          // The journey follows the active weight goal; other goals keep their rows below.
          const weightGoal = weightGoalOf(data.goals);
          return (
          <View style={{ gap: space.lg }}>
            {weightGoal ? <JourneyCard goal={weightGoal} today={data.local_date} /> : null}
            {checkins.data ? <CheckinCard data={checkins.data} /> : null}
            <Card>
              <Text variant="label">Weight</Text>
              {data.body.latest ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.md, marginTop: 6 }}>
                    <Text variant="display" style={{ fontSize: 30 }} testID="weight-latest">
                      {weight(data.body.latest.value, data.body.unit)}
                    </Text>
                    {delta(data.body.change_30d, data.body.unit) ? (
                      <Text variant="caption" tone="ink3">
                        {delta(data.body.change_30d, data.body.unit)} in 30 days
                      </Text>
                    ) : null}
                  </View>

                  {(series.data?.points.length ?? 0) >= 2 ? (
                    <View style={{ marginTop: space.base }}>
                      <Line
                        testID="weight-line"
                        data={(series.data?.points ?? []).map((p) => ({
                          label: p.local_date, value: p.value,
                        }))}
                        // The 7-day mean drawn behind, in muted grey. NOT a
                        // second axis — 05 §3 prohibits dual-axis charts, and
                        // this is the same measure at a different smoothing.
                        comparison={(series.data?.points ?? []).map((p) => ({
                          label: p.local_date, value: p.moving_average ?? p.value,
                        }))}
                        format={(v) => v.toFixed(1)}
                      />
                    </View>
                  ) : (
                    // One point is not a trend, and drawing it as one is a lie.
                    <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }} testID="weight-one-entry">
                      One more entry and the trend appears.
                    </Text>
                  )}

                  <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }} testID="weight-since">
                    {sinceLabel(data.body.latest.local_date, data.local_date)}
                  </Text>
                </>
              ) : (
                <>
                  <Text variant="body" style={{ marginTop: 6 }} testID="weight-empty">
                    Track your weight to see the trend
                  </Text>
                  {/* No chart and no zero line — there is nothing to draw. */}
                  <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                    One entry a week is enough.
                  </Text>
                </>
              )}
              <Button
                title="Log today"
                kind="ghost"
                size="sm"
                style={{ marginTop: space.base }}
                testID="log-today"
                onPress={() => router.push('/progress/log')}
              />
              {data.body.latest ? (
                <Button
                  title="Weight trend"
                  kind="ghost"
                  size="sm"
                  style={{ marginTop: space.sm }}
                  testID="go-weight-trend"
                  onPress={() => router.push('/progress/weight')}
                />
              ) : null}
            </Card>

            <View>
              <Text variant="label" style={{ marginBottom: space.sm }}>Goals</Text>
              {(data.goals ?? []).length === 0 ? (
                <Card>
                  <Text variant="body" testID="goals-empty">
                    Set a goal to track progress against
                  </Text>
                  <Button
                    title="Set a goal"
                    kind="ghost"
                    size="sm"
                    style={{ marginTop: space.base }}
                    testID="go-new-goal"
                    onPress={() => router.push('/progress/goals/new')}
                  />
                </Card>
              ) : (
                (data.goals ?? []).map((goal) => (
                  <GoalRow key={String(goal.id)} goal={goal} />
                ))
              )}
            </View>

            <NavGroup>
              <NavRow icon="flag-outline" label="All goals" testID="go-goals"
                onPress={() => router.push('/progress/goals')} />
              <NavRow icon="resize-outline" label="Measurements" testID="go-measurements"
                onPress={() => router.push('/progress/measurements/waist_cm')} />
              <NavRow icon="images-outline" label="Progress photos" testID="go-photos"
                onPress={() => router.push('/progress/photos')} />
            </NavGroup>
          </View>
          );
        }}
      </DataBoundary>
    </ScreenScaffold>
  );
}
