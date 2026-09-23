/**
 * I-06 · Which measurements to track.
 *
 * Stored per device rather than on the profile: which fields somebody wants on
 * their own screen is a preference, not a fact about them, and it does not need
 * a round trip or a migration. `localStorage`-shaped state, held where the rest
 * of the client holds it.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { METRIC_FIELDS } from '@/features/body/format';
import { loadTrackedFields, saveTrackedFields } from '@/features/body/trackedFields';
import { space } from '@/theme';

export default function MeasurementFields() {
  const [tracked, setTracked] = useState<readonly string[]>([]);

  useEffect(() => { void loadTrackedFields().then(setTracked); }, []);

  const toggle = (key: string) =>
    setTracked((rows) =>
      rows.includes(key) ? rows.filter((r) => r !== key) : [...rows, key]);

  return (
    <ScreenScaffold title="What to track">
      <View style={{ gap: space.md }}>
        <Card>
          <Text variant="caption" tone="ink3">
            Anything you have already logged stays logged. This only decides what the
            progress screen offers you.
          </Text>
        </Card>

        {METRIC_FIELDS.map((field) => {
          const on = tracked.includes(field.key);
          return (
            <Button
              key={field.key}
              title={`${on ? '✓ ' : ''}${field.label} (${field.unit})`}
              kind={on ? 'primary' : 'ghost'}
              testID={`field-${field.key}`}
              onPress={() => toggle(field.key)}
            />
          );
        })}

        <Button
          title="Save"
          testID="fields-save"
          onPress={async () => {
            await saveTrackedFields(tracked);
            router.back();
          }}
        />
      </View>
    </ScreenScaffold>
  );
}
