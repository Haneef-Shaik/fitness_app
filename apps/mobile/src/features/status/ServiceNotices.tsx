/**
 * L-08 · Maintenance / degraded — the two ways the service tells the app it
 * is not itself.
 *
 * Maintenance covers the screen, because nothing that needs the server will
 * work — but it can be set aside: logging a workout never needed the server
 * (I10), and what is logged waits in the queue for the service to return.
 *
 * "AI degraded" is a line on the screens that use it, not a takeover: the rest
 * of nutrition logging is unaffected (I14), and it says what still works.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text } from '@/ui';
import { space, useTheme } from '@/theme';
import { useServiceStatus } from './useServiceStatus';

export function MaintenanceOverlay() {
  const { c } = useTheme();
  const status = useServiceStatus();
  const [setAside, setSetAside] = useState(false);
  if (!status.data?.maintenance || setAside) return null;

  return (
    <View
      testID="maintenance"
      accessibilityViewIsModal
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.page }}
    >
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: space.lg, gap: space.md }}>
        <Text variant="title" accessibilityRole="header">FitLog is down for maintenance</Text>
        <Text variant="body" tone="ink2">
          {status.data.message ?? "We're working on it and will be back shortly."}
        </Text>
        <Text variant="caption" tone="ink3">
          You can still log a workout. It's saved on this phone and uploads when we're back.
        </Text>
        <Button title="Try again" testID="maintenance-retry" onPress={() => { void status.refetch(); }} />
        <Button title="Continue offline" kind="ghost" testID="maintenance-dismiss" onPress={() => setSetAside(true)} />
      </SafeAreaView>
    </View>
  );
}

export function AiDegradedNotice() {
  const status = useServiceStatus();
  if (status.data?.ai !== 'degraded') return null;
  return (
    <Card testID="ai-degraded">
      <Text variant="body">Food analysis is having trouble right now.</Text>
      <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
        Estimates may fail or take longer. Searching for a food or adding it by hand works as usual.
      </Text>
    </Card>
  );
}
