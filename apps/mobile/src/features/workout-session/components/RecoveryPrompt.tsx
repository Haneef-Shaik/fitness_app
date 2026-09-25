/**
 * E-10 · Session Recovery.
 *
 * Shown on launch when a draft survived whatever ended the last run — a crash, a
 * battery death, a swipe-away. The three choices are the only honest ones:
 * pick it up, close it off, or throw it away. Nothing is decided for the user,
 * and nothing is deleted without being offered first.
 */
import React from 'react';
import { View } from 'react-native';
import { Button, Text, Well } from '@/ui';
import { Sheet } from '@/ui/Sheet';
import { space } from '@/theme';
import { countSets, type SessionDraft } from '../store/types';
import { startedAgo } from '../a11y';
import { count } from '@/features/nutrition/format';

export interface RecoveryPromptProps {
  visible: boolean;
  draft: SessionDraft | null;
  /** The other session when two devices disagree — offered, never deleted. */
  conflicting?: SessionDraft | null;
  now?: Date;
  onResume: () => void;
  onFinish: () => void;
  onDiscard: () => void;
}

const AGE_PROMPT_HOURS = 24;

export function RecoveryPrompt({
  visible, draft, conflicting, now = new Date(), onResume, onFinish, onDiscard,
}: RecoveryPromptProps) {
  if (!draft) return null;

  const started = Date.parse(draft.startedAt);
  const ageSeconds = Number.isNaN(started) ? 0 : Math.max(0, (now.getTime() - started) / 1000);
  const stale = ageSeconds > AGE_PROMPT_HOURS * 3600;
  const sets = countSets(draft);

  return (
    <Sheet visible={visible} onClose={onResume} title="You left a workout open" testID="recovery-prompt">
      <View style={{ padding: space.lg, gap: space.md }}>
        <Text variant="body" tone="ink2" testID="recovery-what">
          {draft.exercises.length} {draft.exercises.length === 1 ? 'exercise' : 'exercises'}
          {' · '}{sets} {sets === 1 ? 'set' : 'sets'}
          {' · '}{startedAgo(ageSeconds)}
        </Text>

        {stale ? (
          // A day-old draft is far more likely to be abandoned than paused, so
          // resuming it silently would file today's work under yesterday.
          <Well testID="recovery-stale">
            <Text variant="caption" tone="ink3">
              This was started more than a day ago. If you resume it, it stays filed under
              the day it began.
            </Text>
          </Well>
        ) : null}

        {conflicting ? (
          <Well testID="recovery-conflict">
            <Text variant="caption" tone="ink3">
              Another workout was found on your account with {count(countSets(conflicting), 'set')}.
              Whichever you do not keep stays available to discard — neither is deleted.
            </Text>
          </Well>
        ) : null}

        <View style={{ gap: space.sm, marginTop: space.sm }}>
          <Button title="Resume" onPress={onResume} />
          <Button title="Finish it now" kind="ghost" onPress={onFinish} />
          <Button title="Discard" kind="danger" onPress={onDiscard} />
        </View>
      </View>
    </Sheet>
  );
}
