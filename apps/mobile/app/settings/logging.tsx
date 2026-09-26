/**
 * K-04 · Logging preferences.
 *
 * What the logger shows and how it counts. The warm-up switch is the one with
 * reach: D6 leaves warm-ups out of volume by default, and turning them on
 * recounts every past workout too — so the screen says so before it happens,
 * rather than the user finding last month's numbers changed.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import type { ProfilePatch } from '@fitlog/api-types';
import { Button, Text } from '@/ui';
import { Pressable } from '@/ui/Pressable';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { Chips, Labelled } from '@/features/onboarding/ui';
import { ApiError } from '@/lib/api';
import { useProfile, useUpdateProfile } from '@/lib/query/hooks';
import { useSession } from '@/lib/session';
import { radius, space, useTheme } from '@/theme';

/** Plates a gym commonly has. The user picks which of them theirs has. */
const PLATE_CHOICES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5] as const;

interface Prefs {
  warmups_in_volume: boolean;
  show_rpe: boolean;
  show_rir: boolean;
  default_rest_seconds: number | null;
  load_step_kg: number;
  bar_weight_kg: number;
  plate_inventory_kg: number[];
}

function Toggle({ label, detail, value, onChange, testID }: {
  label: string; detail?: string; value: boolean; onChange: (v: boolean) => void; testID: string;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      accessibilityHint={detail}
      testID={testID}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="body">{label}</Text>
        {detail ? <Text variant="caption" tone="ink3">{detail}</Text> : null}
      </View>
      <View
        style={{
          width: 48, height: 28, borderRadius: radius.pill, padding: 3,
          backgroundColor: value ? c.accent : c.line2, alignItems: value ? 'flex-end' : 'flex-start',
        }}
      >
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.surface }} />
      </View>
    </Pressable>
  );
}

export default function LoggingPreferences() {
  const query = useProfile();
  return (
    <ScreenScaffold title="Logging preferences" subtitle="What the logger shows, and how volume is counted">
      <DataBoundary query={query} empty={{ title: "No profile yet." }} isEmpty={(p) => !p}>
        {(profile) => <Form initial={{
          warmups_in_volume: profile.warmups_in_volume ?? false,
          show_rpe: profile.show_rpe ?? false,
          show_rir: profile.show_rir ?? false,
          default_rest_seconds: profile.default_rest_seconds ?? null,
          load_step_kg: profile.load_step_kg ?? 2.5,
          bar_weight_kg: profile.bar_weight_kg ?? 20,
          plate_inventory_kg: profile.plate_inventory_kg ?? [25, 20, 15, 10, 5, 2.5, 1.25],
        }} />}
      </DataBoundary>
    </ScreenScaffold>
  );
}

function Form({ initial }: { initial: Prefs }) {
  const update = useUpdateProfile();
  const { refreshProfile } = useSession();
  const [p, setP] = useState<Prefs>(initial);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Prefs>) => setP((prev) => ({ ...prev, ...patch }));

  const togglePlate = (plate: number) => {
    const has = p.plate_inventory_kg.includes(plate);
    const next = has ? p.plate_inventory_kg.filter((x) => x !== plate) : [...p.plate_inventory_kg, plate];
    // At least one plate: a calculator with none can only ever say "just the bar".
    if (next.length > 0) set({ plate_inventory_kg: [...next].sort((a, b) => b - a) });
  };

  const save = async () => {
    setError(null);
    try {
      await update.mutateAsync(p as ProfilePatch);
      await refreshProfile();
      router.back();
    } catch (e) {
      setError(e instanceof ApiError
        ? (Object.values(e.fields)[0] ?? e.message)
        : "That didn't save. Check your connection and try again.");
    }
  };

  const warmupsChanged = p.warmups_in_volume !== initial.warmups_in_volume;

  return (
    <View style={{ gap: space.xl }}>
      <View style={{ gap: space.sm }}>
        <Text variant="label" accessibilityRole="header">Volume</Text>
        <Toggle
          testID="pref-warmups"
          label="Count warm-ups in volume"
          detail="Off by default. Changing it recounts all your past workouts too."
          value={p.warmups_in_volume}
          onChange={(v) => set({ warmups_in_volume: v })}
        />
        {warmupsChanged ? (
          <Text variant="caption" tone="warn" testID="pref-warmups-note">
            Your past workouts' volume will be recounted when you save.
          </Text>
        ) : null}
      </View>

      <View style={{ gap: space.sm }}>
        <Text variant="label" accessibilityRole="header">On the logger</Text>
        <Toggle testID="pref-rpe" label="Show RPE with every set" value={p.show_rpe}
          detail="Effort out of 10. Always available under More."
          onChange={(v) => set({ show_rpe: v })} />
        <Toggle testID="pref-rir" label="Show RIR with every set" value={p.show_rir}
          detail="Reps you had left. Always available under More."
          onChange={(v) => set({ show_rir: v })} />
      </View>

      <Labelled label="Rest timer when the plan sets none">
        <Chips
          testID="pref-rest"
          value={p.default_rest_seconds ?? 0}
          onChange={(v) => set({ default_rest_seconds: v === 0 ? null : v })}
          options={[
            { value: 0, label: 'Off', a11y: 'No rest timer' },
            { value: 60, label: '1:00', a11y: '1 minute' },
            { value: 90, label: '1:30', a11y: '1 minute 30 seconds' },
            { value: 120, label: '2:00', a11y: '2 minutes' },
            { value: 180, label: '3:00', a11y: '3 minutes' },
          ]}
        />
      </Labelled>

      <Labelled label="Load step (kg)">
        <Chips
          testID="pref-step"
          value={p.load_step_kg}
          onChange={(v) => set({ load_step_kg: v })}
          options={[1, 1.25, 2.5, 5].map((v) => ({ value: v, label: String(v), a11y: `${v} kilograms` }))}
        />
      </Labelled>

      <View style={{ gap: space.sm }}>
        <Text variant="label" accessibilityRole="header">Plate calculator</Text>
        <Labelled label="Bar (kg)">
          <Chips
            testID="pref-bar"
            value={p.bar_weight_kg}
            onChange={(v) => set({ bar_weight_kg: v })}
            options={[10, 15, 20].map((v) => ({ value: v, label: String(v), a11y: `${v} kilogram bar` }))}
          />
        </Labelled>
        <Labelled label="Plates you have (kg)">
          <PlatePicker selected={p.plate_inventory_kg} onToggle={togglePlate} />
        </Labelled>
        <Text variant="caption" tone="ink3">In pounds the calculator uses a 45 lb bar and standard pound plates.</Text>
      </View>

      {error ? <Text variant="caption" tone="crit" testID="pref-error">{error}</Text> : null}
      <Button title="Save" loading={update.isPending} testID="pref-save" onPress={() => { void save(); }} />
    </View>
  );
}

function PlatePicker({ selected, onToggle }: { selected: number[]; onToggle: (p: number) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
      {PLATE_CHOICES.map((plate) => {
        const on = selected.includes(plate);
        return (
          <Pressable
            key={plate}
            onPress={() => onToggle(plate)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={`${plate} kilogram plates`}
            testID={`pref-plate-${plate}`}
            style={{
              minHeight: 44, minWidth: 52, paddingHorizontal: space.base, borderRadius: radius.pill,
              alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
              borderColor: on ? c.accent : c.line2, backgroundColor: on ? c.accentWash : c.surface,
            }}
          >
            <Text variant="body" tone={on ? 'accent' : 'ink2'}>{plate}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
