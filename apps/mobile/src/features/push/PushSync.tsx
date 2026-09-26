/**
 * Keeps this phone registered for push while an account is signed in, and
 * opens what a tapped notification is about. Mounted once in the shell.
 */
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/lib/session';
import { registerForPush, routeFor } from './push';

type Notifications = typeof import('expo-notifications');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const notifications = () => require('expo-notifications') as Notifications;

function Sync(): null {
  useEffect(() => { void registerForPush(); }, []);
  useEffect(() => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return undefined;
    const sub = notifications().addNotificationResponseReceivedListener((response) => {
      const to = routeFor(response.notification.request.content.data);
      if (to) router.push(to as never);
    });
    return () => sub.remove();
  }, []);
  return null;
}

export function PushSync(): React.JSX.Element | null {
  const { status } = useSession();
  return status === 'ready' ? <Sync /> : null;
}
