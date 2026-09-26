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
 * active program's days, the check-in one follows the next check-in, and a
 * day's reminder is not sent once that day's entry is logged (K-06).
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Constants from 'expo-constants';
import { Button, Card, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { getPref, setPref } from '@/lib/prefs';
import { phoneClock, plannedReminders, type ReminderKey } from '@/features/reminders/plan';
import { REMINDERS_PREF, useReminderContext } from '@/features/reminders/useReminderContext';
import { applyPlan, applyReminders, ensurePermission } from '@/features/reminders/schedule';
import { checkPermission } from '@/features/permissions/primer';
import { PermissionPrimer } from '@/features/permissions/PermissionPrimer';
import { space } from '@/theme';

/** Whose notification permission it is: Expo Go's in development, the app's own in a build. */
// 'storeClient' is ExecutionEnvironment.StoreClient; the string survives a mocked module.
const APP_NAME = Constants?.executionEnvironment === 'storeClient'
  ? 'Expo Go'
  : (Constants?.expoConfig?.name ?? 'FitLog');

const REMINDERS: readonly { key: ReminderKey; label: string; detail: string }[] = [
  { key: 'workout', label: 'Workout reminder', detail: '5 pm on the days your program plans one, unless you have trained' },
  { key: 'weigh_in', label: 'Weigh-in', detail: '7:30 every morning, unless you have already weighed in' },
  { key: 'meal_log', label: 'Log your meals', detail: '8 pm every evening, unless a meal is already logged' },
  { key: 'checkin', label: 'Check-in', detail: '8 am when your weight and measurements are due — again 2 and 7 days later if not taken' },
];

type Switches = Partial<Record<ReminderKey, boolean>>;

export default function Notifications() {
  const [on, setOn] = useState<Switches>({});
  const [denied, setDenied] = useState(false);
  // L-06: the reminder waiting on FitLog's explanation before the OS asks.
  const [priming, setPriming] = useState<ReminderKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ctx = useReminderContext();

  useEffect(() => {
    void getPref<Switches>(REMINDERS_PREF, {}).then(setOn);
  }, []);

  const toggle = async (key: ReminderKey) => {
    setError(null);
    const turningOn = !on[key];
    if (turningOn) {
      const state = await checkPermission('notifications');
      if (state.status === 'undetermined') { setPriming(key); return; }
    }
    await apply(key, turningOn);
  };

  const apply = async (key: ReminderKey, turningOn: boolean) => {
    if (turningOn && (await ensurePermission()) !== 'granted') {
      setDenied(true);
      return;
    }
    const next = { ...on, [key]: turningOn };
    setOn(next);
    await setPref(REMINDERS_PREF, next);
    try {
      if (ctx.ready) await applyPlan(async () => plannedReminders(next, ctx, phoneClock()));
      // Not loaded yet: a plan now would drop the workout and check-in
      // reminders. The background sync applies this once they load — unless
      // nothing is left on, which needs nothing loaded.
      else if (!Object.values(next).some(Boolean)) await applyReminders([]);
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
              Turn them on in your phone&apos;s Settings → Apps → {APP_NAME} → Notifications, then try again.
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
              {/* A named switch, not a bare "Off, Button": TalkBack read the
                  toggle with no word of which reminder it was (G10 session). */}
              <Button
                title={on[reminder.key] ? 'On' : 'Off'}
                kind={on[reminder.key] ? 'primary' : 'ghost'}
                size="sm"
                testID={`reminder-${reminder.key}`}
                accessibilityRole="switch"
                accessibilityLabel={reminder.label}
                accessibilityState={{ checked: Boolean(on[reminder.key]) }}
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
        {on.checkin && ctx.ready && ctx.nextCheckin === null ? (
          <Text variant="caption" tone="ink3" testID="reminders-first-checkin">
            Check-in reminders count from your last check-in. Take your first from Progress and they start from there.
          </Text>
        ) : null}
      </View>
      <PermissionPrimer
        kind="notifications"
        mode="ask"
        visible={priming !== null}
        onContinue={() => { const key = priming; setPriming(null); if (key) void apply(key, true); }}
        onClose={() => setPriming(null)}
      />
    </ScreenScaffold>
  );
}
