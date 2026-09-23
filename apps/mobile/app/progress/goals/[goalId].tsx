/**
 * J-03 · Goal detail, and J-04's outcome as an inline state.
 *
 * **A goal that has been reached says so, and offers to close.** A goal quietly
 * sitting at 100% is how somebody's app stops meaning anything — and a goal
 * moving the wrong way says that too, rather than hiding behind a short meter.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Button, Card, Meter, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { weight } from '@/features/body/format';
import { useGoal, useUpdateGoal } from '@/lib/query/hooks';
import { space } from '@/theme';

export default function GoalDetail() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const query = useGoal(goalId ?? '');
  const update = useUpdateGoal();

  return (
    <ScreenScaffold title="Goal">
      <DataBoundary
        query={query}
        isEmpty={(g) => !g}
        empty={{ title: 'That goal no longer exists.' }}
      >
        {(goal) => {
          const progress = goal.progress;
          const reached = progress !== null && progress !== undefined && progress >= 1;
          const regressing = progress !== null && progress !== undefined && progress < 0;

          return (
            <View style={{ gap: space.lg }}>
              <Card hero>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="label">{goal.goal_type.replace('_', ' ')}</Text>
                  <Pill kind={reached ? 'good' : 'accent'}>{goal.status}</Pill>
                </View>
                <Text variant="display" style={{ fontSize: 28, marginTop: 8 }}>
                  {weight(goal.current_value ?? goal.start_value, goal.target_unit)} →{' '}
                  {weight(goal.target_value, goal.target_unit)}
                </Text>

                {progress === null || progress === undefined ? (
                  <Text variant="caption" tone="ink3" style={{ marginTop: space.md }} testID="goal-unmeasured">
                    Log a measurement and this starts tracking.
                  </Text>
                ) : (
                  <View style={{ marginTop: space.md }}>
                    <Meter value={Math.max(0, progress)} max={1} over={regressing} />
                    <Text
                      variant="caption"
                      tone={regressing ? 'serious' : 'ink3'}
                      style={{ marginTop: 4 }}
                      testID="goal-progress"
                    >
                      {regressing
                        ? 'Moving away from it at the moment'
                        : `${Math.round(progress * 100)}% of the way`}
                    </Text>
                  </View>
                )}
              </Card>

              {reached && goal.status === 'active' ? (
                <Card>
                  {/* J-04, inline. A goal that stays open after it is met stops
                      meaning anything. */}
                  <Text variant="body" testID="goal-reached">You got there.</Text>
                  <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                    Close it and set the next one, or leave it open to hold the line.
                  </Text>
                  <Button
                    title="Mark it done"
                    style={{ marginTop: space.base }}
                    testID="goal-complete"
                    onPress={() => update.mutate({
                      id: String(goal.id), body: { status: 'completed' },
                    })}
                  />
                </Card>
              ) : null}

              <Button
                title={goal.status === 'paused' ? 'Resume' : 'Pause'}
                kind="ghost"
                testID="goal-pause"
                onPress={() => update.mutate({
                  id: String(goal.id),
                  body: { status: goal.status === 'paused' ? 'active' : 'paused' },
                })}
              />
              <Button
                title="New goal"
                kind="ghost"
                testID="goal-new"
                onPress={() => router.push('/progress/goals/new')}
              />
            </View>
          );
        }}
      </DataBoundary>
    </ScreenScaffold>
  );
}
