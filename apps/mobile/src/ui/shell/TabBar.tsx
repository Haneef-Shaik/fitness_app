/**
 * The bottom tab bar (docs/wireframes/00 §4, D2).
 *
 * Switching tab resets the history to that tab's root, so Back on a tab root
 * leaves the app instead of replaying whatever came before — including the
 * welcome screen, which is what made a signed-in user look signed out (G10).
 * The centre action opens B-03 on top and keeps the history.
 */
import React from 'react';
import { View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resetTo } from '../../lib/navigation';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable } from '../Pressable';
import { Text } from '../index';
import { font, radius, useTheme } from '../../theme';
import { activeTab, TABS, type Tab } from './tabs';

const BAR_HEIGHT = 72;
const ACTION = 56;

export function goToTab(href: Tab['href'], pathname: string) {
  if (pathname === href) return;
  resetTo(href);
}

export function TabBar() {
  const { c } = useTheme();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const current = activeTab(pathname);

  return (
    <View
      testID="tab-bar"
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row', alignItems: 'flex-start',
        height: BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom,
        backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.line,
      }}
    >
      {TABS.map((tab) => tab.key === 'action' ? (
        <View key={tab.key} style={{ flex: 1, alignItems: 'center' }}>
          <Pressable
            onPress={() => router.push(tab.href)}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            testID="tab-action"
            style={{
              width: ACTION, height: ACTION, borderRadius: radius.pill, marginTop: -ACTION / 3,
              backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center',
              borderWidth: 3, borderColor: c.surface,
              shadowColor: c.accent, shadowOpacity: 0.28, shadowRadius: 12,
              shadowOffset: { width: 0, height: 5 }, elevation: 5,
            }}
          >
            <Ionicons name="add" size={28} color={c.accentInk} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          key={tab.key}
          onPress={() => goToTab(tab.href, pathname)}
          accessibilityRole="tab"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: current === tab.key }}
          testID={`tab-${tab.key}`}
          style={{
            flex: 1, height: BAR_HEIGHT, alignItems: 'center', justifyContent: 'center', gap: 4,
            paddingTop: 6, borderTopWidth: current === tab.key ? 2 : 0,
            borderTopColor: c.accent,
          }}
        >
          <Ionicons
            // The filled icon AND the brand label mark the active tab (00 §4);
            // the selected state carries it for a screen reader.
            name={(current === tab.key ? tab.iconActive : tab.icon) as never}
            size={24}
            color={current === tab.key ? c.accent : c.ink3}
          />
          <Text
            variant="caption"
            tone={current === tab.key ? 'accent' : 'ink3'}
            style={{ fontSize: 11, fontFamily: current === tab.key ? font.uiSemi : font.uiMedium }}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
