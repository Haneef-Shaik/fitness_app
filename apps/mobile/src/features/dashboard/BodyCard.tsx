/**
 * B-01 · the weight card: the latest figure WITH its date (an old weigh-in is
 * never shown as if it were fresh), the 7-day change, where the goal stands,
 * and a button to log today.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { BodyCard as BodyCardData, GoalCard } from '@fitlog/api-types';
import { Button, Card, Text } from '@/ui';
import { changeOver, sinceLabel } from '@/features/body/format';
import { journeyLine } from '@/features/body/JourneyCard';
import { space } from '@/theme';

export function BodyCard({ card, goal, today }: { card: BodyCardData; goal?: GoalCard; today: string }) {
  const line = goal ? journeyLine(goal, today) : null;
  const loggedToday = card.today !== null && card.today !== undefined;
  const change = changeOver(card.change_7d, card.unit, '7 days');

  return (
    <Card
      hero
      label="Weight"
      right={card.latest ? (
        <Text variant="caption" tone="ink3">{sinceLabel(card.latest.local_date, today)}</Text>
      ) : null}
    >
      {card.latest ? (
        <>
          <View
            accessible
            accessibilityLabel={`${card.latest.value.toFixed(1)} ${card.unit}${change ? `, ${change}` : ''}`}
            style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}
          >
            <Text variant="display" testID="body-latest">{card.latest.value.toFixed(1)}</Text>
            <Text variant="body" tone="ink3" weight="semi">{card.unit}</Text>
          </View>
          {change ? (
            <Text variant="caption" tone="ink2" style={{ marginTop: space.xs }}>{change}</Text>
          ) : null}
        </>
      ) : (
        <>
          <Text variant="h2" testID="body-empty">Track your weight to see the trend</Text>
          <Text variant="caption" tone="ink2" style={{ marginTop: space.xs }}>
            One entry a week is enough to see where you are going.
          </Text>
        </>
      )}
      {line ? (
        <Text variant="caption" tone="accent" weight="semi" style={{ marginTop: space.sm }} testID="body-goal">{line}</Text>
      ) : null}
      <Button
        title={loggedToday ? 'See your progress' : "Log today's weight"}
        icon={loggedToday ? 'trending-up-outline' : 'scale-outline'}
        kind="secondary" size="sm"
        style={{ marginTop: space.base }}
        testID="go-body"
        onPress={() => router.push(loggedToday ? '/progress' : '/progress/log')}
      />
    </Card>
  );
}
