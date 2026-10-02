/**
 * The screen frame (H2.1): a compact top bar — back, an optional eyebrow
 * ("WORKOUT IN PROGRESS"), the title, an optional trailing action — a body
 * that respects the safe areas, and an optional sticky footer for the
 * screen's one primary action. Every screen uses it so headers cannot drift
 * apart screen by screen.
 */
import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Pressable } from '@/ui/Pressable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSession } from '../lib/session';
import { Text } from './index';
import { StickyFooter } from './StickyFooter';
import { useScreenEdges } from './topInset';
import { font, radius, space, useTheme } from '../theme';
import type { TextTone } from './textTone';

/** How far the tab bar's centre action protrudes above the bar (shell/TabBar). */
const TAB_ACTION_CLEARANCE = 20;

export interface ScreenScaffoldProps {
  title: string;
  subtitle?: string;
  /** A short uppercase line ABOVE the title — the screen's context. */
  eyebrow?: string;
  eyebrowTone?: TextTone;
  back?: boolean;
  onBack?: () => void;
  action?: { label: string; onPress: () => void; testID?: string };
  /** Anything else on the right of the bar: icon buttons, a timer. */
  headerRight?: React.ReactNode;
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
  /** Pinned above the safe area: the screen's primary action. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function ScreenScaffold({
  title, subtitle, eyebrow, eyebrowTone = 'ink3', back = true, onBack, action, headerRight,
  root = false, titleTestID, onRefresh, scroll = true, footer, children,
}: ScreenScaffoldProps) {
  const { c } = useTheme();

  const [pulling, setPulling] = React.useState(false);
  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? {
        contentContainerStyle: { padding: space.base, paddingBottom: space.huge },
        keyboardShouldPersistTaps: 'handled' as const,
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
          flexDirection: 'row', alignItems: 'center', gap: space.sm,
          paddingHorizontal: space.base, minHeight: 60, paddingVertical: space.sm,
          borderBottomWidth: 1, borderColor: c.line, backgroundColor: c.page,
        }}
      >
        {back && !root ? (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            accessibilityRole="button"
            accessibilityLabel="Back"
            testID="screen-back"
            hitSlop={12}
            style={{ width: 40, height: 40, marginLeft: -8, borderRadius: radius.row, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={24} color={c.ink2} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          {eyebrow ? (
            <Text variant="label" tone={eyebrowTone} numberOfLines={1} testID="screen-eyebrow">{eyebrow}</Text>
          ) : null}
          <Text
            variant={root ? 'h2' : 'title'}
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
            testID={action.testID}
            hitSlop={12}
            style={{ minHeight: 40, paddingHorizontal: space.sm, justifyContent: 'center' }}
          >
            <Text variant="body" tone="accent" weight="semi">{action.label}</Text>
          </Pressable>
        ) : null}
        {headerRight}
        {root ? <RootActions /> : null}
      </View>
      <Body {...bodyProps}>{children}</Body>
      {/* On a tab root the centre action button rises above the bar by a third
          of its height; the footer clears it so the two never overlap. */}
      {footer ? <StickyFooter extraBottom={root ? TAB_ACTION_CLEARANCE : 0}>{footer}</StickyFooter> : null}
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
        hitSlop={6}
        style={{
          width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
          borderRadius: radius.row, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line,
        }}
      >
        <Ionicons name="notifications-outline" size={20} color={c.ink2} />
      </Pressable>
      <Pressable
        onPress={() => router.push('/settings')}
        accessibilityRole="button"
        accessibilityLabel="Profile and settings"
        testID="open-settings"
        style={{
          width: 40, height: 40, borderRadius: radius.row, backgroundColor: c.accentWash,
          borderWidth: 1, borderColor: c.line2, alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text variant="caption" tone="accent" style={{ fontFamily: font.uiBold }}>{initials}</Text>
      </Pressable>
    </View>
  );
}
