/**
 * K-02 · Sign out other devices.
 *
 * Asks first and says what it will and will not do: every other sign-in ends,
 * this one stays, and a workout saved on another phone stays on that phone —
 * it uploads when that phone signs back in (K-02 edge cases). Then says how
 * many devices it actually signed out.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { accountApi } from '@/lib/api-account';
import { space } from '@/theme';
import { formErrors } from './formErrors';
import { Notice } from './Notice';

function outcome(revoked: number): string {
  if (revoked === 0) return 'No other devices were signed in.';
  return `Signed out of ${revoked} other ${revoked === 1 ? 'device' : 'devices'}.`;
}

export function SignOutOthers() {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: 'good' | 'crit'; text: string } | null>(null);

  async function confirm() {
    setBusy(true);
    try {
      const { revoked } = await accountApi.signOutOtherDevices();
      setResult({ tone: 'good', text: outcome(revoked) });
      setAsking(false);
    } catch (e) {
      setResult({ tone: 'crit', text: formErrors(e).general ?? 'That did not work. Try again.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <Text variant="body" tone="ink2">
        Signed in somewhere you don't recognise? End every sign-in except this phone.
      </Text>
      {result ? <View style={{ marginTop: space.md }}><Notice tone={result.tone}>{result.text}</Notice></View> : null}
      {asking ? (
        <View testID="signout-others-confirm" style={{ marginTop: space.md, gap: space.sm }}>
          <Text variant="title">Sign out every other device?</Text>
          <Text variant="body" tone="ink2">
            This phone stays signed in. Workouts saved on the others stay there and upload when
            they sign back in.
          </Text>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button title="Cancel" kind="ghost" style={{ flex: 1 }} onPress={() => setAsking(false)} />
            <Button title="Yes, sign them out" kind="danger" style={{ flex: 1 }} loading={busy}
              onPress={() => { void confirm(); }} />
          </View>
        </View>
      ) : (
        <Button title="Sign out other devices" kind="ghost" style={{ marginTop: space.md }}
          testID="signout-others" onPress={() => { setResult(null); setAsking(true); }} />
      )}
    </Card>
  );
}
