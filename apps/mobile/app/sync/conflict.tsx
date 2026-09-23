/**
 * L-07 · Sync conflict.
 *
 * **Both versions are always shown with enough detail to choose.** A silent
 * last-writer-wins on a workout somebody spent an hour logging is unacceptable,
 * and so is a dialog that says "there was a conflict" and offers OK.
 *
 * **Set-level conflicts never reach here.** Sets are idempotent on their client
 * id, so a replayed outbox merges rather than conflicts (L-07 says so
 * explicitly). This is for whole-record changes — session metadata, meals,
 * programs, profile settings — and for the case where the thing a queued write
 * was aimed at has since been deleted.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { summarise } from '@/features/sync/describe';
import { useDiscardQueued, useOutbox, useRetryQueued } from '@/lib/query/hooks';
import { api } from '@/lib/api';
import { space } from '@/theme';

export default function Conflict() {
  const { entry } = useLocalSearchParams<{ entry?: string }>();
  const id = Number(entry);
  const outbox = useOutbox();
  const retry = useRetryQueued();
  const discard = useDiscardQueued();

  const row = (outbox.data ?? []).find((e) => e.id === id);
  const [server, setServer] = useState<'loading' | 'gone' | 'present'>('loading');

  // What the server has now, so both sides of the choice are real.
  useEffect(() => {
    if (!row) return;
    let live = true;
    void api.get(row.path.replace(/\/sets$/, ''))
      .then(() => { if (live) setServer('present'); })
      .catch(() => { if (live) setServer('gone'); });
    return () => { live = false; };
  }, [row]);

  if (!row) {
    return (
      <ScreenScaffold title="Sync">
        <Card>
          <Text variant="body" testID="conflict-resolved">
            That change is no longer waiting.
          </Text>
          <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
            It either went through or was discarded while this was open.
          </Text>
        </Card>
      </ScreenScaffold>
    );
  }

  const { title, detail } = summarise(row);

  return (
    <ScreenScaffold title="This was changed somewhere else">
      <View style={{ gap: space.lg }}>
        <Card>
          <Text variant="body" testID="conflict-reason">
            {row.lastError ?? 'The server refused this change.'}
          </Text>
        </Card>

        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Card style={{ flex: 1 }}>
            <Text variant="label">On this device</Text>
            <Text variant="body" style={{ marginTop: 6 }}>{title}</Text>
            {detail ? (
              <Text variant="caption" tone="ink3">{detail}</Text>
            ) : null}
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
              {row.attempts} {row.attempts === 1 ? 'attempt' : 'attempts'}
            </Text>
          </Card>

          <Card style={{ flex: 1 }}>
            <Text variant="label">On the server</Text>
            <Text variant="body" style={{ marginTop: 6 }} testID="conflict-server">
              {server === 'loading' ? 'Checking…'
                : server === 'gone' ? 'No longer there'
                : 'A newer version'}
            </Text>
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
              {server === 'gone'
                ? 'It was deleted, here or on another device.'
                : 'Changed after this device queued its version.'}
            </Text>
          </Card>
        </View>

        <Button
          title="Send mine anyway"
          testID="conflict-retry"
          onPress={() => {
            retry.mutate(row.id);
            router.back();
          }}
        />
        <Button
          title="Throw mine away"
          kind="danger"
          testID="conflict-discard"
          onPress={() => {
            discard.mutate(row.id);
            router.back();
          }}
        />
        <Text variant="caption" tone="ink3">
          {/* The reassurance the wireframe's set-level note exists to give. */}
          Individual sets never end up here — they merge on their own id, so a
          retry can never double one.
        </Text>
      </View>
    </ScreenScaffold>
  );
}
