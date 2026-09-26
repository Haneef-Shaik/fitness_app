/**
 * Opens what a tapped notification is about — a reminder's screen, or a
 * finished meal estimate's review (`routeFor`). Mounted once in the shell, and
 * only for a signed-in account: a reminder cannot open a screen behind the login.
 * It also sets, once, that notifications show while the app is open.
 *
 * The tap that LAUNCHED the app arrives before this is mounted — the session
 * is restored first — so the last response is read on mount as well as
 * listened for. And the route waits until the start screen ("/") has sent the
 * user home, because its redirect would replace the screen the tap opened.
 */
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import type { NotificationResponse } from 'expo-notifications';
import { useSession } from '@/lib/session';
import { resetTo } from '@/lib/navigation';
import { TABS } from '@/ui/shell/tabs';
import { showWhileOpen } from './display';
import { routeFor } from './route';

type Notifications = typeof import('expo-notifications');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const notifications = () => require('expo-notifications') as Notifications;

/** The last tap opened, across remounts: launch and listener can both deliver it. */
let lastOpened: string | null = null;

function Taps(): null {
  const pathname = usePathname();
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return undefined;
    const N = notifications();
    const open = (response: NotificationResponse | null) => {
      if (!response || response.actionIdentifier !== N.DEFAULT_ACTION_IDENTIFIER) return;
      const { request, date } = response.notification;
      const seen = `${request.identifier}@${date}`;
      if (seen === lastOpened) return;
      lastOpened = seen;
      try { N.clearLastNotificationResponse(); } catch { /* the dedupe above covers it */ }
      const to = routeFor(request.content.data);
      if (to) setPending(to);
    };
    try { open(N.getLastNotificationResponse()); } catch { /* unavailable: the listener still works */ }
    const sub = N.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!pending || pathname === '/') return;
    setPending(null);
    // A tab's root goes the way the tab bar goes — history reset to it — so
    // tapping the meal reminder on Nutrition does not stack a second Nutrition.
    if (TABS.some((t) => t.href === pending)) {
      if (pathname !== pending) resetTo(pending as never);
    } else {
      router.push(pending as never);
    }
  }, [pending, pathname]);

  return null;
}

export function NotificationTaps(): React.JSX.Element | null {
  const { status } = useSession();
  useEffect(() => { showWhileOpen(); }, []);
  return status === 'ready' ? <Taps /> : null;
}
