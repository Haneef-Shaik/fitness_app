/**
 * Who owns the status-bar inset.
 *
 * Normally each screen does, through its SafeAreaView. But the native
 * SafeAreaView always applies the window's full inset, wherever it sits — so
 * when the shell puts L-02's sync banner above the stack, the banner has
 * already cleared the status bar and a screen that insets itself again leaves
 * a blank strip. The shell says so through this context; screens ask
 * `useScreenEdges()` instead of hard-coding `'top'`.
 */
import { createContext, useContext } from 'react';
import type { Edge } from 'react-native-safe-area-context';

export const TopInsetHandled = createContext(false);

export function useScreenEdges(): Edge[] {
  return useContext(TopInsetHandled) ? ['left', 'right'] : ['top', 'left', 'right'];
}

/**
 * True while the tab bar sits below the screen. The bar clears the home
 * indicator itself, so a screen that also insets its bottom would leave a
 * blank band above the bar.
 */
export const BottomInsetHandled = createContext(false);
