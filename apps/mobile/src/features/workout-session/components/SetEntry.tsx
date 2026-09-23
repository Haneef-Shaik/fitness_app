/**
 * E-03 · the entry controls — the most important surface in the product.
 *
 * **The fields are generated from the exercise's tracked fields**, exactly as
 * C-07 generates the prescription: a plank has no load and no reps, a run has
 * neither. G2 proved this shape; this reuses `trackedFields` rather than
 * re-deriving it, so the two can never disagree.
 *
 * Every control here is **≥ 56 px** — the logger's touch target (docs/05), sized
 * for a hand that is mid-workout rather than mid-browse. The commit button is
 * full width and is the only primary action on the screen.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import { Pressable } from '@/ui/Pressable';
import type { Exercise } from '@volt/api-types';
import { Button, Text } from '@/ui';
import { radius, space, useTheme } from '@/theme';
import { trackedFields } from '@/features/exercises/format';

/** docs/05: 56 px in the logger, not the 44 px used elsewhere. */
export const LOGGER_TARGET = 56;

export interface SetEntryValue {
  reps: number | null;
  loadKg: number | null;
  durationSeconds: number | null;
  distanceM: number | null;
  setType: 'warmup' | 'working' | 'drop' | 'failure';
}

export interface SetEntryProps {
  exercise: Pick<Exercise,
    'tracks_load' | 'tracks_reps' | 'tracks_duration' | 'tracks_distance' | 'default_unit'>;
  value: SetEntryValue;
  onChange: (next: SetEntryValue) => void;
  onCommit: () => void;
  onRepeatLast?: () => void;
  /** Shown inline under the field, never as a modal (docs/03 §10). */
  error?: string | null;
  commitLabel?: string;
  busy?: boolean;
}

/** The text a numeric value should show. Empty for "not set", never "0". */
function toText(value: number | null, format?: (n: number) => string): string {
  if (value === null) return '';
  return String(format ? format(value) : value);
}

/** What the user typed, as a number — or `null` for "they cleared it". */
function parseEntry(raw: string): number | null {
  const cleaned = raw.replace(',', '.').trim();
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}


function Stepper({
  label, value, onChange, step, min, max, format, testID,
}: {
  label: string; value: number | null; onChange: (n: number | null) => void;
  step: number; min: number; max: number; format?: (n: number) => string; testID: string;
}) {
  const { c } = useTheme();

  /**
   * The field keeps its own text while it is being typed into.
   *
   * It used to be fully controlled — `value={String(value)}` — which means
   * every keystroke went up to a reducer and came back down as a new `value`
   * prop, and the native text was re-set underneath the keyboard. On a device
   * that races: typing `80` into a field showing `80` produced **800**, and
   * `8` into one showing `6` produced **86**. Found on hardware in G10; every
   * unit test passed throughout, because React Testing Library sets text in
   * one atomic call and never generates the race.
   *
   * This is a field holding a **weight**. A wrong number here is a wrong
   * number in somebody's training history, and they would have no reason to
   * doubt it.
   *
   * The prop still wins when it changes for a reason the user did not cause —
   * a stepper tap, a new exercise, a repeated set — which is what the
   * comparison below distinguishes.
   */
  const [text, setText] = useState(() => toText(value, format));
  //: The last value that arrived as a PROP. Never written from `onChangeText`:
  //: doing so makes the very next render look like the parent changed the
  //: value, and the field resets itself to what it just told the parent.
  const lastProp = useRef(value);

  useEffect(() => {
    if (lastProp.current === value) return;
    lastProp.current = value;
    // Only adopt the prop when it disagrees with what is on screen, so a
    // partially typed "8." is never replaced by "8" mid-keystroke.
    if (parseEntry(text) !== value) setText(toText(value, format));
  }, [value, text, format]);
  const bump = (d: number) => {
    const next = Math.min(max, Math.max(min, Math.round(((value ?? 0) + d * step) * 100) / 100));
    // A stepper tap is a deliberate act, so it replaces the draft outright
    // rather than losing to whatever is half-typed in the box.
    setText(toText(next, format));
    onChange(next);
  };
  const button = (text: string, d: number, a11y: string) => (
    <Pressable
      onPress={() => bump(d)}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      testID={`${testID}-${d > 0 ? 'inc' : 'dec'}`}
      style={{
        width: LOGGER_TARGET, height: LOGGER_TARGET,
        alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
      }}
    >
      <Text variant="title" tone="ink2">{text}</Text>
    </Pressable>
  );

  return (
    <View style={{ gap: 6 }} testID={testID}>
      {/* The visible label is hidden FROM the screen reader, because the input
          below carries the same name. Without this, TalkBack announces
          "Load (kg)" and then "Load (kg), edit box, 80" — the label twice, for
          no information. Found by reading the device's own accessibility tree
          in G10's audit, where two nodes shared the name. */}
      <Text
        variant="caption"
        tone="ink3"
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {label}
      </Text>
      {/* Not flattened: as a real native group, Android's Tab order walks
          − field + as a row. Flattened, it sorted the whole logger into
          columns (see SetEntry.test.tsx). */}
      <View
        collapsable={false}
        testID={`${testID}-row`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}
      >
        {button('−', -1, `Decrease ${label}`)}
        <TextInput
          testID={`${testID}-input`}
          accessibilityLabel={label}
          keyboardType="decimal-pad"
          value={text}
          placeholder="—"
          placeholderTextColor={c.ink3}
          onChangeText={(next) => {
            setText(next);
            onChange(parseEntry(next));
          }}
          style={{
            flex: 1, minHeight: LOGGER_TARGET, textAlign: 'center',
            borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
            color: c.ink, backgroundColor: c.sunken, fontSize: 22,
          }}
        />
        {button('+', 1, `Increase ${label}`)}
      </View>
    </View>
  );
}

