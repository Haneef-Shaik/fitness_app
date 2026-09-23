/**
 * B-04 · Reminders.
 *
 * **Nothing here is switched on by default, and nothing here pretends to work
 * yet.** Scheduling needs `expo-notifications` and a permission prompt, neither
 * of which this build has; the preferences are stored on the device so they
 * survive, and the screen says plainly that they do not fire yet.
 *
 * A toggle that silently does nothing is worse than one that admits it — the
 * user would conclude the reminder failed, not that it was never sent.
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { getPref, setPref } from '@/lib/prefs';
import { space } from '@/theme';

const REMINDERS = [
  { key: 'workout', label: 'Workout reminder', detail: 'On the days your program plans one' },
  { key: 'weigh_in', label: 'Weigh-in', detail: 'First thing, when the number means most' },
  { key: 'meal_log', label: 'Log your meals', detail: 'If nothing is logged by evening' },
] as const;

const KEY = 'reminders';

export default function Notifications() {
  const [on, setOn] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void getPref<Record<string, boolean>>(KEY, {}).then(setOn);
  }, []);

  return (
    <ScreenScaffold title="Reminders">
      <View style={{ gap: space.md }}>
        <Card>
          {/* Said before the toggles, not after. */}
          <Text variant="body">These do not send yet.</Text>
          <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
            Your choices are remembered on this device, and reminders start arriving
            when notifications ship. Nothing is switched on for you.
          </Text>
        </Card>

        {REMINDERS.map((reminder) => (
          <Card key={reminder.key}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <View style={{ flex: 1 }}>
                <Text variant="body">{reminder.label}</Text>
                <Text variant="caption" tone="ink3">{reminder.detail}</Text>
              </View>
              <Button
                title={on[reminder.key] ? 'On' : 'Off'}
                kind={on[reminder.key] ? 'primary' : 'ghost'}
                size="sm"
                testID={`reminder-${reminder.key}`}
                onPress={async () => {
                  const next = { ...on, [reminder.key]: !on[reminder.key] };
                  setOn(next);
                  await setPref(KEY, next);
                }}
              />
            </View>
          </Card>
        ))}
      </View>
    </ScreenScaffold>
  );
}
