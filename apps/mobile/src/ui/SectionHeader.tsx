/**
 * The uppercase eyebrow above a group of cards — "RECENT SESSIONS" — with an
 * optional link on the right ("See all"). A header for a screen reader.
 */
import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable } from './Pressable';
import { Text } from './index';
import { space, useTheme } from '@/theme';

export interface SectionHeaderProps {
  title: string;
  /** A fact on the right ("Last 7 days"), when there is no link. */
  detail?: string;
  action?: { label: string; onPress: () => void; testID?: string };
  testID?: string;
  style?: ViewStyle;
}

export function SectionHeader({ title, detail, action, testID, style }: SectionHeaderProps) {
  const { c } = useTheme();
  return (
    <View testID={testID} style={[{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm, minHeight: 28 }, style]}>
      <Text variant="label" accessibilityRole="header" style={{ flex: 1 }} numberOfLines={1}>{title}</Text>
      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          testID={action.testID}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 28 }}
        >
          <Text variant="caption" tone="accent" weight="semi">{action.label}</Text>
          <Ionicons name="chevron-forward" size={14} color={c.accent} />
        </Pressable>
      ) : detail ? (
        <Text variant="caption" tone="ink3">{detail}</Text>
      ) : null}
    </View>
  );
}
