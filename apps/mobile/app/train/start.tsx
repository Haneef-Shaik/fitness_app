/** E-01 · Start Workout. */
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { PlanDay, Program, WorkoutSession } from '@volt/api-types';
import { Button, Card, Pill, Text, Well } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { usePrograms } from '@/lib/query/hooks';
import { api, ApiError } from '@/lib/api';
import { space, useTheme } from '@/theme';
import { useActiveSession, useStartSession } from '@/features/workout-session/useSession';
import { countSets } from '@/features/workout-session/store/types';

export default function StartWorkout() {
  const { c } = useTheme();
  const programs = usePrograms();
  const active = useActiveSession();
  const start = useStartSession();
  const [error, setError] = useState<string | null>(null);

  const begin = async (body: Record<string, unknown>) => {
    setError(null);
    try {
      const session = await start(body);
      router.replace(`/session/${session.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not start that workout.');
    }
  };

  // One in_progress session per user is an invariant, so starting a second is
  // never silently allowed — the screen becomes a resume card instead.
  if (active.data) {
    const s = active.data as WorkoutSession;
    const sets = s.exercises?.reduce((n, e) => n + (e.sets?.length ?? 0), 0) ?? 0;
    return (
      <ScreenScaffold title="Start a workout">
        <Card hero testID="already-in-progress">
          <Pill kind="accent">In progress</Pill>
          <Text variant="display" style={{ fontSize: 26, marginTop: 10 }}>
            You're mid-workout
          </Text>
          <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
            {s.exercises?.length ?? 0} exercises · {sets} {sets === 1 ? 'set' : 'sets'} logged
          </Text>
          <Button
            title="Resume"
            style={{ marginTop: space.base }}
            onPress={() => router.replace(`/session/${s.id}`)}
          />
        </Card>
      </ScreenScaffold>
    );
  }

  const dayRow = (program: Program, d: PlanDay) => (
    <Pressable
      key={d.id}
      onPress={() => begin({ plan_day_id: d.id })}
      accessibilityRole="button"
      accessibilityLabel={`Start ${d.name}, ${d.exercises?.length ?? 0} exercises`}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56,
        paddingVertical: space.md, borderBottomWidth: 1, borderColor: c.line,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="body" numberOfLines={1}>{d.name}</Text>
        <Text variant="caption" tone="ink3">
          {program.name} · {d.exercises?.length ?? 0} exercises
        </Text>
      </View>
      <Text variant="body" tone="ink3">›</Text>
    </Pressable>
  );

  return (
    <ScreenScaffold title="Start a workout">
      <View style={{ gap: space.lg }}>
        {error ? (
          <Text variant="caption" style={{ color: c.crit }} testID="start-error">{error}</Text>
        ) : null}

        <Button
          title="Empty workout"
          onPress={() => begin({})}
          testID="start-empty"
        />

        <View>
          <Text variant="label" style={{ marginBottom: space.sm }}>From a program</Text>
          <DataBoundary
            query={programs}
            empty={{
              title: 'No programs yet',
              body: 'Build one, or just start an empty workout and add as you go.',
              action: { label: 'Build a program', onPress: () => router.push('/train/programs') },
            }}
          >
            {(rows) => {
              const withDays = rows.filter((p) => (p.days?.length ?? 0) > 0);
              if (withDays.length === 0) {
                return (
                  <Well>
                    <Text variant="caption" tone="ink3">
                      Your programs have no days yet. Add one and it appears here.
                    </Text>
                  </Well>
                );
              }
              return (
                <View>
                  {withDays.map((p) => (p.days ?? []).map((d) => dayRow(p, d)))}
                </View>
              );
            }}
          </DataBoundary>
        </View>
      </View>
    </ScreenScaffold>
  );
}
