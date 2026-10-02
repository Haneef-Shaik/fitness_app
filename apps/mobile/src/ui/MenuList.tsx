/**
 * A list of big, obvious choices — the quick-action sheet, the add-food
 * chooser. Each row is an icon in a square, a title, one line of hint and a
 * chevron; 64 px tall so it can be hit mid-workout.
 */
import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable } from './Pressable';
import { Pill, Text } from './index';
import { IconTile } from './IconTile';
import { radius, space, useTheme } from '@/theme';
import type { TextTone } from './textTone';

export interface MenuItem {
  key: string;
  icon: string;
  label: string;
  hint?: string;
  onPress: () => void;
  testID?: string;
  /** `accent` for the suggested choice, `danger` for a destructive one. */
  tone?: 'default' | 'accent' | 'danger';
  badge?: string;
  disabled?: boolean;
}

const ICON_TONE: Record<NonNullable<MenuItem['tone']>, TextTone> = {
  default: 'ink2', accent: 'accent', danger: 'crit',
};

export function MenuList({ items, testID }: { items: readonly MenuItem[]; testID?: string }) {
  const { c } = useTheme();
  return (
    <View testID={testID} style={{ gap: space.sm }}>
      {items.map((item) => {
        const tone = item.tone ?? 'default';
        return (
          <Pressable
            key={item.key}
            onPress={item.onPress}
            disabled={item.disabled}
            accessibilityRole="button"
            accessibilityLabel={item.hint ? `${item.label}, ${item.hint}` : item.label}
            accessibilityState={{ disabled: !!item.disabled }}
            testID={item.testID}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: space.md,
              minHeight: 64, paddingHorizontal: space.md, paddingVertical: space.sm,
              backgroundColor: pressed ? c.surface2 : c.surface,
              borderWidth: 1, borderColor: tone === 'accent' ? c.accent : c.line,
              borderRadius: radius.card, opacity: item.disabled ? 0.5 : 1,
            })}
          >
            <IconTile icon={item.icon} size={44} tone={ICON_TONE[tone]} bg={tone === 'accent' ? 'accentWash' : 'surface2'} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text variant="title" tone={tone === 'danger' ? 'crit' : 'ink'} numberOfLines={1} style={{ flexShrink: 1 }}>
                  {item.label}
                </Text>
                {item.badge ? <Pill kind={tone === 'accent' ? 'accent' : 'mute'}>{item.badge}</Pill> : null}
              </View>
              {item.hint ? <Text variant="caption" tone="ink3" numberOfLines={1} style={{ marginTop: 2 }}>{item.hint}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={tone === 'accent' ? c.accent : c.ink3} />
          </Pressable>
        );
      })}
    </View>
  );
}
