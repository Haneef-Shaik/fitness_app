/**
 * C-05 · Plan Day Editor — the prescription surface, and the screen that makes
 * AC-01 pass.
 *
 * Save is one bulk `PUT /plan-days/:id/exercises` so an ordering change cannot
 * half-apply, plus a `PATCH` for the day's own fields.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import type { Exercise, PlanExerciseIn } from '@volt/api-types';
import { Button, Card, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { ExercisePicker } from '@/features/exercises/ExercisePicker';
import { PrescriptionEditor } from '@/features/programs/PrescriptionEditor';
import { muscleSetCounts } from '@/features/programs/setCounts';
import { prescriptionLine } from '../programs/[id]';
import {
  useExercises, useProgram, useSetDayExercises, useUpdatePlanDay,
} from '@/lib/query/hooks';
import { radius, space, useTheme } from '@/theme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PlanDayEditor() {
  const { id, programId } = useLocalSearchParams<{ id: string; programId: string }>();
  const { c } = useTheme();

  const program = useProgram(programId);
  const catalog = useExercises({ limit: 200 });
  const saveExercises = useSetDayExercises(programId);
  const saveDay = useUpdatePlanDay(programId);

  const day = useMemo(
    () => (program.data?.days ?? []).find((d) => d.id === id),
    [program.data, id],
  );

  const [name, setName] = useState('');
  const [weekday, setWeekday] = useState<number | null>(null);
  const [rows, setRows] = useState<PlanExerciseIn[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Seed the local draft once the day arrives. The draft is authoritative while
  // editing; nothing is written until Save.
  useEffect(() => {
    if (!day) return;
    setName(day.name);
    setWeekday(day.scheduled_weekday ?? null);
    setRows((day.exercises ?? []).map((pe) => ({
      exercise_id: pe.exercise_id,
      target_sets: pe.target_sets,
      target_reps_min: pe.target_reps_min,
      target_reps_max: pe.target_reps_max,
      target_load: pe.target_load,
      load_unit: pe.load_unit,
      target_duration_seconds: pe.target_duration_seconds,
      target_distance_m: pe.target_distance_m,
      rest_seconds: pe.rest_seconds,
    } as PlanExerciseIn)));
  }, [day]);

  const byId = useMemo(() => {
    const m = new Map<string, Exercise>();
    for (const e of catalog.data ?? []) m.set(e.id, e);
    return m;
  }, [catalog.data]);

  const counts = useMemo(
    () => muscleSetCounts(rows, (exId) => byId.get(exId)),
    [rows, byId],
  );

  const move = (from: number, dir: -1 | 1) => {
    const to = from + dir;
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row!);
    setRows(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveDay.mutateAsync({
        dayId: id,
        // clear_schedule is how "—" is expressed: a null scheduled_weekday in a
        // PATCH is indistinguishable from "not sent".
        body: weekday === null
          ? { name, clear_schedule: true }
          : { name, scheduled_weekday: weekday, clear_schedule: false },
      });
      await saveExercises.mutateAsync({ dayId: id, body: rows });
      router.back();
    } finally { setSaving(false); }
  };

  return (
    <ScreenScaffold
      title={day?.name ?? 'Day'}
      action={{ label: saving ? 'Saving…' : 'Save', onPress: save }}
    >
      <DataBoundary query={program} empty={{ title: 'That program no longer exists.' }}>
        {() => (
          <View style={{ gap: space.lg }}>
            <View>
              <Text variant="label" style={{ marginBottom: space.sm }}>Day name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                accessibilityLabel="Day name"
                testID="day-name"
                placeholderTextColor={c.ink3}
                style={{
                  minHeight: 46, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
                  paddingHorizontal: space.md, color: c.ink, backgroundColor: c.sunken,
                }}
              />
            </View>

            <View>
              <Text variant="label" style={{ marginBottom: space.sm }}>Scheduled</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  {[null, 0, 1, 2, 3, 4, 5, 6].map((w) => {
                    const active = weekday === w;
                    return (
                      <Pressable
                        key={String(w)}
                        onPress={() => setWeekday(w)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={w === null ? 'No schedule' : WEEKDAYS[w]}
                        style={{
                          paddingHorizontal: space.md, minHeight: 36, justifyContent: 'center',
                          borderRadius: radius.pill, borderWidth: 1,
                          borderColor: active ? c.accent : c.line2,
                          backgroundColor: active ? c.accent : 'transparent',
                        }}
                      >
                        <Text variant="caption" style={{ color: active ? c.accentInk : c.ink2 }}>
                          {w === null ? '—' : WEEKDAYS[w]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="label" style={{ flex: 1 }}>Exercises</Text>
                <Text variant="caption" tone="ink3">{rows.length}</Text>
              </View>

              {rows.length === 0 ? (
                <Card style={{ marginTop: space.sm }}>
                  <Text variant="body">No exercises yet</Text>
                  <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                    A day with no exercises is still valid — you can add them mid-workout.
                  </Text>
                </Card>
              ) : (
                <View style={{ marginTop: space.sm }} accessibilityRole="list" testID="plan-rows">
                  {rows.map((r, i) => {
                    const ex = byId.get(r.exercise_id);
                    return (
                      <Card key={`${r.exercise_id}-${i}`} style={{ marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                          <Text variant="caption" tone="ink3">{i + 1}</Text>
                          <Pressable
                            style={{ flex: 1 }}
                            onPress={() => setEditing(i)}
                            accessibilityRole="button"
                            accessibilityLabel={
                              `Position ${i + 1}, ${ex?.name ?? 'Exercise'}, ${prescriptionLine(r as never)}`
                            }
                          >
                            <Text variant="body" numberOfLines={1}>{ex?.name ?? 'Exercise'}</Text>
                            <Text variant="caption" tone="ink3">{prescriptionLine(r as never)}</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => move(i, -1)}
                            accessibilityRole="button"
                            accessibilityLabel={`Move ${ex?.name ?? 'exercise'} up`}
                            hitSlop={8}
                          ><Text variant="body" tone="ink3">↑</Text></Pressable>
                          <Pressable
                            onPress={() => move(i, 1)}
                            accessibilityRole="button"
                            accessibilityLabel={`Move ${ex?.name ?? 'exercise'} down`}
                            hitSlop={8}
                          ><Text variant="body" tone="ink3">↓</Text></Pressable>
                        </View>
                      </Card>
                    );
                  })}
                </View>
              )}

              <Button
                title="+ Add exercises"
                kind="ghost"
                style={{ marginTop: space.sm }}
                onPress={() => { setPicked([]); setPickerOpen(true); }}
              />
            </View>

            {counts.length > 0 ? (
              /* The live set-count-per-muscle summary. Same weighting as G-02
                 (primary ×1, secondary ×0.5, D7) so planning and analytics agree. */
              <View testID="muscle-summary">
                <Text variant="label" style={{ marginBottom: space.sm }}>Sets per muscle</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                  {counts.map((m) => (
                    <Pill key={m.slug}>{`${m.name} ${m.sets}`}</Pill>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        )}
      </DataBoundary>

      <ExercisePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selected={picked}
        onChange={setPicked}
        allowCreate
        onCreate={(q) => { setPickerOpen(false); router.push(`/train/exercises/new?name=${encodeURIComponent(q)}`); }}
        alreadyPresent={rows.map((r) => r.exercise_id)}
        onCommit={(ids) => {
          setRows((prev) => [
            ...prev,
            ...ids.map((exercise_id) => ({ exercise_id, load_unit: 'kg' } as PlanExerciseIn)),
          ]);
          setPickerOpen(false);
        }}
      />

      <PrescriptionEditor
        visible={editing !== null}
        onClose={() => setEditing(null)}
        exercise={editing !== null ? byId.get(rows[editing]!.exercise_id) : undefined}
        value={editing !== null ? rows[editing]! : ({ exercise_id: '', load_unit: 'kg' } as PlanExerciseIn)}
        onSave={(next) => {
          setRows((prev) => prev.map((r, i) => (i === editing ? next : r)));
          setEditing(null);
        }}
        onRemove={() => {
          setRows((prev) => prev.filter((_, i) => i !== editing));
          setEditing(null);
        }}
      />
    </ScreenScaffold>
  );
}
