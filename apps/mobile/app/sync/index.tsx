/**
 * L-02 · Sync Center.
 *
 * **Nothing is ever dropped silently.** That is the whole rule, and everything
 * on this screen follows from it: a terminal failure lands here with the
 * server's own sentence and a concrete choice, and "Discard" is per-item,
 * confirmed, and names what is being thrown away.
 *
 * **The badge counts terminal failures only.** A pending retry is the outbox
 * working exactly as designed — counting it alarms somebody about normal
 * operation, after which they stop reading the badge, which is the same as not
 * having one.
 *
 * A conflict gets L-07's dialog rather than a *Fix* button, because "that meal
 * no longer exists" is not something the user typed wrong.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { syncState, type QueuedChange } from '@/features/sync/describe';
import {
  useDiscardQueued, useDiscardUnattributed, useOutbox, useRetryAllQueued, useRetryQueued, useUnattributed,
} from '@/lib/query/hooks';
import { count } from '@/features/nutrition/format';
import { space } from '@/theme';

export default function SyncCenter() {
  const outbox = useOutbox();
  const retryAll = useRetryAllQueued();

  return (
    <ScreenScaffold title="Sync">
      <DataBoundary query={outbox} isEmpty={() => false} empty={{ title: 'Nothing queued' }}>
        {(entries) => {
          const state = syncState(entries);
          const nothing = state.pending.length === 0 && state.failed.length === 0;

          return (
            <View style={{ gap: space.lg }}>
              {nothing ? (
                <Card>
                  <Text variant="body" testID="sync-clear">Everything is uploaded.</Text>
                  <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                    Anything you log while offline waits here until it can go.
                  </Text>
                </Card>
              ) : null}

              {state.pending.length > 0 ? (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <Text variant="label" style={{ flex: 1 }}>Waiting to upload</Text>
                    <Pill kind="mute">{state.pending.length}</Pill>
                  </View>
                  {state.pending.map((change) => (
                    <PendingRow key={change.id} change={change} />
                  ))}
                  <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
                    {/* Explaining that waiting is normal is what stops somebody
                        "fixing" it by reinstalling. */}
                    These retry on their own. Nothing is lost while they wait.
                  </Text>
                </View>
              ) : null}

              {state.failed.length > 0 ? (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <Text variant="label" style={{ flex: 1 }}>Couldn&apos;t upload</Text>
                    <Pill kind="mute">{state.failed.length}</Pill>
                  </View>
                  {state.failed.map((change) => (
                    <FailedRow key={change.id} change={change} />
                  ))}

                  <Button
                    title="Retry everything"
                    kind="ghost"
                    style={{ marginTop: space.sm }}
                    testID="sync-retry-all"
                    onPress={() => retryAll.mutate(state.failed.map((c) => c.id))}
                  />
                </View>
              ) : null}

              <Unattributed />
            </View>
          );
        }}
      </DataBoundary>
    </ScreenScaffold>
  );
}

function PendingRow({ change }: { change: QueuedChange }) {
  return (
    <Card style={{ marginTop: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Text variant="body">{change.title}</Text>
          {change.detail ? (
            <Text variant="caption" tone="ink3">{change.detail}</Text>
          ) : null}
        </View>
        {change.attempts > 0 ? (
          <Text variant="caption" tone="ink3" testID={`sync-${change.id}-attempts`}>
            {change.attempts} {change.attempts === 1 ? 'try' : 'tries'}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

function FailedRow({ change }: { change: QueuedChange }) {
  const retry = useRetryQueued();
  const discard = useDiscardQueued();
  const [confirming, setConfirming] = useState(false);

  return (
    <Card style={{ marginTop: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Text variant="body">{change.title}</Text>
          {change.detail ? (
            <Text variant="caption" tone="ink3">{change.detail}</Text>
          ) : null}
        </View>
        {/* Not colour alone (05 §3): the word is there too. */}
        <Pill kind="mute">failed</Pill>
      </View>

      {change.reason ? (
        // The server's own sentence, verbatim. Not "an error occurred".
        <Text variant="caption" tone="serious" style={{ marginTop: space.sm }}
              testID={`sync-${change.id}-reason`}>
          {change.reason}
        </Text>
      ) : null}

      {confirming ? (
        <View style={{ marginTop: space.base }}>
          <Text variant="body" testID={`sync-${change.id}-confirm`}>
            {/* Names what is being thrown away. */}
            Throw away this {change.title.toLowerCase()}
            {change.detail ? ` (${change.detail})` : ''}?
          </Text>
          <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
            It has not been saved anywhere else, so this cannot be undone.
          </Text>
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.base }}>
            <Button
              title="Keep it"
              kind="ghost"
              size="sm"
              style={{ flex: 1 }}
              testID={`sync-${change.id}-keep`}
              onPress={() => setConfirming(false)}
            />
            <Button
              title="Discard"
              kind="danger"
              size="sm"
              style={{ flex: 1 }}
              testID={`sync-${change.id}-discard-confirm`}
              onPress={() => discard.mutate(change.id)}
            />
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.base }}>
          {change.kind === 'conflict' || change.kind === 'gone' ? (
            <Button
              title="What happened?"
              kind="ghost"
              size="sm"
              style={{ flex: 1 }}
              testID={`sync-${change.id}-conflict`}
              onPress={() => router.push(`/sync/conflict?entry=${change.id}`)}
            />
          ) : (
            <Button
              title="Try again"
              kind="ghost"
              size="sm"
              style={{ flex: 1 }}
              testID={`sync-${change.id}-retry`}
              onPress={() => retry.mutate(change.id)}
            />
          )}
          <Button
            title="Discard"
            kind="ghost"
            size="sm"
            style={{ flex: 1 }}
            testID={`sync-${change.id}-discard`}
            onPress={() => setConfirming(true)}
          />
        </View>
      )}
    </Card>
  );
}

/**
 * Writes queued before local schema v2 (G10). Nothing records whose they
 * were, so they are never sent as whoever is signed in — that could file one
 * person's meal under another's name. Shown so they are not invisible and
 * permanent; thrown away only when the user confirms.
 */
function Unattributed() {
  const n = useUnattributed().data ?? 0;
  const discard = useDiscardUnattributed();
  const [confirming, setConfirming] = useState(false);
  if (n === 0) return null;
  return (
    <Card testID="sync-unattributed">
      <Text variant="body">{count(n, 'change')} from an older version of the app</Text>
      <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
        They were saved before this phone kept each account separate, so there is no telling whose
        they are. They won&apos;t upload.
      </Text>
      {confirming ? (
        <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.base }}>
          <Button title="Keep them" kind="ghost" size="sm" style={{ flex: 1 }} onPress={() => setConfirming(false)} />
          <Button title="Discard" kind="danger" size="sm" style={{ flex: 1 }}
            testID="sync-unattributed-discard-confirm" onPress={() => discard.mutate()} />
        </View>
      ) : (
        <Button title="Discard them" kind="ghost" size="sm" style={{ marginTop: space.base }}
          testID="sync-unattributed-discard" onPress={() => setConfirming(true)} />
      )}
    </Card>
  );
}
