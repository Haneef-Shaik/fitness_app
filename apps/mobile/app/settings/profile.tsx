/**
 * K-01 · Your details (G10, from the owner's review).
 *
 * Onboarding asks for birth date, sex, height, activity and how someone
 * trains, and nothing let them change any of it afterwards — Profile showed
 * the email only. This edits the same answers with onboarding's own pieces,
 * so the two can never disagree about what a field means. Weight is left out:
 * it is a check-in, with its own history, not a setting.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { ApiError, profileApi } from '@/lib/api';
import { useSession } from '@/lib/session';
import { answersFrom, profilePatch, type Answers } from '@/features/onboarding/answers';
import { AboutYouStep, ActivityStep, TrainingStep, UnitsStep } from '@/features/onboarding/stepsAboutYou';
import { Chips, Labelled } from '@/features/onboarding/ui';
import { space } from '@/theme';

function deviceTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.base }}>
      <Text variant="label">{title}</Text>
      {children}
    </View>
  );
}

export default function ProfileDetails() {
  const { profile, refreshProfile } = useSession();
  const [a, setA] = useState<Answers>(() => answersFrom(profile, deviceTimezone()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Answers>) => setA((prev) => ({ ...prev, ...patch }));
  // Today only matters for the birth-date check; the device's date is close enough here.
  const props = { a, set, today: new Date().toISOString().slice(0, 10) };

  const save = async () => {
    setError(null);
    setBusy(true);
    try {
      await profileApi.patch(profilePatch(a) as never);
      await refreshProfile();
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "That didn't save. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenScaffold title="Your details" subtitle="Used for your targets and program picks">
      <View style={{ gap: space.xl }}>
        <Section title="About you"><AboutYouStep {...props} showWeight={false} /></Section>
        <Section title="Units"><UnitsStep {...props} /></Section>
        <Section title="Day to day"><ActivityStep {...props} /></Section>
        <Section title="Training"><TrainingStep {...props} /></Section>
        <Labelled label="Remind me to check in">
          <Chips testID="checkin" value={a.checkinDays} onChange={(checkinDays) => set({ checkinDays })}
            options={[{ value: 7, label: 'Weekly' }, { value: 14, label: 'Every 2 weeks' }, { value: 30, label: 'Monthly' }]} />
        </Labelled>
        <Text variant="caption" tone="ink3">
          Changing these does not change your calorie targets — adjust those in Nutrition → Targets.
        </Text>
        {error ? <Text variant="caption" tone="crit" testID="profile-error">{error}</Text> : null}
        <Button title="Save" loading={busy} testID="profile-save" onPress={() => { void save(); }} />
      </View>
    </ScreenScaffold>
  );
}
