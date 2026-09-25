/** D-03 · Create a custom exercise. The ≥1-primary-muscle rule is enforced HERE,
 *  not only by the API, so the user never round-trips to learn it. */
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import { Pressable } from '@/ui/Pressable';
import type { ExerciseIn } from '@volt/api-types';
import { Button, Field, Pill, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useCreateExercise, useExercises, useMuscleGroups } from '@/lib/query/hooks';
import { ApiError } from '@/lib/api';
import { radius, space, useTheme } from '@/theme';

const EQUIPMENT = [
  'barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'band', 'kettlebell', 'other',
] as const;

type Role = 'primary' | 'secondary';

export default function NewExercise() {
  const { name: prefill } = useLocalSearchParams<{ name?: string }>();
  const { c } = useTheme();

  const [name, setName] = useState(prefill ?? '');
  const [equipment, setEquipment] = useState<string>('barbell');
  const [roles, setRoles] = useState<Record<string, Role>>({});
  const [tracks, setTracks] = useState({ load: true, reps: true, duration: false, distance: false });
  const [error, setError] = useState<string | null>(null);

  const groups = useMuscleGroups();
  const existing = useExercises({ q: name.trim() || undefined });
  const create = useCreateExercise();

  const primaries = Object.values(roles).filter((r) => r === 'primary').length;
  const trackedCount = Object.values(tracks).filter(Boolean).length;
  const nameOk = name.trim().length > 0;

  // Validated in the UI so the rule is visible while typing, not after a round trip.
  const problem =
    !nameOk ? 'Give it a name.'
    : primaries === 0 ? 'Pick at least one primary muscle.'
    : trackedCount === 0 ? 'Choose at least one thing to track.'
    : null;

  const nearDuplicate = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (q.length < 3) return undefined;
    return (existing.data ?? []).find((e) => e.name.toLowerCase() === q)
      ?? (existing.data ?? []).find((e) => e.name.toLowerCase().includes(q));
  }, [existing.data, name]);

  const cycle = (id: string) =>
    setRoles((r) => {
      const next = { ...r };
      if (next[id] === 'primary') next[id] = 'secondary';
      else if (next[id] === 'secondary') delete next[id];
      else next[id] = 'primary';
      return next;
    });

  const save = async () => {
    if (problem) { setError(problem); return; }
    setError(null);
    const body = {
      name: name.trim(),
      equipment,
      muscles: Object.entries(roles).map(([muscle_group_id, role]) => ({ muscle_group_id, role })),
      tracks_load: tracks.load,
      tracks_reps: tracks.reps,
      tracks_duration: tracks.duration,
      tracks_distance: tracks.distance,
    } as unknown as ExerciseIn;
    try {
      await create.mutateAsync(body);
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save that exercise.');
    }
  };

  const chip = (label: string, active: boolean, onPress: () => void, a11y?: string) => (
    <Pressable
      key={label}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={a11y ?? label}
      style={{
        paddingHorizontal: space.md, minHeight: 36, justifyContent: 'center',
        borderRadius: radius.pill, borderWidth: 1,
        borderColor: active ? c.accent : c.line2,
        backgroundColor: active ? c.accent : 'transparent',
      }}
    >
      <Text variant="caption" style={{ color: active ? c.accentInk : c.ink2 }}>{label}</Text>
    </Pressable>
  );

  return (
    <ScreenScaffold title="New exercise" action={{ label: 'Save', onPress: save }}>
      <View style={{ gap: space.lg }}>
        <Field label="Name">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Bulgarian Split Squat"
            placeholderTextColor={c.ink3}
            accessibilityLabel="Exercise name"
            testID="exercise-name"
            style={{
              minHeight: 46, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
              paddingHorizontal: space.md, color: c.ink, backgroundColor: c.sunken,
            }}
          />
        </Field>
        {nearDuplicate ? (
          <Text variant="caption" tone="ink3" testID="near-duplicate">
            Similar exercise exists: "{nearDuplicate.name}" — use it instead?
          </Text>
        ) : null}

        <View>
          <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>Equipment</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {EQUIPMENT.map((e) => chip(e, equipment === e, () => setEquipment(e)))}
          </View>
        </View>

        <View>
          <Text variant="label" style={{ marginBottom: 4 }}>Muscles</Text>
          <Text variant="caption" tone="ink3" style={{ marginBottom: space.sm }}>
            Tap once for primary, twice for secondary. At least one primary is required —
            without it, muscle-volume analytics and "previous chest day" cannot work.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }} testID="muscle-chips">
            {(groups.data ?? []).filter((g) => g.parent_id === null).map((g) =>
              chip(
                roles[g.id] ? `${g.name} · ${roles[g.id]}` : g.name,
                Boolean(roles[g.id]),
                () => cycle(g.id),
                `${g.name}${roles[g.id] ? `, ${roles[g.id]}` : ', not selected'}`,
              ),
            )}
          </View>
        </View>

        <View>
          <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>What to track</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }} testID="tracks-chips">
            {(['load', 'reps', 'duration', 'distance'] as const).map((k) =>
              chip(k, tracks[k], () => setTracks((t) => ({ ...t, [k]: !t[k] }))),
            )}
          </View>
        </View>

        {problem ? (
          <Pill>{problem}</Pill>
        ) : null}
        {error ? (
          <Text variant="caption" tone="crit" testID="save-error">{error}</Text>
        ) : null}

        <Button
          title="Save exercise"
          onPress={save}
          disabled={Boolean(problem) || create.isPending}
          loading={create.isPending}
        />
      </View>
    </ScreenScaffold>
  );
}
