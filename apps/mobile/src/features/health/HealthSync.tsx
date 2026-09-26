/**
 * Pulls new weigh-ins from the health store when the app comes to the
 * foreground, if the person turned that on. Mounted once in the shell.
 */
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSession } from '@/lib/session';
import { healthBridge } from './bridge';
import { importWeights } from './sync';

function Sync(): null {
  useEffect(() => {
    const bridge = healthBridge();
    if (!bridge) return undefined;
    const run = () => { void importWeights(bridge).catch(() => { /* the screen reports; this retries next time */ }); };
    run();
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') run(); });
    return () => sub.remove();
  }, []);
  return null;
}

export function HealthSync(): React.JSX.Element | null {
  const { status } = useSession();
  return status === 'ready' ? <Sync /> : null;
}
