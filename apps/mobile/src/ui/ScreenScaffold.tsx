/**
 * The stacked-screen scaffold (H2.1): back affordance, title, optional trailing
 * action, and a body that respects the safe areas. Every D-* and C-* screen uses
 * it so headers cannot drift apart screen by screen.
 */
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text } from './index';
import { space, useTheme } from '../theme';

export interface ScreenScaffoldProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  action?: { label: string; onPress: () => void };
  /** Set false when the body scrolls itself (a virtualised list). */
  scroll?: boolean;
  children: React.ReactNode;
}

export function ScreenScaffold({
  title, subtitle, back = true, onBack, action, scroll = true, children,
}: ScreenScaffoldProps) {
  const { c } = useTheme();

  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? { contentContainerStyle: { padding: space.lg, paddingBottom: space.huge } }
    : { style: { flex: 1 } };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: c.page }}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: space.md,
          paddingHorizontal: space.lg, paddingVertical: space.md,
          borderBottomWidth: 1, borderColor: c.line,
        }}
      >
        {back ? (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            style={{ minWidth: 32, minHeight: 32, justifyContent: 'center' }}
          >
            <Text variant="title" tone="ink2">‹</Text>
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text variant="title" numberOfLines={1} accessibilityRole="header">{title}</Text>
          {subtitle ? (
            <Text variant="caption" tone="ink3" numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>
        {action ? (
          <Pressable
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            hitSlop={12}
            style={{ minHeight: 32, justifyContent: 'center' }}
          >
            <Text variant="body" style={{ color: c.accent }}>{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
      <Body {...bodyProps}>{children}</Body>
    </SafeAreaView>
  );
}
