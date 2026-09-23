/**
 * C-01 · Train hub — the Train tab's root.
 *
 * Built in G10 after the phone showed there was no Train section at all: the
 * programs, library, history and analytics screens existed, reachable only from
 * a wall of buttons under the dashboard.
 *
 * The TODAY card offers the plan day scheduled for the server's date (I7). With
 * no program it offers the starter programs instead of an empty screen — the
 * state a brand-new account was left in.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import type { WorkoutSession } from '@volt/api-types';
import { Button, Card, Pill, Text } from '@/ui';
import { NavGroup, NavRow } from '@/ui/NavRow';
import { Pressable } from '@/ui/Pressable';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { ApiError } from '@/lib/api';
import { flattenHistory, useDashboard, usePrograms, useWorkoutHistory } from '@/lib/query/hooks';
import { formatSessionSummary } from '@/features/history/format';
import { suggestDay } from '@/features/programs/today';
import { useActiveSession, useStartSession } from '@/features/workout-session/useSession';
import { count } from '@/features/nutrition/format';
import { space } from '@/theme';

export default function TrainHub() {
  const programs = usePrograms();
  const board = useDashboard();
  const active = useActiveSession();
  const history = useWorkoutHistory();
  const start = useStartSession();
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const begin = async (body: Record<string, unknown>) => {
    setError(null);
    setStarting(true);
    try {
      const session = await start(body);
      router.push(`/session/${session.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not start that workout.');
    } finally {
      setStarting(false);
    }
  };

  const localDate = board.data?.local_date;
  const suggestion = localDate && programs.data ? suggestDay(programs.data, localDate) : null;
  const liveSession = active.data as WorkoutSession | null | undefined;
  const recent = flattenHistory(history.data?.pages).slice(0, 3);
  const activePrograms = (programs.data ?? []).filter((p) => p.status === 'active').length;
  const refresh = () => {
    void programs.refetch(); void history.refetch(); void active.refetch(); void board.refetch();
  };

  return (
    <ScreenScaffold title="Train" root onRefresh={refresh}>
      <View style={{ gap: space.lg }}>
        {liveSession ? (
          <Card hero testID="train-resume">
            <Pill kind="accent">In progress</Pill>
            <Text variant="h2" style={{ marginTop: space.sm }}>You're mid-workout</Text>
            <Button
              title="Resume"
              style={{ marginTop: space.base }}
              testID="train-resume-button"
              onPress={() => router.push(`/session/${liveSession.id}`)}
            />
          </Card>
        ) : suggestion ? (
          <Card hero testID="train-today">
            <Text variant="label">{suggestion.scheduled ? 'Today' : 'Next up'}</Text>
            <Text variant="h2" style={{ marginTop: space.xs }} numberOfLines={2}>{suggestion.day.name}</Text>
            <Text variant="caption" tone="ink3" style={{ marginTop: 2 }}>
              {suggestion.program.name} · {count(suggestion.day.exercises?.length ?? 0, 'exercise')}
            </Text>
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.base }}>
              <Button
                title="Start workout"
                style={{ flex: 1 }}
                loading={starting}
                testID="train-start-today"
                onPress={() => begin({ plan_day_id: suggestion.day.id })}
              />
              <Button
                title="Change"
                kind="ghost"
                testID="train-change"
                onPress={() => router.push('/train/start')}
              />
            </View>
          </Card>
        ) : programs.data ? (
          <Card hero testID="train-no-program">
            <Text variant="h2">No program yet</Text>
            <Text variant="body" tone="ink2" style={{ marginTop: space.xs }}>
              Pick a starter program and it becomes yours to edit — or build your own.
            </Text>
            <Button
              title="Browse starter programs"
              style={{ marginTop: space.base }}
              testID="train-browse-templates"
              onPress={() => router.push('/train/programs/templates')}
            />
            <Button
              title="Build my own"
              kind="ghost"
              style={{ marginTop: space.sm }}
              testID="train-build-own"
              onPress={() => router.push('/train/programs')}
            />
          </Card>
        ) : null}

        {error ? <Text variant="caption" tone="crit" testID="train-error">{error}</Text> : null}

        {!liveSession ? (
          <Button
            title="Empty workout"
            kind="ghost"
            testID="train-empty"
            onPress={() => begin({})}
          />
        ) : null}

        <NavGroup>
          <NavRow
            icon="clipboard-outline" label="Programs" testID="go-programs"
            detail={programs.data ? `${activePrograms} active` : null}
            onPress={() => router.push('/train/programs')}
          />
          <NavRow icon="library-outline" label="Exercise library" testID="go-exercises"
            onPress={() => router.push('/train/exercises')} />
          <NavRow icon="time-outline" label="History" testID="go-history"
            onPress={() => router.push('/train/history')} />
          <NavRow icon="stats-chart-outline" label="Analytics" testID="go-trends"
            onPress={() => router.push('/train/analytics')} />
          <NavRow icon="trophy-outline" label="Personal records" testID="go-records"
            onPress={() => router.push('/train/analytics/records')} />
        </NavGroup>

        <View>
          <Text variant="label" style={{ marginBottom: space.sm }}>Recent sessions</Text>
          {recent.length === 0 ? (
            <Text variant="body" tone="ink3" testID="train-no-history">Your sessions will show up here.</Text>
          ) : (
            <NavGroup>
              {recent.map((row) => {
                const s = formatSessionSummary(row);
                return (
                  <NavRow
                    key={row.id}
                    icon="barbell-outline"
                    label={s.title}
                    detail={s.dateLabel}
                    onPress={() => router.push(`/train/history/${row.id}`)}
                  />
                );
              })}
            </NavGroup>
          )}
          {recent.length > 0 ? (
            <Pressable
              onPress={() => router.push('/train/history')}
              accessibilityRole="button"
              accessibilityLabel="See all sessions"
              style={{ alignSelf: 'flex-end', paddingVertical: space.sm }}
            >
              <Text variant="caption" tone="accent">See all ›</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </ScreenScaffold>
  );
}
