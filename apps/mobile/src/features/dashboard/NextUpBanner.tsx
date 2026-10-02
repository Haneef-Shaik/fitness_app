/**
 * B-01's "up next" line — the one thing the dashboard suggests doing now,
 * decided by `nextUp`. One tap takes you there. Hidden on a brand-new
 * account, where the checklist does this job.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable } from '@/ui/Pressable';
import { Text } from '@/ui';
import { IconTile } from '@/ui/IconTile';
import { radius, space, useTheme } from '@/theme';
import { nextUp, type NextUpInput } from './nextUp';

export function NextUpBanner({ data, hour = new Date().getHours() }: { data: NextUpInput; hour?: number }) {
  const { c } = useTheme();
  const next = nextUp(data, hour);
  if (next.kind === 'first-run') return null;
  const done = next.kind === 'done';

  return (
    <Pressable
      onPress={() => { if (next.href) router.push(next.href as never); }}
      accessibilityRole="button"
      accessibilityLabel={`Up next: ${next.title}. ${next.body}`}
      testID={`next-up-${next.kind}`}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: space.md,
        paddingVertical: space.md, paddingHorizontal: space.md,
        backgroundColor: pressed ? c.surface2 : c.surface,
        borderRadius: radius.card, borderWidth: 1,
        borderColor: done ? c.line : c.accent,
      })}
    >
      <IconTile icon={next.icon} size={40} tone={done ? 'good' : 'accent'} bg={done ? 'surface2' : 'accentWash'} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="label" tone={done ? 'ink3' : 'accent'}>Up next</Text>
        <Text variant="body" weight="semi" numberOfLines={1}>{next.title}</Text>
        <Text variant="caption" tone="ink3" numberOfLines={1}>{next.body}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={done ? c.ink3 : c.accent} />
    </Pressable>
  );
}
