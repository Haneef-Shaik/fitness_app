/**
 * Coach OS helper surface.
 *
 * This is intentionally a suggestion, not an autonomous command. The copy
 * tells the member what the assistant can do, and the action always enters an
 * existing reviewable flow. That keeps AI useful while preserving the PRD's
 * explicit-confirmation rule for anything that changes a record.
 */
import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card, Pill, Text, Well } from '@/ui';
import { space, useTheme } from '@/theme';

export type CoachRole = 'member' | 'trainer' | 'owner';

type Props = {
  role?: CoachRole;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
  testID?: string;
  detail?: string;
  badgeLabel?: string;
};

const ROLE_LABEL: Record<CoachRole, string> = {
  member: 'For your next move',
  trainer: 'Trainer copilot',
  owner: 'Gym operations copilot',
};

export function CoachPrompt({
  role = 'member', title, body, actionLabel, onAction, testID = 'coach-prompt', detail, badgeLabel = 'Suggestion',
}: Props) {
  const { c } = useTheme();
  return (
    <Card accent hero pad="lg" testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
        <View
          accessible
          accessibilityLabel="Coach assistant"
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="sparkles" size={21} color={c.accentInk} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}>
            <Text variant="label" tone="accent">{ROLE_LABEL[role]}</Text>
            <Pill kind="accent">{badgeLabel}</Pill>
          </View>
          <Text variant="h2" numberOfLines={2}>{title}</Text>
        </View>
      </View>
      <Text variant="body" tone="ink2" style={{ marginTop: space.md, lineHeight: 22 }}>{body}</Text>
      {detail ? (
          <Well style={{ marginTop: space.md, backgroundColor: 'transparent', borderColor: c.line2 }}>
          <Text variant="caption" tone="ink2">{detail}</Text>
        </Well>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.lg }}>
        <Button title={actionLabel} size="sm" icon="arrow-forward" onPress={onAction} testID={`${testID}-action`} />
        <Text variant="caption" tone="ink3" style={{ flex: 1 }}>Review before saving</Text>
      </View>
    </Card>
  );
}