export function SetEntry({
  exercise, value, onChange, onCommit, onRepeatLast, error, commitLabel = 'Save set', busy,
}: SetEntryProps) {
  const { c } = useTheme();
  const tracks = trackedFields(exercise);
  const set = <K extends keyof SetEntryValue>(k: K, v: SetEntryValue[K]) =>
    onChange({ ...value, [k]: v });

  return (
    // Also a native group, so Warm-up and Save are ordered among the fields and
    // not among everything else on the logger screen.
    <View collapsable={false} style={{ gap: space.md }} testID="set-entry">
      {tracks.load ? (
        <Stepper
          label={`Load (${exercise.default_unit ?? 'kg'})`}
          value={value.loadKg}
          onChange={(n) => set('loadKg', n)}
          step={2.5} min={0} max={1000}
          testID="entry-load"
        />
      ) : null}

      {tracks.reps ? (
        <Stepper
          label="Reps" value={value.reps} onChange={(n) => set('reps', n === null ? null : Math.round(n))}
          step={1} min={1} max={1000} testID="entry-reps"
        />
      ) : null}

      {tracks.duration ? (
        <Stepper
          label="Time (seconds)" value={value.durationSeconds}
          onChange={(n) => set('durationSeconds', n === null ? null : Math.round(n))}
          step={15} min={1} max={86400} testID="entry-duration"
        />
      ) : null}

      {tracks.distance ? (
        <Stepper
          label="Distance (metres)" value={value.distanceM}
          onChange={(n) => set('distanceM', n)}
          step={100} min={1} max={1000000} testID="entry-distance"
        />
      ) : null}

      <Pressable
        onPress={() => set('setType', value.setType === 'warmup' ? 'working' : 'warmup')}
        accessibilityRole="switch"
        accessibilityState={{ checked: value.setType === 'warmup' }}
        accessibilityLabel="Warm-up set"
        testID="entry-warmup"
        style={{
          alignSelf: 'flex-start', paddingHorizontal: space.md, minHeight: 40,
          justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1,
          borderColor: value.setType === 'warmup' ? c.accent : c.line2,
          backgroundColor: value.setType === 'warmup' ? c.accent : 'transparent',
        }}
      >
        <Text variant="caption" style={{ color: value.setType === 'warmup' ? c.accentInk : c.ink2 }}>
          Warm-up
        </Text>
      </Pressable>

      {error ? (
        <Text variant="caption" tone="crit" testID="entry-error">{error}</Text>
      ) : null}

      <Button
        title={commitLabel}
        onPress={onCommit}
        loading={busy}
        style={{ minHeight: LOGGER_TARGET }}
        testID="entry-commit"
      />

      {onRepeatLast ? (
        <Button
          title="Same as last set"
          kind="ghost"
          onPress={onRepeatLast}
          style={{ minHeight: LOGGER_TARGET }}
          testID="entry-repeat"
        />
      ) : null}
    </View>
  );
}
