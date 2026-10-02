/**
 * B-01 · the training card: what today's training looks like and the one
 * button that starts (or resumes) it.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { TrainingCard as TrainingCardData } from '@fitlog/api-types';
import { Button, Card, Pill, Text } from '@/ui';
import { count, kcal } from '@/features/nutrition/format';
import { relativeDay } from '@/features/history/format';
import { space } from '@/theme';

/** "Trained today", "Trained yesterday", "Last 5 days ago" — never "Last yesterday". */
function lastTrained(when: string): string {
  const lower = when.toLowerCase();
  return lower === 'today' || lower === 'yesterday' ? `Trained ${lower}` : `Last ${lower}`;
}

export function TrainingCard({ card, today }: { card: TrainingCardData; today: string }) {
  const empty = card.sessions_today === 0 && !card.last_session;
  const trainedToday = card.sessions_today > 0;
  const last = card.last_session ? lastTrained(relativeDay(card.last_session.local_date, today)) : null;

  if (card.active_session_id) {
    const id = card.active_session_id;
    return (
      <Card hero accent label="Today's workout" labelTone="accent" right={<Pill kind="accent" icon="flash">In progress</Pill>}>
        <Text variant="h2">Workout in progress</Text>
        <Text variant="caption" tone="ink2" style={{ marginTop: space.xs }}>Pick up where you left off.</Text>
        <Button
          title="Resume workout" icon="play" style={{ marginTop: space.base }}
          testID="resume-session" onPress={() => router.push(`/session/${id}`)}
        />
      </Card>
    );
  }

  if (empty) {
    return (
      <Card hero label="Today's workout" labelTone="accent">
        <Text variant="h2" testID="training-empty">Your first workout</Text>
        <Text variant="caption" tone="ink2" style={{ marginTop: space.xs }}>
          Start empty or from a program. A set takes one tap.
        </Text>
        <Button
          title="Start workout" icon="play" style={{ marginTop: space.base }}
          testID="start-workout" onPress={() => router.push('/train/start')}
        />
      </Card>
    );
  }

  const figure = trainedToday ? card.volume_today_kg : card.volume_this_week_kg;
  const week = [
    count(card.sessions_this_week, 'session') + ' this week',
    trainedToday ? `${kcal(card.volume_this_week_kg)} kg this week` : null,
    card.streak_days > 0 ? `${card.streak_days}-day streak` : null,
  ].filter(Boolean).join(' · ');

  return (
    <Card hero label="Today's workout" labelTone="accent" right={last ? <Text variant="caption" tone="ink3">{last}</Text> : null}>
      <Text variant="h2">{trainedToday ? 'Trained today' : 'Ready when you are'}</Text>
      {/* One stop, not "4,820" then "kg today" (G10 TalkBack session). */}
      <View
        accessible
        accessibilityLabel={`${kcal(figure)} kilograms lifted ${trainedToday ? 'today' : 'this week'}`}
        style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: space.sm }}
      >
        <Text variant="display" testID="training-volume">{kcal(figure)}</Text>
        <Text variant="body" tone="ink3" weight="semi">{trainedToday ? 'kg today' : 'kg this week'}</Text>
      </View>
      <Text variant="caption" tone="ink3" style={{ marginTop: space.xs }}>
        {week}{card.last_session ? ` · ${count(card.last_session.set_count, 'set')} last time` : ''}
      </Text>
      <Button
        title={trainedToday ? 'Start another workout' : 'Start workout'} icon="play"
        kind={trainedToday ? 'secondary' : 'primary'}
        style={{ marginTop: space.base }}
        testID="start-workout" onPress={() => router.push('/train/start')}
      />
    </Card>
  );
}
