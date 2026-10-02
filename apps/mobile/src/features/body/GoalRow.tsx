/**
 * One goal as a card (B-01, I-01): the kind of goal in words, its status, the
 * figure it is moving between, and how far along it is.
 *
 * Null is not zero: a goal with no measurement says so rather than drawing a
 * meter at 0%, and a goal going the wrong way says that rather than hiding
 * behind a short one (I11 — a regression is never red).
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { GoalCard } from '@fitlog/api-types';
import { Pressable } from '@/ui/Pressable';
import { Card, Meter, Pill, Text } from '@/ui';
import { goalStatusLabel, goalTypeLabel } from './goalLabels';
import { space } from '@/theme';

export function GoalRow({ goal }: { goal: GoalCard }) {
  const progress = goal.progress;
  const measured = progress !== null && progress !== undefined;
  const reached = measured && progress >= 1;
  const from = goal.current_value?.toFixed(1) ?? goal.start_value?.toFixed(1) ?? '—';

  return (
    <Pressable
      onPress={() => router.push(`/progress/goals/${goal.id}`)}
      accessibilityRole="button"
      accessibilityLabel={
        `${goalTypeLabel(goal.goal_type)}, ${goal.target_value} ${goal.target_unit}, `
        + (measured ? `${Math.round(progress * 100)} percent` : 'not measured yet')
      }
      testID={`goal-${goal.id}`}
    >
      <Card
        label={goalTypeLabel(goal.goal_type)}
        right={<Pill kind={reached ? 'good' : 'accent'}>{reached ? 'Reached' : goalStatusLabel(goal.status)}</Pill>}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text variant="stat">{from}</Text>
          <Text variant="caption" tone="ink3">→</Text>
          <Text variant="stat">{goal.target_value}</Text>
          <Text variant="caption" tone="ink3">{goal.target_unit}</Text>
        </View>

        {!measured ? (
          <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }} testID={`goal-${goal.id}-unmeasured`}>
            Log a measurement and this starts tracking.
          </Text>
        ) : (
          <View style={{ marginTop: space.md }}>
            <Meter value={Math.max(0, progress)} max={1} over={progress < 0} />
            <Text variant="caption" tone={progress < 0 ? 'serious' : 'ink3'} style={{ marginTop: 6 }}>
              {progress < 0
                ? 'Moving away from it at the moment'
                : `${Math.round(progress * 100)}% of the way`}
            </Text>
          </View>
        )}
      </Card>
    </Pressable>
  );
}
