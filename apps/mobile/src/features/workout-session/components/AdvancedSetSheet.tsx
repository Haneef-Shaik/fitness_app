/**
 * E-06 · Advanced Set Editor — set type, RPE, RIR and a per-set note.
 *
 * One sheet, two uses: from "More" it shapes the NEXT set before it is saved;
 * from a committed row it edits THAT set, and offers Delete. Load and reps stay
 * on the logger itself — the sheet is for what a lifter adds occasionally, so
 * the common path never has to open it.
 */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Text } from '@/ui';
import { Choice } from '@/ui/Choice';
import { Sheet } from '@/ui/Sheet';
import { TextInput } from '@/ui/TextInput';
import { radius, space, useTheme } from '@/theme';
import type { SetType } from '@fitlog/domain';
import { NOTE_MAX, SET_TYPES, withRir, withRpe, type AdvancedValue } from '../advanced';
import { Stepper } from './SetEntry';

export interface AdvancedSetSheetProps {
  visible: boolean;
  title: string;
  value: AdvancedValue;
  onChange: (next: AdvancedValue) => void;
  onDone: () => void;
  /** Only when editing a committed set. */
  onDelete?: () => void;
}

export function AdvancedSetSheet({
  visible, title, value, onChange, onDone, onDelete,
}: AdvancedSetSheetProps) {
  const { c } = useTheme();
  const consequence = SET_TYPES.find((t) => t.value === value.setType)?.consequence;

  return (
    <Sheet
      visible={visible}
      onClose={onDone}
      title={title}
      testID="advanced-set-sheet"
      footer={(
        <View style={{ flexDirection: 'row', gap: space.md }}>
          {onDelete ? (
            <Button title="Delete set" kind="danger" style={{ flex: 1 }} onPress={onDelete} testID="advanced-delete" />
          ) : null}
          <Button title="Done" style={{ flex: 1 }} onPress={onDone} testID="advanced-done" />
        </View>
      )}
    >
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: space.sm }}>
          <Text variant="label">Set type</Text>
          <Choice<SetType>
            options={SET_TYPES}
            value={value.setType}
            onChange={(setType) => onChange({ ...value, setType })}
            testID="advanced-type"
          />
          {consequence ? (
            <Text variant="caption" tone="ink3" testID="advanced-consequence">{consequence}</Text>
          ) : null}
        </View>

        <Stepper
          label="RPE (effort, 0–10)"
          value={value.rpe}
          onChange={(n) => onChange(withRpe(value, n))}
          step={0.5} min={0} max={10}
          testID="advanced-rpe"
        />
        <Stepper
          label="RIR (reps left in the tank)"
          value={value.rir}
          onChange={(n) => onChange(withRir(value, n))}
          step={0.5} min={0} max={10}
          testID="advanced-rir"
        />

        <View style={{ gap: space.sm }}>
          <Text variant="label" accessibilityElementsHidden importantForAccessibility="no">Note</Text>
          <TextInput
            testID="advanced-note"
            accessibilityLabel="Note for this set"
            value={value.note ?? ''}
            onChangeText={(note) => onChange({ ...value, note })}
            placeholder="Left side felt weak"
            placeholderTextColor={c.ink3}
            maxLength={NOTE_MAX}
            multiline
            style={{
              minHeight: 88, padding: space.md, textAlignVertical: 'top',
              borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
              color: c.ink, backgroundColor: c.sunken,
            }}
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}
