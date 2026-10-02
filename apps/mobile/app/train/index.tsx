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
import type { WorkoutSession } from '@fitlog/api-types';
import { Button, Card, Pill, Text } from '@/ui';
import { EmptyState } from '@/ui/EmptyState';
import { NavGroup, NavRow } from '@/ui/NavRow';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { SectionHeader } from '@/ui/SectionHeader';
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
          <Card
            hero accent testID="train-resume"
            label="Today" labelTone="accent"
            right={<Pill kind="accent" icon="flash">In progress</Pill>}
          >
            <Text variant="h2">You're mid-workout</Text>
            <Button
              title="Resume"
              icon="play"
              style={{ marginTop: space.base }}
              testID="train-resume-button"
              onPress={() => router.push(`/session/${liveSession.id}`)}
            />
          </Card>
        ) : suggestion ? (
          <Card hero testID="train-today" label={suggestion.scheduled ? 'Today' : 'Next up'} labelTone="accent">
            <Text variant="h2" numberOfLines={2}>{suggestion.day.name}</Text>
            <Text variant="caption" tone="ink3" style={{ marginTop: 2 }}>
              {suggestion.program.name} · {count(suggestion.day.exercises?.length ?? 0, 'exercise')}
            </Text>
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.base }}>
              <Button
                title="Start workout"
                icon="play"
                style={{ flex: 1 }}
                loading={starting}
                testID="train-start-today"
                onPress={() => begin({ plan_day_id: suggestion.day.id })}
              />
              <Button
                title="Change"
                kind="secondary"
                testID="train-change"
                onPress={() => router.push('/train/start')}
              />
            </View>
          </Card>
        ) : programs.data ? (
          <Card hero testID="train-no-program">
            <EmptyState
              compact
              icon="clipboard-outline"
              title="No program yet"
              body="Pick a starter program and it becomes yours to edit — or build your own."
              action={{
                label: 'Browse starter programs',
                testID: 'train-browse-templates',
                onPress: () => router.push('/train/programs/templates'),
              }}
              secondary={{
                label: 'Build my own',
                testID: 'train-build-own',
                onPress: () => router.push('/train/programs'),
              }}
            />
          </Card>
        ) : null}

        {error ? <Text variant="caption" tone="crit" testID="train-error">{error}</Text> : null}

        {!liveSession ? (
          <Button
            title="Empty workout"
            kind="secondary"
            icon="add-circle-outline"
            testID="train-empty"
            onPress={() => begin({})}
          />
        ) : null}

        <NavGroup>
          <NavRow
            icon="clipboard-outline" label="Programs" testID="go-programs"
            hint="Plans, days and schedules"
            detail={programs.data ? `${activePrograms} active` : null}
            onPress={() => router.push('/train/programs')}
          />
          <NavRow icon="library-outline" label="Exercise library" testID="go-exercises"
            hint="By muscle, equipment, or your own"
            onPress={() => router.push('/train/exercises')} />
          <NavRow icon="time-outline" label="History" testID="go-history"
            hint="Every finished session"
            onPress={() => router.push('/train/history')} />
          <NavRow icon="stats-chart-outline" label="Analytics" testID="go-trends"
            hint="Volume, frequency, muscle balance"
            onPress={() => router.push('/train/analytics')} />
          <NavRow icon="trophy-outline" label="Personal records" testID="go-records"
            hint="Best sets and estimated 1RM"
            onPress={() => router.push('/train/analytics/records')} />
        </NavGroup>

        <View>
          <SectionHeader
            title="Recent sessions"
            action={recent.length > 0 ? {
              label: 'See all sessions',
              testID: 'see-all-sessions',
              onPress: () => router.push('/train/history'),
            } : undefined}
          />
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
                    hint={s.headline}
                    onPress={() => router.push(`/train/history/${row.id}`)}
                  />
                );
              })}
            </NavGroup>
          )}
        </View>
      </View>
    </ScreenScaffold>
  );
}
