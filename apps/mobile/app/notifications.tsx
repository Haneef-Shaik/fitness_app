/**
 * B-04 · Reminders.
 *
 * Until G10 these were toggles above the words "These do not send yet". They
 * are local notifications now: nothing leaves the phone, and nothing is
 * switched on for anyone. Switching one on asks for permission first; a
 * refusal leaves the switch off and says where to change it, because a toggle
 * that silently does nothing is worse than no toggle.
 *
 * What gets scheduled is `plannedReminders` — the workout reminder follows the
 * active program's days, the check-in one follows the next check-in.
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { getPref, setPref } from '@/lib/prefs';
import { plannedReminders, type ReminderKey } from '@/features/reminders/plan';
import { REMINDERS_PREF, useReminderContext } from '@/features/reminders/useReminderContext';
import { applyReminders, ensurePermission } from '@/features/reminders/schedule';
import { space } from '@/theme';

const REMINDERS: readonly { key: ReminderKey; label: string; detail: string }[] = [
  { key: 'workout', label: 'Workout reminder', detail: '5 pm on the days your program plans one' },
  { key: 'weigh_in', label: 'Weigh-in', detail: '7:30 every morning — before breakfast is when it means most' },
  { key: 'meal_log', label: 'Log your meals', detail: '8 pm every evening' },
  { key: 'checkin', label: 'Check-in', detail: '8 am on the day your next check-in is due' },
];

type Switches = Partial<Record<ReminderKey, boolean>>;

export default function Notifications() {
  const [on, setOn] = useState<Switches>({});
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctx = useReminderContext();

  useEffect(() => {
    void getPref<Switches>(REMINDERS_PREF, {}).then(setOn);
  }, []);

  const toggle = async (key: ReminderKey) => {
    setError(null);
    const turningOn = !on[key];
    if (turningOn && (await ensurePermission()) !== 'granted') {
      setDenied(true);
      return;
    }
    const next = { ...on, [key]: turningOn };
    setOn(next);
    await setPref(REMINDERS_PREF, next);
    try {
      await applyReminders(plannedReminders(next, ctx));
    } catch {
      setError("Couldn't set that reminder on this phone. Try again.");
    }
  };

  return (
    <ScreenScaffold title="Reminders" subtitle="Notifications from this phone — nothing is sent anywhere">
      <View style={{ gap: space.md }}>
        {denied ? (
          <Card testID="reminders-denied">
            <Text variant="body">Notifications are off for this app.</Text>
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
              Turn them on in your phone&apos;s Settings → Apps → Expo Go → Notifications, then try again.
            </Text>
          </Card>
        ) : null}
        {error ? <Text variant="caption" tone="crit">{error}</Text> : null}

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
                onPress={() => { void toggle(reminder.key); }}
              />
            </View>
          </Card>
        ))}
        {on.workout && ctx.programWeekdays.length === 0 ? (
          <Text variant="caption" tone="ink3">
            Your program has no days on the calendar, so there is nothing to remind you of yet.
          </Text>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}
