/** C-03 · Program Detail — days, their prescriptions, and a way into C-05. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Pressable } from '@/ui/Pressable';
import type { PlanDay, PlanExercise } from '@volt/api-types';
import { Button, Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useAddPlanDay, useProgram } from '@/lib/query/hooks';
import { space, useTheme } from '@/theme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "4 × 6–8 @ 80 kg" — the prescription in the shape the plan editor wrote it. */
export function prescriptionLine(pe: PlanExercise): string {
  const parts: string[] = [];
  if (pe.target_sets) parts.push(`${pe.target_sets} ×`);
  if (pe.target_reps_min && pe.target_reps_max && pe.target_reps_min !== pe.target_reps_max) {
    parts.push(`${pe.target_reps_min}–${pe.target_reps_max}`);
  } else if (pe.target_reps_min) {
    parts.push(String(pe.target_reps_min));
  }
  if (pe.target_duration_seconds) parts.push(`${pe.target_duration_seconds}s`);
  if (pe.target_distance_m) parts.push(`${pe.target_distance_m} m`);
  if (pe.target_load) parts.push(`@ ${pe.target_load} ${pe.load_unit ?? 'kg'}`);
  return parts.join(' ') || 'No target set';
}

export default function ProgramDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const program = useProgram(id);
  const addDay = useAddPlanDay(id);
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    try {
      const next = (program.data?.days?.length ?? 0) + 1;
      await addDay.mutateAsync({ name: `Day ${next}` });
    } finally { setBusy(false); }
  };

  const day = (d: PlanDay) => (
    <Card key={d.id} style={{ marginBottom: space.md }}>
      <Pressable
        onPress={() => router.push(`/train/plan-days/${d.id}?programId=${id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${d.name}, ${d.exercises?.length ?? 0} exercises, edit`}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>{d.name}</Text>
          <Text variant="body" tone="ink3">›</Text>
        </View>
        <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
          {d.scheduled_weekday !== null && d.scheduled_weekday !== undefined
            ? `${WEEKDAYS[d.scheduled_weekday]} · ` : ''}
          {d.exercises?.length ?? 0} exercises
        </Text>
      </Pressable>

      {(d.exercises ?? []).length === 0 ? (
        <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
          No exercises yet
        </Text>
      ) : (
        <View style={{ marginTop: space.sm, gap: 4 }}>
          {(d.exercises ?? []).slice(0, 4).map((pe) => (
            <View key={pe.id} style={{ flexDirection: 'row', gap: space.sm }}>
              <Text variant="caption" tone="ink2" style={{ flex: 1 }} numberOfLines={1}>
                {pe.exercise_name ?? 'Exercise'}
              </Text>
              <Text variant="caption" tone="ink3">{prescriptionLine(pe)}</Text>
            </View>
          ))}
          {(d.exercises ?? []).length > 4 ? (
            <Text variant="caption" tone="ink3">
              + {(d.exercises ?? []).length - 4} more
            </Text>
          ) : null}
        </View>
      )}

      <Button
        title="Edit day"
        kind="ghost"
        size="sm"
        style={{ marginTop: space.md }}
        onPress={() => router.push(`/train/plan-days/${d.id}?programId=${id}`)}
      />
    </Card>
  );

  return (
    <ScreenScaffold title={program.data?.name ?? 'Program'}>
      <DataBoundary query={program} empty={{ title: 'That program no longer exists.' }}>
        {(p) => (
          <View>
            {p.description ? (
              <Text variant="caption" tone="ink3" style={{ marginBottom: space.md }}>
                {p.description}
              </Text>
            ) : null}

            {(p.days ?? []).length === 0 ? (
              <Card style={{ marginBottom: space.md }}>
                <Text variant="body" style={{ color: c.ink }}>No days yet</Text>
                <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                  A day is one workout — Push, Pull, Legs.
                </Text>
              </Card>
            ) : (p.days ?? []).map(day)}

            <Button title="+ Add a day" onPress={add} loading={busy} />
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
