/** A-07 Onboarding — step 2 (units & timezone) cannot be skipped: every later number depends on it. */
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Field, Text, Well } from '@/ui';
import { useTheme, space, radius, font } from '@/theme';
import { useSession } from '@/lib/session';
import { profileApi } from '@/lib/api';

const ZONES = ['Asia/Kolkata', 'Europe/London', 'America/New_York', 'Australia/Sydney', 'UTC'];
const ACTIVITY = [
  ['sedentary', 'Desk job, little exercise'],
  ['light', 'Light exercise 1–3 days'],
  ['moderate', 'Moderate 3–5 days'],
  ['very', 'Hard exercise 6–7 days'],
] as const;

export default function Onboarding() {
  const { c } = useTheme();
  const { refreshProfile, profile } = useSession();
  const [step, setStep] = useState(0);
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [tz, setTz] = useState(profile?.timezone === 'UTC' ? 'Asia/Kolkata' : profile?.timezone ?? 'Asia/Kolkata');
  const [activity, setActivity] = useState('moderate');
  const [busy, setBusy] = useState(false);

  // Mifflin–St Jeor with the documented activity multipliers, minus 10% for fat loss.
  const multiplier = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, extra: 1.9 }[activity] ?? 1.55;
  const bmr = 1680;
  const target = Math.round((bmr * multiplier * 0.9) / 10) * 10;
  const protein = Math.round((target * 0.3) / 4);
  const carbs = Math.round((target * 0.4) / 4);
  const fat = Math.round((target * 0.3) / 9);

  async function finish() {
    setBusy(true);
    try {
      await profileApi.patch({
        preferred_unit_system: units, timezone: tz, activity_level: activity,
        daily_calorie_target: target, protein_g_target: protein,
        carbs_g_target: carbs, fat_g_target: fat, onboarding_completed: true,
      } as never);
      await refreshProfile();
      router.replace('/home');
    } finally { setBusy(false); }
  }

  const Dots = () => (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[0, 1, 2].map(i => (
        <View key={i} style={{
          width: i === step ? 18 : 6, height: 6, borderRadius: 3,
          backgroundColor: i <= step ? c.accent : c.line2,
        }} />
      ))}
    </View>
  );

  const Option = ({ on, title, sub, onPress }: { on: boolean; title: string; sub?: string; onPress: () => void }) => (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: on }}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 10,
        borderRadius: radius.card, borderWidth: 1,
        borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accentWash : c.surface,
      }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
        borderColor: on ? c.accent : c.line2, alignItems: 'center', justifyContent: 'center' }}>
        {on ? <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: c.accent }} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="body" style={{ fontFamily: font.uiSemi }}>{title}</Text>
        {sub ? <Text variant="caption" tone="ink3">{sub}</Text> : null}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.page }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => (step === 0 ? null : setStep(step - 1))} style={{ width: 34 }}>
          <Text variant="h2" tone={step === 0 ? 'ink3' : 'ink'}>‹</Text>
        </Pressable>
        <Dots />
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg }}>
        {step === 0 && (
          <>
            <Text variant="display" style={{ fontSize: 30 }}>How should we{'\n'}show your numbers?</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: space.lg }}>
              {(['metric', 'imperial'] as const).map(u => (
                <Pressable key={u} onPress={() => setUnits(u)} style={{ flex: 1 }}>
                  <Card style={{ borderColor: units === u ? c.accent : c.line }}>
                    <Text variant="body" style={{ fontFamily: font.uiSemi, textTransform: 'capitalize' }}>{u}</Text>
                    <Text variant="caption" tone="ink3">{u === 'metric' ? 'kg · cm · g' : 'lb · in · oz'}</Text>
                  </Card>
                </Pressable>
              ))}
            </View>

            <Text variant="label" style={{ marginTop: space.xl, marginBottom: 4 }}>Time zone</Text>
            {ZONES.map(z => <Option key={z} on={tz === z} title={z} onPress={() => setTz(z)} />)}
            <Well style={{ marginTop: space.base }}>
              <Text variant="caption" tone="ink3">
                This sets when your day starts and ends for calories and workouts.
                It cannot be skipped — every later number depends on it.
              </Text>
            </Well>
          </>
        )}

        {step === 1 && (
          <>
            <Text variant="display" style={{ fontSize: 30 }}>How active{'\n'}are you?</Text>
            {ACTIVITY.map(([k, label]) => (
              <Option key={k} on={activity === k} title={k[0].toUpperCase() + k.slice(1)} sub={label}
                onPress={() => setActivity(k)} />
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <Text variant="display" style={{ fontSize: 30 }}>Your starting{'\n'}targets</Text>
            <Card hero style={{ marginTop: space.lg, borderStyle: 'dashed', borderColor: c.line2 }}>
              <Text variant="label" tone="accent">✦ Estimated from your profile</Text>
              <View style={{ alignItems: 'center', marginTop: 12 }}>
                <Text variant="hero" style={{ fontSize: 54 }}>{target.toLocaleString()}</Text>
                <Text variant="caption" tone="ink3">kcal per day</Text>
              </View>
              <View style={{ marginTop: space.lg, gap: 8 }}>
                {[['Protein', protein, c.s1], ['Carbs', carbs, c.s2], ['Fat', fat, c.s3]].map(([n, v, col]) => (
                  <View key={n as string} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text variant="caption" tone="ink3" style={{ width: 54 }}>{n as string}</Text>
                    <View style={{ flex: 1, height: 7, borderRadius: 4, backgroundColor: c.sunken, overflow: 'hidden' }}>
                      <View style={{ width: '70%', height: '100%', backgroundColor: col as string }} />
                    </View>
                    <Text variant="caption" tone="ink2" style={{ fontFamily: font.dataSemi, fontSize: 14 }}>{v as number} g</Text>
                  </View>
                ))}
              </View>
            </Card>
            <Well style={{ marginTop: space.base }}>
              <Text variant="caption" tone="ink3">
                Mifflin–St Jeor, activity ×{multiplier}, then −10% for fat loss.
                An estimate, not medical advice. Change it any time in Settings.
              </Text>
            </Well>
          </>
        )}
      </ScrollView>

      <View style={{ padding: space.lg, paddingTop: 0 }}>
        <Button
          title={step === 2 ? 'Looks good' : 'Continue'}
          loading={busy}
          onPress={() => (step === 2 ? finish() : setStep(step + 1))}
        />
      </View>
    </SafeAreaView>
  );
}
