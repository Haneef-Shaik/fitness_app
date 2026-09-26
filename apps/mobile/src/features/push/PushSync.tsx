/**
 * Keeps this phone registered for push while an account is signed in. Mounted
 * once in the shell; what a tapped notification opens is `NotificationTaps`.
 */
import React, { useEffect } from 'react';
import { useSession } from '@/lib/session';
import { registerForPush } from './push';

function Sync(): null {
  useEffect(() => { void registerForPush(); }, []);
  return null;
}

export function PushSync(): React.JSX.Element | null {
  const { status } = useSession();
  return status === 'ready' ? <Sync /> : null;
}
