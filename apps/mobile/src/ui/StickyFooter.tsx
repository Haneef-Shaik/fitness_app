/**
 * The bottom of a screen, where the thumb is: a screen's one primary action
 * ("Save set 3", "Add food") lives here, pinned above the home indicator.
 *
 * When the tab bar sits below the screen it already clears the home
 * indicator (`BottomInsetHandled`), so the footer only adds its own padding —
 * plus `extraBottom`, which a tab root uses to clear the centre action button
 * that rises above the bar (seen overlapping "Add food" on the emulator).
 * The insets are read from the context directly rather than through the
 * hook, which throws when a screen is rendered without a provider (tests).
 */
import React, { useContext } from 'react';
import { View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { space, useTheme } from '@/theme';
import { BottomInsetHandled } from './topInset';

export function StickyFooter({
  children, testID, extraBottom = 0,
}: { children: React.ReactNode; testID?: string; extraBottom?: number }) {
  const { c } = useTheme();
  const bottomInset = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const tabBarBelow = useContext(BottomInsetHandled);
  return (
    <View
      testID={testID ?? 'sticky-footer'}
      style={{
        paddingHorizontal: space.base,
        paddingTop: space.md,
        paddingBottom: space.md + extraBottom + (tabBarBelow ? 0 : bottomInset),
        backgroundColor: c.page,
        borderTopWidth: 1,
        borderTopColor: c.line,
        gap: space.sm,
      }}
    >
      {children}
    </View>
  );
}
