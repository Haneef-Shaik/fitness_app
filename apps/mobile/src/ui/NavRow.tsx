/**
 * One row of a navigation list — C-01's "Programs / Exercise library / …" and
 * K-01's settings. Icon, label, an optional fact on the right, a chevron. The
 * whole row is one control with one name, and it meets the 44 px target.
 */
import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable } from './Pressable';
import { Text } from './index';
import { radius, space, target, useTheme } from '../theme';

export interface NavRowProps {
  icon: string;
  label: string;
  detail?: string | null;
  onPress: () => void;
  testID?: string;
  /** Hairline between rows in a group. */
  divider?: boolean;
}

export function NavRow({ icon, label, detail, onPress, testID, divider = true }: NavRowProps) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      testID={testID}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: space.md,
        minHeight: target.min + 8, paddingHorizontal: space.base,
        borderBottomWidth: divider ? 1 : 0, borderBottomColor: c.line,
      }}
    >
      <Ionicons name={icon as never} size={20} color={c.ink2} />
      <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>{label}</Text>
      {detail ? <Text variant="caption" tone="ink3">{detail}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={c.ink3} />
    </Pressable>
  );
}

/** A card-shaped group of NavRows; the last row drops its divider. */
export function NavGroup({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  const rows = React.Children.toArray(children);
  return (
    <View style={{ backgroundColor: c.surface, borderRadius: radius.card, borderWidth: 1, borderColor: c.line, overflow: 'hidden' }}>
      {rows.map((row, i) => React.isValidElement<NavRowProps>(row) && i === rows.length - 1
        ? React.cloneElement(row, { divider: false }) : row)}
    </View>
  );
}
