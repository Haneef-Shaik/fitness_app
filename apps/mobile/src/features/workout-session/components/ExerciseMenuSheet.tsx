/**
 * E-03's ⋮ menu — change the plan mid-workout (BRD §5.1: add, skip, reorder).
 *
 * Each action says what it does to what is already logged. Skip keeps the sets
 * (it is a statement of intent, not a delete); Remove deletes them and asks
 * first, naming how many; Swap is only offered while nothing is logged, because
 * swapping logged sets onto a different exercise would be rewriting history.
 */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Text } from '@/ui';
import { Sheet } from '@/ui/Sheet';
import { space } from '@/theme';
import { count } from '@/features/nutrition/format';

export interface ExerciseMenuSheetProps {
  visible: boolean;
  name: string;
  setCount: number;
  skipped: boolean;
  canMoveEarlier: boolean;
  canMoveLater: boolean;
  onMove: (direction: -1 | 1) => void;
  onToggleSkip: () => void;
  /** E-13 */
  inSuperset: boolean;
  canSupersetWithNext: boolean;
  onSuperset: () => void;
  onSwap: () => void;
  onRemove: () => void;
  onNotes: () => void;
  onHistory: () => void;
  onClose: () => void;
}

export function ExerciseMenuSheet(p: ExerciseMenuSheetProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const close = () => { setConfirmRemove(false); p.onClose(); };

  return (
    <Sheet visible={p.visible} onClose={close} title={p.name} testID="exercise-menu">
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.sm }}>
        {confirmRemove ? (
          <View style={{ gap: space.md }} testID="remove-confirm">
            <Text variant="body">
              Remove {p.name} and its {count(p.setCount, 'set')} from this workout?
            </Text>
            <Text variant="caption" tone="ink3">To keep the sets, skip it instead.</Text>
            <Button title="Remove" kind="danger" testID="remove-yes" onPress={() => { setConfirmRemove(false); p.onRemove(); }} />
            <Button title="Keep it" kind="ghost" onPress={() => setConfirmRemove(false)} />
          </View>
        ) : (
          <>
            <Button title="Notes" kind="ghost" testID="menu-notes" onPress={p.onNotes} />
            <Button title="History for this exercise" kind="ghost" testID="menu-history" onPress={p.onHistory} />
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button title="Move earlier" kind="ghost" style={{ flex: 1 }} disabled={!p.canMoveEarlier}
                testID="menu-earlier" onPress={() => p.onMove(-1)} />
              <Button title="Move later" kind="ghost" style={{ flex: 1 }} disabled={!p.canMoveLater}
                testID="menu-later" onPress={() => p.onMove(1)} />
            </View>
            <Button title={p.skipped ? 'Un-skip' : 'Skip — keep what is logged'} kind="ghost"
              testID="menu-skip" onPress={p.onToggleSkip} />
            <Button
              title={p.inSuperset ? 'Leave the superset' : 'Superset with the next exercise'}
              kind="ghost"
              disabled={!p.inSuperset && !p.canSupersetWithNext}
              testID="menu-superset"
              onPress={p.onSuperset}
            />
            <Button title="Swap for another exercise" kind="ghost" disabled={p.setCount > 0}
              testID="menu-swap" onPress={p.onSwap} />
            {p.setCount > 0 ? (
              <Text variant="caption" tone="ink3">Swap is for an exercise with nothing logged yet.</Text>
            ) : null}
            <Button title="Remove from workout" kind="danger" testID="menu-remove"
              onPress={() => (p.setCount > 0 ? setConfirmRemove(true) : p.onRemove())} />
          </>
        )}
      </ScrollView>
    </Sheet>
  );
}
