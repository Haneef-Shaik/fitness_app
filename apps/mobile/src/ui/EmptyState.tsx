/**
 * L-01 · the empty state: an icon, a title, ONE sentence, ONE primary action.
 * Never a dead end. `compact` is the version that sits inside a card, where
 * the card already frames it.
 */
import React from 'react';
import { View } from 'react-native';
import { Button, Text } from './index';
import { IconTile } from './IconTile';
import { space } from '@/theme';

export interface EmptyAction {
  label: string;
  onPress: () => void;
  testID?: string;
}

export interface EmptyStateProps {
  icon?: string;
  title: string;
  body?: string;
  action?: EmptyAction;
  secondary?: EmptyAction;
  compact?: boolean;
  testID?: string;
  titleTestID?: string;
}

export function EmptyState({
  icon = 'sparkles-outline', title, body, action, secondary, compact = false, testID, titleTestID,
}: EmptyStateProps) {
  const align = compact ? 'flex-start' : 'center';
  const textAlign = compact ? 'left' : 'center';
  return (
    <View testID={testID} style={{ alignItems: align, paddingVertical: compact ? 0 : space.xl, gap: space.sm }}>
      <IconTile icon={icon} size={compact ? 40 : 56} tone="accent" bg="accentWash" />
      <Text variant="title" testID={titleTestID} style={{ textAlign, marginTop: compact ? 2 : space.xs }}>{title}</Text>
      {body ? <Text variant="caption" tone="ink2" style={{ textAlign, maxWidth: 320 }}>{body}</Text> : null}
      {action || secondary ? (
        <View style={{ flexDirection: compact ? 'row' : 'column', gap: space.sm, marginTop: space.sm, alignSelf: compact ? 'stretch' : 'auto', minWidth: compact ? undefined : 200 }}>
          {action ? (
            <Button
              title={action.label} onPress={action.onPress} testID={action.testID}
              size={compact ? 'sm' : 'md'} style={compact ? { flex: 1 } : undefined}
            />
          ) : null}
          {secondary ? (
            <Button
              title={secondary.label} onPress={secondary.onPress} testID={secondary.testID}
              kind="ghost" size="sm" style={compact ? { flex: 1 } : undefined}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
