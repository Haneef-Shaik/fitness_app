/**
 * The goal as a journey (I-01, G10): start → now → target, with milestones a
 * quarter of the way apart, the next one named, and a projected date.
 *
 * The projection is the domain's (`goalJourney`): the pace actually achieved
 * once there is a week of data, the chosen pace before that, and no date at
 * all when the trend is going the wrong way — said plainly, never as red
 * alarm (I11: a regression is never red).
 */
import React from 'react';
import { View } from 'react-native';
import type { GoalCard } from '@volt/api-types';
import { goalJourney } from '@volt/domain';
import { Card, Text } from '@/ui';
import { shortDate } from '@/features/dashboard/date';
import { font, space, useTheme } from '@/theme';

const kg = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)} kg`;

export function JourneyCard({ goal, today }: { goal: GoalCard; today: string }) {
  const { c } = useTheme();
  if (goal.direction === 'hold' || goal.start_value == null || !goal.start_date) return null;

  const j = goalJourney({
    start: goal.start_value, target: goal.target_value, direction: goal.direction as 'up' | 'down',
    startDate: goal.start_date, weeklyRate: goal.weekly_rate ?? null,
    current: goal.current_value ?? null, today,
  });
  const fill = Math.max(0, Math.min(1, j.progress ?? 0));

  const headline = j.done
    ? `Goal reached — ${kg(goal.target_value)}`
    : j.next
      ? `Next milestone: ${kg(j.next.value)}${goal.current_value != null ? ` · ${kg(Math.abs(goal.current_value - j.next.value))} to go` : ''}`
      : 'Log a weigh-in to start the journey';

  const projection = j.done ? null
    : j.pace === 'off-track' ? 'Moving away from the target lately — nothing to panic about; the trend over weeks is what counts.'
    : j.projectedDate ? `${j.pace === 'actual' ? 'At your current pace' : 'At your planned pace'} you'll reach ${kg(goal.target_value)} around ${shortDate(j.projectedDate, today)}.`
    : null;

  return (
    <Card testID="journey">
      <Text variant="label">Your journey</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: space.sm }}>
        <View>
          <Text variant="caption" tone="ink3">Start</Text>
          <Text variant="body" style={{ fontFamily: font.dataSemi }}>{kg(goal.start_value)}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text variant="caption" tone="ink3">Now</Text>
          <Text variant="title" style={{ fontFamily: font.dataSemi }} testID="journey-now">
            {goal.current_value != null ? kg(goal.current_value) : '—'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="caption" tone="ink3">Target</Text>
          <Text variant="body" style={{ fontFamily: font.dataSemi }}>{kg(goal.target_value)}</Text>
        </View>
      </View>

      {/* The track: filled to progress, with a marker at each milestone. */}
      <View
        // Inset by a marker's radius so the end markers stay inside the card.
        style={{ height: 28, justifyContent: 'center', marginTop: space.sm, marginHorizontal: 8 }}
        accessible
        accessibilityLabel={`${Math.round(fill * 100)} percent of the way. ${j.milestones.filter((m) => m.reached).length} of ${j.milestones.length} milestones reached.`}
      >
        <View style={{ height: 6, borderRadius: 3, backgroundColor: c.line }}>
          <View style={{ height: 6, borderRadius: 3, width: `${fill * 100}%`, backgroundColor: c.accent }} />
        </View>
        {j.milestones.map((m) => (
          <View
            key={m.value}
            testID={`milestone-${m.reached ? 'reached' : 'ahead'}`}
            style={{
              position: 'absolute', left: `${m.fraction * 100}%`, marginLeft: -8,
              width: 16, height: 16, borderRadius: 8, borderWidth: 2,
              borderColor: m.reached ? c.accent : c.line2, backgroundColor: m.reached ? c.accent : c.surface,
            }}
          />
        ))}
      </View>
      {/* Each label sits under its own marker; the last is pinned to the edge so it cannot overflow. */}
      <View style={{ height: 16, marginTop: 2, marginHorizontal: 8 }}>
        {j.milestones.map((m) => (
          <Text key={m.value} variant="caption" tone={m.reached ? 'accent' : 'ink3'}
            style={{
              position: 'absolute', width: 56, fontSize: 11,
              ...(m.fraction >= 0.95
                ? { right: 0, textAlign: 'right' as const }
                : { left: `${m.fraction * 100}%`, marginLeft: -28, textAlign: 'center' as const }),
            }}>
            {kg(m.value)}
          </Text>
        ))}
      </View>

      <Text variant="body" style={{ marginTop: space.md }} testID="journey-next">{headline}</Text>
      {projection ? (
        <Text variant="caption" tone="ink3" style={{ marginTop: 4 }} testID="journey-projection">{projection}</Text>
      ) : null}
    </Card>
  );
}
