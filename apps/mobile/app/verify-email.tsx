/**
 * A-06 · Verify email.
 *
 * Two ways in. `fitlog://verify-email?token=…` verifies on arrival — signed in
 * or not, because the link is often opened on a phone that is not signed in to
 * that account. Without a link (K-01's "I have a code"), it says where the link
 * went, takes the code pasted, and offers a resend.
 *
 * The same link finishes a K-02 email change, so the confirmation names the
 * address the SERVER says is now confirmed, not the one this device remembers.
 *
 * Never a gate (A-06): no "you must verify", only a way to do it and a way back.
 */
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Button, Field, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { TextInput } from '@/ui/TextInput';
import { isExpiredLink, recoveryApi } from '@/lib/api-account';
import { resetTo } from '@/lib/navigation';
import { useSession } from '@/lib/session';
import { formErrors } from '@/features/auth/formErrors';
import { useInputStyle } from '@/features/auth/inputStyle';
import { Notice } from '@/features/auth/Notice';
import { ResendVerification } from '@/features/auth/ResendVerification';
import { space, useTheme } from '@/theme';

type State =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'confirmed'; email: string }
  | { kind: 'failed'; message: string; expired: boolean };

export default function VerifyEmail() {
  const { c } = useTheme();
  const input = useInputStyle();
  const { status, email, refreshAccount } = useSession();
  const { token: linked } = useLocalSearchParams<{ token?: string }>();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | undefined>();
  const [state, setState] = useState<State>(linked ? { kind: 'checking' } : { kind: 'idle' });
  const signedIn = status === 'ready' || status === 'onboarding';

  async function verify(token: string) {
    setState({ kind: 'checking' });
    try {
      const res = await recoveryApi.verifyEmail(token);
      setState({ kind: 'confirmed', email: res.email });
      // K-01's banner (and K-02's pending address) must update without a relaunch.
      if (signedIn) await refreshAccount().catch(() => {});
    } catch (e) {
      setState({
        kind: 'failed',
        message: formErrors(e).general ?? 'That code did not work.',
        expired: isExpiredLink(e),
      });
    }
  }

  // The link verifies on arrival — once, even if the screen renders again.
  const tried = useRef(false);
  useEffect(() => {
    if (!linked || tried.current) return;
    tried.current = true;
    void verify(linked);
  }, [linked]);

  const submitCode = () => {
    const token = code.trim();
    if (!token) { setCodeError('Paste the code from the email.'); return; }
    setCodeError(undefined);
    void verify(token);
  };

  if (state.kind === 'confirmed') {
    return (
      <ScreenScaffold title="Email confirmed">
        <View style={{ gap: space.base }}>
          <Notice tone="good" testID="verify-confirmed">{`${state.email} is confirmed.`}</Notice>
          {signedIn
            ? <Button title="Continue" onPress={() => resetTo('/')} testID="verify-continue" />
            : <Button title="Log in" onPress={() => resetTo('/login')} testID="verify-login" />}
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title="Confirm your email">
      <View style={{ gap: space.base }}>
        {state.kind === 'checking' ? (
          <Notice tone="info" testID="verify-checking">Checking your link…</Notice>
        ) : null}
        {state.kind === 'failed' ? (
          <Notice tone="crit" testID="verify-error">{state.message}</Notice>
        ) : null}

        {state.kind === 'failed' && state.expired && !signedIn ? (
          <Button title="Log in to send a new link" kind="ghost"
            onPress={() => resetTo('/login')} testID="verify-login-to-resend" />
        ) : null}

        {!linked || state.kind === 'failed' ? (
          <>
            {email && signedIn ? (
              <Text variant="body" tone="ink2">
                We sent a link to {email}. Open it on this phone, or paste the code from the email.
              </Text>
            ) : (
              <Text variant="body" tone="ink2">Paste the code from the email.</Text>
            )}
            <Field label="Code from the email" error={codeError}>
              <TextInput
                value={code} onChangeText={setCode}
                placeholder="Paste the code" placeholderTextColor={c.ink3}
                accessibilityLabel="Code from the email" accessibilityHint={codeError}
                testID="verify-code"
                autoCapitalize="none" autoCorrect={false} textContentType="oneTimeCode"
                style={input(codeError)}
              />
            </Field>
            <Button title="Confirm email" onPress={submitCode} testID="verify-submit" />
            {signedIn ? <ResendVerification size="md" /> : null}
          </>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}
