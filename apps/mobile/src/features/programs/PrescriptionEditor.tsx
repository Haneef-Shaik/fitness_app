/**
 * C-07 · Prescription Editor.
 *
 * **The form is driven by the exercise's tracked fields, never fixed.** A plank
 * has no load and no reps; a run has neither. Hardcoding sets×reps@load here is
 * the trap that surfaces in G3 as a logger bug, where it costs far more — E-03
 * reads the same `tracks_*` flags to decide which entry fields to show.
 *
 * The rep range auto-corrects rather than blocking: a reversed range is a slip,
 * not an error worth stopping on, and the server swaps it the same way.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import type { Exercise, PlanExerciseIn } from '@volt/api-types';
import { Button, Text } from '../../ui';
import { Sheet } from '../../ui/Sheet';
import { radius, space, useTheme } from '../../theme';
import { muscleSummary, trackedFields } from '../exercises/format';

export interface PrescriptionEditorProps {
  visible: boolean;
  onClose: () => void;
  exercise: Exercise | undefined;
  value: PlanExerciseIn;
  onSave: (next: PlanExerciseIn) => void;
  onRemove?: () => void;
}

function Stepper({
  label, value, onChange, min, max, step = 1, format, testID,
}: {
  label: string; value: number | null; onChange: (n: number | null) => void;
  min: number; max: number; step?: number; format?: (n: number) => string; testID?: string;
}) {
  const { c } = useTheme();
  const shown = value === null ? '—' : (format ? format(value) : String(value));
  const bump = (d: number) => {
    // From unset the first press reveals the floor rather than stepping off it.
    // The old `(value ?? min) + d * step` opened the sequence at min + step, so
    // + on an empty field skipped a value: four taps on a phone read 5 sets,
    // and rest could only reach an explicit "none" by pressing DOWN.
    const next = value === null
      ? min
      : Math.min(max, Math.max(min, value + d * step));
    onChange(next);
  };
  const btn = (text: string, onPress: () => void, a11y: string) => (
    <Text
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      variant="title"
      style={{
        width: 44, height: 44, lineHeight: 44, textAlign: 'center',
        borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2, color: c.ink2,
      }}
    >
      {text}
    </Text>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }} testID={testID}>
      <Text variant="body" tone="ink2" style={{ flex: 1 }}>{label}</Text>
      {btn('−', () => bump(-1), `Decrease ${label}`)}
      <Text variant="body" style={{ minWidth: 56, textAlign: 'center' }} testID={`${testID}-value`}>
        {shown}
      </Text>
      {btn('+', () => bump(1), `Increase ${label}`)}
    </View>
  );
}

function NumberField({
  label, value, onChange, placeholder, testID, accessibilityLabel,
}: {
  label: string; value: number | null; onChange: (n: number | null) => void;
  placeholder?: string; testID?: string; accessibilityLabel?: string;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Text variant="caption" tone="ink3">{label}</Text>
      <TextInput
        testID={testID}
        accessibilityLabel={accessibilityLabel ?? label}
        keyboardType="decimal-pad"
        value={value === null ? '' : String(value)}
        placeholder={placeholder ?? '—'}
        placeholderTextColor={c.ink3}
        onChangeText={(t) => {
          const cleaned = t.replace(',', '.').trim();
          if (cleaned === '') return onChange(null);
          const n = Number(cleaned);
          onChange(Number.isFinite(n) ? n : null);
        }}
        style={{
          minHeight: 44, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
          paddingHorizontal: space.md, color: c.ink, backgroundColor: c.sunken,
        }}
      />
    </View>
  );
}

export function PrescriptionEditor({
  visible, onClose, exercise, value, onSave, onRemove,
}: PrescriptionEditorProps) {
  const [draft, setDraft] = useState<PlanExerciseIn>(value);
  const [hint, setHint] = useState<string | null>(null);

  // Re-seed when the caller opens the sheet on a different row.
  React.useEffect(() => { setDraft(value); setHint(null); }, [value, visible]);

  const tracks = useMemo(
    () => (exercise
      ? trackedFields(exercise)
      : { load: true, reps: true, duration: false, distance: false }),
    [exercise],
  );

  const set = <K extends keyof PlanExerciseIn>(k: K, v: PlanExerciseIn[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    let next = { ...draft };
    const lo = next.target_reps_min ?? null;
    const hi = next.target_reps_max ?? null;
    if (lo !== null && hi !== null && hi < lo) {
      next = { ...next, target_reps_min: hi, target_reps_max: lo };
      setHint('We swapped these for you.');
    }
    onSave(next);
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={exercise?.name ?? 'Prescription'}
      testID="prescription-editor"
      footer={
        <View style={{ flexDirection: 'row', gap: space.md }}>
          {onRemove ? (
            <Button title="Remove" kind="ghost" size="sm" onPress={onRemove} style={{ flex: 1 }} />
          ) : null}
          <Button title="Save" size="sm" onPress={save} style={{ flex: 2 }} />
        </View>
      }
    >
      {/* Scrollable, not a plain View. With the keyboard up the sheet has barely
          half its height, and a fixed-size body simply overflowed: the footer
          was drawn across the load field and "Rest between sets" could not be
          reached at all. Seen on a phone; a browser has the room to hide it.
          `handled` so a tap on a control still acts on the first press instead
          of being spent dismissing the IME. */}
      <ScrollView
        contentContainerStyle={{ padding: space.lg, gap: space.lg }}
        keyboardShouldPersistTaps="handled"
      >
        {exercise && muscleSummary(exercise) ? (
          <Text variant="caption" tone="ink3">{muscleSummary(exercise)}</Text>
        ) : null}

        <Stepper
          label="Target sets"
          value={draft.target_sets ?? null}
          onChange={(n) => set('target_sets', n)}
          min={1}
          max={20}
          testID="target-sets"
        />

        {tracks.reps ? (
          <View style={{ gap: 6 }} testID="rep-range">
            <Text variant="body" tone="ink2">Rep range</Text>
            <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-end' }}>
              <NumberField
                label="Min" value={draft.target_reps_min ?? null}
                onChange={(n) => set('target_reps_min', n)} testID="reps-min"
                accessibilityLabel="Minimum reps"
              />
              <NumberField
                label="Max" value={draft.target_reps_max ?? null}
                onChange={(n) => set('target_reps_max', n)} testID="reps-max"
                accessibilityLabel="Maximum reps"
              />
            </View>
            {hint ? <Text variant="caption" tone="ink3">{hint}</Text> : null}
          </View>
        ) : null}

        {tracks.load ? (
          <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-end' }} testID="target-load">
            <NumberField
              label={`Target load (${draft.load_unit ?? 'kg'})`}
              value={draft.target_load ?? null}
              onChange={(n) => set('target_load', n)}
              testID="load-input"
              accessibilityLabel="Target load"
            />
          </View>
        ) : null}

        {tracks.duration ? (
          <View testID="target-duration">
            <NumberField
              label="Target time (seconds)"
              value={draft.target_duration_seconds ?? null}
              onChange={(n) => set('target_duration_seconds', n === null ? null : Math.round(n))}
              testID="duration-input"
              accessibilityLabel="Target time in seconds"
            />
          </View>
        ) : null}

        {tracks.distance ? (
          <View testID="target-distance">
            <NumberField
              label="Target distance (metres)"
              value={draft.target_distance_m ?? null}
              onChange={(n) => set('target_distance_m', n)}
              testID="distance-input"
              accessibilityLabel="Target distance in metres"
            />
          </View>
        ) : null}

        <Stepper
          label="Rest between sets"
          value={draft.rest_seconds ?? null}
          onChange={(n) => set('rest_seconds', n)}
          min={0}
          max={600}
          step={15}
          format={(n) => (n === 0 ? 'none' : `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`)}
          testID="rest-seconds"
        />
      </ScrollView>
    </Sheet>
  );
}
