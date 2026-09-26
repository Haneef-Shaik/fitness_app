/**
 * K-09 · Integrations — Health Connect on Android, Apple Health on iOS.
 *
 * Each direction is its own switch, off until the person turns it on, and
 * turning one on is what shows the store's own permission screen — never at
 * launch, never in onboarding. A refusal leaves the switch off and says so.
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { Pressable } from '@/ui/Pressable';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { count } from '@/features/nutrition/format';
import { healthBridge } from '@/features/health/bridge';
import {
  DEFAULT_HEALTH_PREFS, importWeights, readHealthPrefs, writeHealthPrefs, type HealthPrefs,
} from '@/features/health/sync';
import { radius, space, useTheme } from '@/theme';

function Toggle({ label, detail, value, onChange, testID }: {
  label: string; detail: string; value: boolean; onChange: (v: boolean) => void; testID: string;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      accessibilityHint={detail}
      testID={testID}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="body">{label}</Text>
        <Text variant="caption" tone="ink3">{detail}</Text>
      </View>
      <View style={{
        width: 48, height: 28, borderRadius: radius.pill, padding: 3,
        backgroundColor: value ? c.accent : c.line2, alignItems: value ? 'flex-end' : 'flex-start',
      }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.surface }} />
      </View>
    </Pressable>
  );
}

export default function HealthIntegrations() {
  const bridge = healthBridge();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [prefs, setPrefs] = useState<HealthPrefs>(DEFAULT_HEALTH_PREFS);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void readHealthPrefs().then(setPrefs);
    if (!bridge) { setAvailable(false); return; }
    void bridge.isAvailable().then(setAvailable);
    // `bridge` is a module singleton; looking it up once is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const name = bridge?.name ?? 'your health app';

  const turn = async (key: 'importWeight' | 'saveWorkouts', on: boolean) => {
    setNote(null);
    if (on && bridge) {
      const access = await bridge.requestAccess();
      const granted = key === 'importWeight' ? access.weight : access.workouts;
      if (!granted) {
        setNote(`${name} didn't allow it. You can change that in ${name}'s settings and try again.`);
        return;
      }
    }
    setPrefs(await writeHealthPrefs({ [key]: on }));
  };

  const syncNow = async () => {
    if (!bridge) return;
    setBusy(true);
    setNote(null);
    try {
      const n = await importWeights(bridge);
      setPrefs(await readHealthPrefs());
      setNote(n === 0 ? 'No new weigh-ins.' : `${count(n, 'weigh-in')} added to your progress.`);
    } catch {
      setNote(`Couldn't read from ${name}. Check its permissions and try again.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenScaffold title="Health integrations" subtitle={bridge ? name : 'Not on this device'}>
      <View style={{ gap: space.lg }}>
        {available === false ? (
          <Card testID="health-unavailable">
            <Text variant="body">{name} isn't available on this phone.</Text>
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
              On Android 13 and earlier, install Health Connect from the Play Store, then come back.
            </Text>
          </Card>
        ) : null}

        <Toggle
          testID="health-weight"
          label={`Import weight from ${name}`}
          detail="Weigh-ins from a smart scale appear in Progress without typing them. Your trend uses the first of each day."
          value={prefs.importWeight}
          onChange={(v) => { void turn('importWeight', v); }}
        />
        <Toggle
          testID="health-workouts"
          label={`Save workouts to ${name}`}
          detail="Each finished workout is copied there as strength training, with its start and end."
          value={prefs.saveWorkouts}
          onChange={(v) => { void turn('saveWorkouts', v); }}
        />

        {prefs.importWeight ? (
          <View style={{ gap: space.sm }}>
            <Button title="Sync weight now" kind="ghost" loading={busy} testID="health-sync"
              onPress={() => { void syncNow(); }} />
            <Text variant="caption" tone="ink3" testID="health-last">
              {prefs.lastImportAt
                ? `Last synced ${new Date(prefs.lastImportAt).toLocaleString()}`
                : 'Not synced yet.'}
            </Text>
          </View>
        ) : null}

        {note ? <Text variant="caption" tone="ink2" testID="health-note">{note}</Text> : null}

        <Text variant="caption" tone="ink3">
          FitLog reads only your weight and writes only workouts. Nothing else in {name} is touched,
          and turning a switch off stops it at once.
        </Text>
      </View>
    </ScreenScaffold>
  );
}
