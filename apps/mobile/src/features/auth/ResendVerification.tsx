/**
 * A-06 "Resend link" — on K-01's row, K-02's email card and A-06 itself.
 *
 * Counts down from a send rather than failing on the server's minute, and says
 * what happened in words: sent (and where), too soon (and how long), already
 * verified, or could not send. The hook is separate so K-01 can lay the button
 * and its outcome out in one compact row.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/ui';
import { accountApi } from '@/lib/api-account';
import { useSession } from '@/lib/session';
import { space } from '@/theme';
import { formErrors } from './formErrors';
import { Notice } from './Notice';
import { formatCountdown, useCooldown } from './useCooldown';

export type ResendOutcome = { tone: 'good' | 'crit'; text: string } | null;

export function useResendVerification() {
  const { email, refreshAccount } = useSession();
  const cooldown = useCooldown();
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<ResendOutcome>(null);

  const resend = async () => {
    setBusy(true);
    setOutcome(null);
    try {
      const res = await accountApi.resendVerification();
      if (res.email_verified) {
        setOutcome({ tone: 'good', text: 'Your email is already confirmed.' });
        await refreshAccount();
      } else {
        cooldown.start();
        setOutcome({ tone: 'good', text: `Sent. Check ${email ?? 'your inbox'} for the link.` });
      }
    } catch (e) {
      // A 429 carries the server's own wait in its sentence.
      setOutcome({ tone: 'crit', text: formErrors(e).general ?? 'That did not send. Try again.' });
    } finally {
      setBusy(false);
    }
  };

  const waiting = cooldown.remaining > 0;
  return {
    resend,
    busy,
    waiting,
    outcome,
    title: waiting ? `Resend in ${formatCountdown(cooldown.remaining)}` : 'Resend link',
  };
}

export function ResendButton({ state, size = 'sm' }: {
  state: ReturnType<typeof useResendVerification>;
  size?: 'sm' | 'md';
}) {
  return (
    <Button
      title={state.title} kind="ghost" size={size} loading={state.busy} disabled={state.waiting}
      testID="resend-verification" onPress={() => { void state.resend(); }}
    />
  );
}

export function ResendVerification({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const state = useResendVerification();
  return (
    <View style={{ gap: space.sm }}>
      <ResendButton state={state} size={size} />
      {state.outcome ? (
        <Notice tone={state.outcome.tone} testID="resend-outcome">{state.outcome.text}</Notice>
      ) : null}
    </View>
  );
}
