/**
 * I-02 · Log a body measurement.
 *
 * **Queued, not posted.** This is the write least able to afford needing the
 * network: somebody weighs themselves in a bathroom, which is where the signal
 * is worst in any building. It goes through the same outbox a set does
 * (**H3.2**), and a replayed delivery is one weigh-in (**I8**).
 *
 * Units are offered because people think in pounds and inches; **what is stored
 * is canonical** (I6), and the server does the conversion so there is one
 * implementation of it.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import { Button, Card, Text } from '@/ui';
import { Choice } from '@/ui/Choice';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { METRIC_FIELDS, metricUnit } from '@/features/body/format';
import { useLogBodyMetric, useProfile } from '@/lib/query/hooks';
import { radius, space, useTheme } from '@/theme';

export default function LogMetric() {
  const { c } = useTheme();
  const profile = useProfile();
  const log = useLogBodyMetric();

  const [metricKey, setMetricKey] = useState<string>('body_weight');
  const [value, setValue] = useState('');
  const [imperial, setImperial] = useState(
    profile.data?.preferred_unit_system === 'imperial',
  );
  const [error, setError] = useState<string | null>(null);

  const canonical = metricUnit(metricKey);
  const unit = !imperial || canonical === '%'
    ? canonical
    : canonical === 'kg' ? 'lb' : 'in';

  const parsed = Number(value.replace(',', '.'));
  const valid = value.trim() !== '' && Number.isFinite(parsed) && parsed > 0;

  return (
    <ScreenScaffold title="Log a measurement">
      <View style={{ gap: space.lg }}>
        <View>
          <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>What</Text>
          <Choice
            testID="metric-key"
            value={metricKey}
            onChange={setMetricKey}
            options={METRIC_FIELDS.map((f) => ({ value: f.key, label: f.label }))}
          />
        </View>

        <View>
          <Text variant="label" accessibilityElementsHidden importantForAccessibility="no" style={{ marginBottom: space.sm }}>
            Value ({unit})
          </Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            accessibilityLabel={`Value in ${unit}`}
            testID="metric-value"
            placeholder={canonical === 'kg' ? '78.4' : '84.0'}
            placeholderTextColor={c.ink3}
            style={{
              minHeight: 46, borderRadius: radius.btn, borderWidth: 1,
              borderColor: c.line2, paddingHorizontal: space.md,
              color: c.ink, backgroundColor: c.sunken,
            }}
          />
        </View>

        {canonical !== '%' ? (
          <Choice
            testID="metric-units"
            scroll={false}
            value={imperial ? 'imperial' : 'metric'}
            onChange={(next) => setImperial(next === 'imperial')}
            options={[
              { value: 'metric', label: canonical === 'kg' ? 'kg' : 'cm' },
              { value: 'imperial', label: canonical === 'kg' ? 'lb' : 'in' },
            ]}
          />
        ) : null}

        <Card>
          {/* Q5, said before it surprises anybody. */}
          <Text variant="caption" tone="ink3">
            The first weigh-in of a day is the one charts and goals use. Log a second
            and it is kept, but the morning figure is the one that counts — weight
            moves a kilogram across a day on water alone.
          </Text>
        </Card>

        {error ? (
          <Text variant="caption" tone="crit" testID="metric-error">{error}</Text>
        ) : null}

        <Button
          title={log.isPending ? 'Saving…' : 'Save'}
          disabled={!valid || log.isPending}
          testID="metric-save"
          onPress={async () => {
            setError(null);
            try {
              await log.mutateAsync({
                metric_key: metricKey,
                value: parsed,
                unit: unit as 'kg' | 'lb' | 'cm' | 'in' | '%',
                measured_at: null,
                notes: null,
                client_id: null,
              });
              router.back();
            } catch (e) {
              setError(
                e instanceof Error && e.message
                  ? e.message
                  : 'That did not save. Your number is still here.',
              );
            }
          }}
        />
      </View>
    </ScreenScaffold>
  );
}
