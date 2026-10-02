/**
 * One row of a navigation list — C-01's "Programs / Exercise library / …" and
 * K-01's settings. An icon in a square, a label, an optional hint beneath it,
 * an optional fact on the right, a chevron. The whole row is one control with
 * one name, and it meets the 44 px target.
 */
import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable } from './Pressable';
import { Pill, Text } from './index';
import { IconTile } from './IconTile';
import { radius, space, target, useTheme } from '../theme';

export interface NavRowProps {
  icon: string;
  label: string;
  /** A second line under the label — what is behind this row. */
  hint?: string;
  /** A fact on the right — "3 active". */
  detail?: string | null;
  badge?: string;
  onPress: () => void;
  testID?: string;
  /** Hairline between rows in a group. */
  divider?: boolean;
}

export function NavRow({ icon, label, hint, detail, badge, onPress, testID, divider = true }: NavRowProps) {
  const { c } = useTheme();
  const spoken = [label, detail, hint].filter(Boolean).join(', ');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={spoken}
      testID={testID}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: space.md,
        minHeight: hint ? 64 : target.min + 8, paddingHorizontal: space.md, paddingVertical: space.sm,
        backgroundColor: pressed ? c.surface2 : 'transparent',
        borderBottomWidth: divider ? 1 : 0, borderBottomColor: c.line,
      })}
    >
      <IconTile icon={icon} size={36} tone="ink2" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Text variant="body" weight="semi" numberOfLines={1} style={{ flexShrink: 1 }}>{label}</Text>
          {badge ? <Pill kind="accent">{badge}</Pill> : null}
        </View>
        {hint ? <Text variant="caption" tone="ink3" numberOfLines={1} style={{ marginTop: 1 }}>{hint}</Text> : null}
      </View>
      {detail ? <Text variant="caption" tone="ink3">{detail}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={c.ink3} />
    </Pressable>
  );
}

/** A card-shaped group of NavRows; the last row drops its divider. */
export function NavGroup({ children, testID }: { children: React.ReactNode; testID?: string }) {
  const { c } = useTheme();
  const rows = React.Children.toArray(children);
  return (
    <View testID={testID} style={{ backgroundColor: c.surface, borderRadius: radius.card, borderWidth: 1, borderColor: c.line, overflow: 'hidden' }}>
      {rows.map((row, i) => React.isValidElement<NavRowProps>(row) && i === rows.length - 1
        ? React.cloneElement(row, { divider: false }) : row)}
    </View>
  );
}
