/**
 * L-06 · the primer itself, and the hook screens use to go through it.
 *
 * `gate(kind, action)` runs `action` straight away when the permission is
 * already granted — the primer is for the first time, not every time.
 */
import React, { useCallback, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { Button, Text } from '@/ui';
import { Sheet } from '@/ui/Sheet';
import { space } from '@/theme';
import {
  PRIMER_COPY, checkPermission, requestPermission, type PermissionKind,
} from './primer';

type Stage = { kind: PermissionKind; mode: 'ask' | 'blocked' } | null;

export function usePermissionGate() {
  const [stage, setStage] = useState<Stage>(null);
  const pending = useRef<(() => void) | null>(null);

  const gate = useCallback(async (kind: PermissionKind, action: () => void) => {
    const state = await checkPermission(kind);
    if (state.status === 'granted') { action(); return; }
    pending.current = action;
    setStage({ kind, mode: state.canAskAgain ? 'ask' : 'blocked' });
  }, []);

  const proceed = useCallback(async () => {
    if (!stage) return;
    const state = await requestPermission(stage.kind);
    if (state.status === 'granted') {
      setStage(null);
      const action = pending.current;
      pending.current = null;
      action?.();
    } else {
      setStage({ kind: stage.kind, mode: 'blocked' });
    }
  }, [stage]);

  const close = useCallback(() => { pending.current = null; setStage(null); }, []);

  const element = (
    <PermissionPrimer
      kind={stage?.kind ?? 'camera'}
      mode={stage?.mode ?? 'ask'}
      visible={stage !== null}
      onContinue={() => { void proceed(); }}
      onClose={close}
    />
  );

  return { gate, element };
}

export function PermissionPrimer({ kind, mode, visible, onContinue, onClose }: {
  kind: PermissionKind;
  mode: 'ask' | 'blocked';
  visible: boolean;
  onContinue: () => void;
  onClose: () => void;
}) {
  const copy = PRIMER_COPY[kind];
  return (
    <Sheet visible={visible} onClose={onClose} title={copy.title} testID="permission-primer">
      <View style={{ padding: space.lg, gap: space.md }}>
        <Text variant="body" tone="ink2">{copy.body}</Text>
        {mode === 'blocked' ? (
          <>
            <Text variant="body" testID="permission-blocked">
              It's turned off for FitLog. You can turn it on in your phone's Settings.
            </Text>
            <Button title="Open Settings" testID="permission-settings"
              onPress={() => { void Linking.openSettings(); onClose(); }} />
          </>
        ) : (
          <Button title="Continue" testID="permission-continue" onPress={onContinue} />
        )}
        <Button title="Not now" kind="ghost" testID="permission-not-now" onPress={onClose} />
      </View>
    </Sheet>
  );
}
