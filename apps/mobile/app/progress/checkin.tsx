/**
 * Check in — weight and measurements in one go (G10, the owner's review).
 *
 * I-02 logs one metric at a time; a check-in is the whole set, taken together
 * so it can be compared with the first one. Every value rides the outbox like
 * any weigh-in, so a check-in taken in a gym with no signal is not lost (I10).
 * Blank fields are skipped — a check-in can be just the scale.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useCheckins, useProfile } from '@/lib/query/hooks';
import { queueMetric } from '@/features/body/logMetric';
import {
  baselineMetrics, EMPTY_ANSWERS, MEASUREMENTS, type Answers, type MeasurementKey,
} from '@/features/onboarding/answers';
import { NumberField } from '@/features/onboarding/ui';
import { useQueryClient } from '@tanstack/react-query';
import { applyInvalidation } from '@/lib/query/invalidation';
import { kgToLb } from '@fitlog/domain';
import { space } from '@/theme';

const CM_PER_IN = 2.54;

export default function CheckIn() {
  const profile = useProfile();
  const checkins = useCheckins();
  const client = useQueryClient();
  const units = profile.data?.preferred_unit_system === 'imperial' ? 'imperial' : 'metric';
  const [weight, setWeight] = useState('');
  const [values, setValues] = useState<Partial<Record<MeasurementKey, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const last = checkins.data?.checkins[0]?.values ?? {};
  const answers: Answers = { ...EMPTY_ANSWERS, units, weight, measurements: values };
  const metrics = baselineMetrics(answers);

  const save = async () => {
    setError(null);
    setBusy(true);
    try {
      for (const m of metrics) {
        await queueMetric({ ...m, measured_at: null, notes: 'Check-in', client_id: null } as never);
      }
      // Not awaited: the check-in is safe in the outbox; the screens refresh when they can.
      void applyInvalidation(client, 'bodyMetric.changed', {});
      router.back();
    } catch {
      setError("That didn't save on this phone. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const mass = units === 'metric' ? 'kg' : 'lb';
  const length = units === 'metric' ? 'cm' : 'in';
  // Stored values are canonical (kg, cm); the hint is shown in the units the
  // field is typed in, so "last" and "now" can be compared at a glance.
  const hint = (key: string) => {
    const v = last[key];
    if (v == null) return undefined;
    if (key.endsWith('_pct')) return `Last: ${v}%`;
    if (units === 'metric') return `Last: ${v} ${key === 'body_weight' ? 'kg' : 'cm'}`;
    const shown = key === 'body_weight' ? kgToLb(v) : v / CM_PER_IN;
    return `Last: ${Math.round(shown * 10) / 10} ${key === 'body_weight' ? 'lb' : 'in'}`;
  };

  return (
    <ScreenScaffold title="Check in" subtitle="Weight plus any measurements">
      <View style={{ gap: space.base }}>
        <NumberField label="Weight" unit={mass} value={weight} onChange={setWeight}
          hint={hint('body_weight')} testID="checkin-weight" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.sm, rowGap: space.base }}>
          {MEASUREMENTS.map(({ key, label }) => (
            <View key={key} style={{ flexBasis: '40%', flexGrow: 1 }}>
              <NumberField
                label={label}
                unit={key === 'body_fat_pct' ? '%' : length}
                value={values[key] ?? ''}
                onChange={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
                hint={hint(key)}
                testID={`checkin-${key}`}
              />
            </View>
          ))}
        </View>
        <Text variant="caption" tone="ink3">
          Same time of day each check-in — ideally first thing in the morning — so they compare fairly.
        </Text>
        {error ? <Text variant="caption" tone="crit">{error}</Text> : null}
        <Button
          title={metrics.length ? `Save check-in (${metrics.length})` : 'Save check-in'}
          disabled={metrics.length === 0}
          loading={busy}
          testID="checkin-save"
          onPress={save}
        />
      </View>
    </ScreenScaffold>
  );
}
