/**
 * L-02's banner, in the app shell.
 *
 * Three rules from the wireframe, and each one is a line of code here:
 *
 * **It states what still works**, not just that something is wrong — "Offline
 * — everything you log is still saving here", never "No connection".
 *
 * **It never covers content and never blocks a tap.** It is a row at the top of
 * the shell, not an overlay, and `pointerEvents` lets everything through except
 * its own button.
 *
 * **It sits below the status bar.** It is the first thing in the shell, so it
 * insets itself — and `SyncShell` tells the screens beneath that it has, since
 * the native SafeAreaView would otherwise inset them again regardless.
 *
 * **It never appears more than once per state change.** It renders from the
 * outbox's actual state, so it is present exactly when there is something true
 * to say and absent otherwise.
 */
import React from 'react';
import { View } from 'react-native';
import { Pressable } from '@/ui/Pressable';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/ui';
import { bannerFor, looksOffline, syncState } from './describe';
import { useOutbox } from '@/lib/query/hooks';
import { space, useTheme } from '@/theme';
import { TopInsetHandled } from '@/ui/topInset';

/** What the banner would say right now, or null for nothing. */
function useBanner(online?: boolean) {
  const outbox = useOutbox();
  const entries = outbox.data ?? [];
  const state = syncState(entries);
  // The app passes nothing: it has no radio API, and the outbox's own record
  // of an unreachable server is the better evidence anyway.
  return { state, message: bannerFor(state, online ?? !looksOffline(entries)) };
}

/**
 * The banner above the app's screens. While it shows, it owns the status-bar
 * inset, and the screens are told so through `TopInsetHandled`.
 */
export function SyncShell({ children, online }: {
  children: React.ReactNode; online?: boolean;
}) {
  const { message } = useBanner(online);
  return (
    <>
      <SyncBanner online={online} />
      <TopInsetHandled.Provider value={message !== null}>{children}</TopInsetHandled.Provider>
    </>
  );
}

export function SyncBanner({ online }: { online?: boolean }) {
  const { c } = useTheme();
  const { state, message } = useBanner(online);
  if (message === null) return null;

  const serious = state.failed.length > 0;

  return (
    <SafeAreaView
      edges={['top']}
      testID="sync-banner-inset"
      style={{ backgroundColor: serious ? c.sunken : c.surface }}
    >
      <View
        testID="sync-banner"
        accessibilityRole="alert"
        accessibilityLabel={message}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          paddingHorizontal: space.lg,
          paddingVertical: space.sm,
          backgroundColor: serious ? c.sunken : c.surface,
          borderBottomWidth: 1,
          borderColor: c.line,
        }}
      >
        {/* The word, not the colour (05 §3 — colour never carries meaning alone). */}
        <Text variant="caption" tone={serious ? 'serious' : 'ink2'} style={{ flex: 1 }}>
          {message}
        </Text>
        <Pressable
          onPress={() => router.push('/sync')}
          accessibilityRole="button"
          accessibilityLabel={serious ? 'Review the changes that could not sync' : 'Sync details'}
          testID="sync-banner-open"
          hitSlop={10}
        >
          <Text variant="caption" tone="accent">
            {serious ? 'Review' : 'Details'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
