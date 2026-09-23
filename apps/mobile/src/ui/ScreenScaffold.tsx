/**
 * The stacked-screen scaffold (H2.1): back affordance, title, optional trailing
 * action, and a body that respects the safe areas. Every D-* and C-* screen uses
 * it so headers cannot drift apart screen by screen.
 */
import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Pressable } from '@/ui/Pressable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSession } from '../lib/session';
import { Text } from './index';
import { useScreenEdges } from './topInset';
import { font, space, useTheme } from '../theme';

export interface ScreenScaffoldProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  action?: { label: string; onPress: () => void };
  /**
   * A tab root (00 §4): a section title, no back, and the notifications bell
   * and avatar (→ K-01 Settings) on the right.
   */
  root?: boolean;
  /** testID for the title — the dashboard's date is what flows wait for. */
  titleTestID?: string;
  /** Pull to refresh — every tab root has it (00 §3.8). */
  onRefresh?: () => void;
  /** Set false when the body scrolls itself (a virtualised list). */
  scroll?: boolean;
  children: React.ReactNode;
}

export function ScreenScaffold({
  title, subtitle, back = true, onBack, action, root = false, titleTestID, onRefresh, scroll = true, children,
}: ScreenScaffoldProps) {
  const { c } = useTheme();

  const [pulling, setPulling] = React.useState(false);
  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? {
        contentContainerStyle: { padding: space.lg, paddingBottom: space.huge },
        refreshControl: onRefresh ? (
          <RefreshControl
            refreshing={pulling}
            tintColor={c.ink3}
            onRefresh={() => {
              setPulling(true);
              onRefresh();
              // The queries own their own loading states; the spinner is only
              // the acknowledgement that the pull registered.
              setTimeout(() => setPulling(false), 600);
            }}
          />
        ) : undefined,
      }
    : { style: { flex: 1 } };

  // Not a fixed ['top', …]: under L-02's banner the top is already cleared.
  const edges = useScreenEdges();

  return (
    <SafeAreaView
      edges={edges}
      testID="screen-safe-area"
      style={{ flex: 1, backgroundColor: c.page }}
    >
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: space.md,
          paddingHorizontal: space.lg, paddingVertical: space.md,
          borderBottomWidth: 1, borderColor: c.line,
        }}
      >
        {back && !root ? (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            accessibilityRole="button"
            accessibilityLabel="Back"
            testID="screen-back"
            hitSlop={12}
            style={{ minWidth: 36, minHeight: 36, marginLeft: -6, justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={26} color={c.ink2} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text
            variant={root ? 'h1' : 'title'}
            numberOfLines={1}
            accessibilityRole="header"
            testID={titleTestID}
          >
            {title}
          </Text>
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
            <Text variant="body" tone="accent">{action.label}</Text>
          </Pressable>
        ) : null}
        {root ? <RootActions /> : null}
      </View>
      <Body {...bodyProps}>{children}</Body>
    </SafeAreaView>
  );
}

/** The tab-root trailing controls: notifications (B-04) and the avatar (K-01). */
function RootActions() {
  const { c } = useTheme();
  // Null outside a SessionProvider (a screen rendered on its own); the avatar
  // then shows "?" rather than taking the screen down.
  const session = useSession() as ReturnType<typeof useSession> | null;
  const name = session?.profile?.display_name || session?.email || '';
  const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      <Pressable
        onPress={() => router.push('/notifications')}
        accessibilityRole="button"
        accessibilityLabel="Notifications and reminders"
        testID="open-notifications"
        hitSlop={8}
        style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}
      >
        <Ionicons name="notifications-outline" size={22} color={c.ink2} />
      </Pressable>
      <Pressable
        onPress={() => router.push('/settings')}
        accessibilityRole="button"
        accessibilityLabel="Profile and settings"
        testID="open-settings"
        style={{
          width: 36, height: 36, borderRadius: 18, backgroundColor: c.accentWash,
          borderWidth: 1, borderColor: c.line2, alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text variant="caption" tone="accent" style={{ fontFamily: font.uiSemi }}>{initials}</Text>
      </Pressable>
    </View>
  );
}
