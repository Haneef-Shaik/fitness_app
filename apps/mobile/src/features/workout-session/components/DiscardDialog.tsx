/**
 * E-09 · Discard Session.
 *
 * It names the **exact count** of what will be lost. "Discard this workout?" is
 * a question the user cannot answer; "Discard 3 exercises and 11 sets?" is.
 * Discarding is irreversible, so it is confirmed rather than undoable — the one
 * place in the logger where a pre-confirmation beats an undo.
 */
import React from 'react';
import { View } from 'react-native';
import { Button, Text } from '@/ui';
import { Sheet } from '@/ui/Sheet';
import { space, useTheme } from '@/theme';
import { countSets, type SessionDraft } from '../store/types';

export interface DiscardDialogProps {
  visible: boolean;
  draft: SessionDraft | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DiscardDialog({ visible, draft, onCancel, onConfirm }: DiscardDialogProps) {
  const { c } = useTheme();
  const sets = draft ? countSets(draft) : 0;
  const exercises = draft?.exercises.length ?? 0;

  const what = sets === 0
    ? 'Nothing has been logged yet.'
    : `${exercises} ${exercises === 1 ? 'exercise' : 'exercises'} and `
      + `${sets} ${sets === 1 ? 'set' : 'sets'} will be lost.`;

  return (
    <Sheet visible={visible} onClose={onCancel} title="Discard this workout?" testID="discard-dialog">
      <View style={{ padding: space.lg, gap: space.md }}>
        <Text variant="body" tone="ink2" testID="discard-what">{what}</Text>
        <Text variant="caption" tone="ink3">
          This cannot be undone. If you just want to stop here, finish the workout
          instead — everything you logged is kept.
        </Text>
        <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.md }}>
          <Button title="Keep going" kind="ghost" style={{ flex: 1 }} onPress={onCancel} />
          <Button
            title="Discard"
            kind="danger"
            style={{ flex: 1, borderColor: c.crit, borderWidth: 1 }}
            onPress={onConfirm}
          />
        </View>
      </View>
    </Sheet>
  );
}
