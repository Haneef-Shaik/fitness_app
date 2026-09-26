/**
 * K-03 · Units, locale and time zone.
 *
 * The time zone decides which day a late meal or a midnight workout belongs
 * to (R5). Changing it re-files every past day onto the date it falls on in
 * the new zone — the server does that on save (T4) — so the screen says so,
 * and offers this phone's own zone rather than asking anyone to type one.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { TextInput } from '@/ui/TextInput';
import { Chips, Labelled, Options } from '@/features/onboarding/ui';
import { ApiError } from '@/lib/api';
import { useProfile, useUpdateProfile } from '@/lib/query/hooks';
import { useSession } from '@/lib/session';
import { radius, space, useTheme } from '@/theme';

type Units = 'metric' | 'imperial';
type WeekStart = 0 | 1 | 6;

function deviceTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}

interface Values { units: Units; timezone: string; weekStart: WeekStart }

export default function UnitsAndTime() {
  const query = useProfile();
  return (
    <ScreenScaffold title="Units and time zone">
      <DataBoundary query={query} empty={{ title: 'No profile yet.' }} isEmpty={(p) => !p}>
        {(profile) => (
          <Form initial={{
            units: profile.preferred_unit_system === 'imperial' ? 'imperial' : 'metric',
            timezone: profile.timezone,
            weekStart: ([0, 1, 6] as const).includes(profile.week_starts_on as WeekStart)
              ? profile.week_starts_on as WeekStart : 1,
          }} />
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}

function Form({ initial }: { initial: Values }) {
  const { c } = useTheme();
  const update = useUpdateProfile();
  const { refreshProfile } = useSession();
  const [v, setV] = useState<Values>(initial);
  const [error, setError] = useState<string | null>(null);
  const phone = deviceTimezone();
  const moving = v.timezone.trim() !== initial.timezone;

  const save = async () => {
    setError(null);
    try {
      await update.mutateAsync({
        preferred_unit_system: v.units,
        timezone: v.timezone.trim(),
        week_starts_on: v.weekStart,
      });
      await refreshProfile();
      router.back();
    } catch (e) {
      setError(e instanceof ApiError
        ? (Object.values(e.fields)[0] ?? e.message)
        : "That didn't save. Check your connection and try again.");
    }
  };

  return (
    <View style={{ gap: space.xl }}>
      <Labelled label="Units">
        <Options
          testID="units"
          value={v.units}
          onChange={(units) => setV({ ...v, units })}
          options={[
            { value: 'metric', title: 'Metric', detail: 'kg · cm' },
            { value: 'imperial', title: 'Imperial', detail: 'lb · ft and in' },
          ]}
        />
      </Labelled>
      <Text variant="caption" tone="ink3">
        Only how numbers are shown changes. Everything is stored in kilograms and centimetres,
        so switching back and forth never rounds your history.
      </Text>

      <View style={{ gap: space.sm }}>
        <Text variant="label">Time zone</Text>
        <TextInput
          testID="tz-input"
          accessibilityLabel="Time zone"
          value={v.timezone}
          onChangeText={(timezone) => setV({ ...v, timezone })}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            minHeight: 48, paddingHorizontal: space.md, borderRadius: radius.btn,
            borderWidth: 1, borderColor: c.line2, color: c.ink, backgroundColor: c.sunken,
          }}
        />
        {phone !== v.timezone ? (
          <Button
            title={`Use this phone's time zone (${phone})`}
            kind="ghost"
            size="sm"
            testID="tz-use-phone"
            onPress={() => setV({ ...v, timezone: phone })}
          />
        ) : null}
        {moving ? (
          <Text variant="caption" tone="warn" testID="tz-warning">
            Your past workouts and meals will be re-filed onto the days they fall on in {v.timezone.trim() || 'the new zone'}.
          </Text>
        ) : (
          <Text variant="caption" tone="ink3">It decides when your day starts and ends for calories and workouts.</Text>
        )}
      </View>

      <Labelled label="Week starts on">
        <Chips
          testID="week-start"
          value={v.weekStart}
          onChange={(weekStart) => setV({ ...v, weekStart })}
          options={[
            { value: 1, label: 'Monday' },
            { value: 0, label: 'Sunday' },
            { value: 6, label: 'Saturday' },
          ]}
        />
      </Labelled>

      {error ? <Text variant="caption" tone="crit" testID="units-error">{error}</Text> : null}
      <Button title="Save" loading={update.isPending} testID="units-save" onPress={() => { void save(); }} />
    </View>
  );
}
