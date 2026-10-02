/** E-01 · Start Workout. */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable } from '@/ui/Pressable';
import type { PlanDay, Program, WorkoutSession } from '@fitlog/api-types';
import { Button, Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { EmptyState } from '@/ui/EmptyState';
import { IconTile } from '@/ui/IconTile';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { SectionHeader } from '@/ui/SectionHeader';
import { usePrograms } from '@/lib/query/hooks';
import { api, ApiError } from '@/lib/api';
import { space, useTheme } from '@/theme';
import { useActiveSession, useStartSession } from '@/features/workout-session/useSession';
import { countSets } from '@/features/workout-session/store/types';
import { count } from '@/features/nutrition/format';

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
        <Card hero accent testID="already-in-progress" label="In progress" labelTone="accent">
          <Text variant="h2">You're mid-workout</Text>
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

  const dayRow = (program: Program, d: PlanDay, isLast: boolean) => (
    <Pressable
      key={d.id}
      onPress={() => begin({ plan_day_id: d.id })}
      accessibilityRole="button"
      accessibilityLabel={`Start ${d.name}, ${count(d.exercises?.length ?? 0, 'exercise')}`}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56,
        paddingHorizontal: space.md, paddingVertical: space.md,
        borderBottomWidth: isLast ? 0 : 1, borderColor: c.line,
      }}
    >
      <IconTile icon="barbell-outline" size={36} tone="ink2" />
      <View style={{ flex: 1 }}>
        <Text variant="body" weight="semi" numberOfLines={1}>{d.name}</Text>
        <Text variant="caption" tone="ink3">
          {program.name} · {count(d.exercises?.length ?? 0, 'exercise')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.ink3} />
    </Pressable>
  );

  return (
    <ScreenScaffold title="Start a workout">
      <View style={{ gap: space.lg }}>
        {error ? (
          <Text variant="caption" tone="crit" testID="start-error">{error}</Text>
        ) : null}

        <Button
          title="Empty workout"
          icon="add"
          onPress={() => begin({})}
          testID="start-empty"
        />

        <View>
          <SectionHeader title="From a program" />
          <DataBoundary
            query={programs}
            empty={{
              icon: 'clipboard-outline',
              title: 'No programs yet',
              body: 'Add a starter program, or just start an empty workout and add exercises as you go.',
              action: { label: 'Browse starter programs', onPress: () => router.push('/train/programs/templates') },
            }}
          >
            {(rows) => {
              const withDays = rows.filter((p) => (p.days?.length ?? 0) > 0);
              if (withDays.length === 0) {
                return (
                  <EmptyState
                    compact
                    icon="clipboard-outline"
                    title="Your programs have no days yet"
                    body="Add one and it appears here."
                  />
                );
              }
              const flat = withDays.flatMap((p) => (p.days ?? []).map((d) => ({ program: p, day: d })));
              return (
                <Card pad="none">
                  {flat.map((row, i) => dayRow(row.program, row.day, i === flat.length - 1))}
                </Card>
              );
            }}
          </DataBoundary>
        </View>
      </View>
    </ScreenScaffold>
  );
}
