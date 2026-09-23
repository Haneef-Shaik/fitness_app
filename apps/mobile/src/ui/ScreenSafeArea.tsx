/**
 * A screen's root SafeAreaView, minus the top edge when the shell's sync banner
 * has already cleared the status bar (see `topInset.ts`). A component rather
 * than a hook so it can sit behind a screen's early returns.
 */
import React, { useContext } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ViewProps } from 'react-native';
import { BottomInsetHandled, useScreenEdges } from './topInset';

export function ScreenSafeArea(props: ViewProps) {
  const edges = useScreenEdges();
  const tabBarBelow = useContext(BottomInsetHandled);
  return <SafeAreaView {...props} edges={tabBarBelow ? edges : [...edges, 'bottom']} />;
}
