/**
 * A-05 · Forgot password — the request half.
 *
 * **One confirmation, whatever happened.** The server answers the same whether
 * or not the address has an account; the screen must not undo that, so the
 * confirmation is worded as a condition ("If an account exists…") and shown for
 * every accepted request. What it may report is a problem with the REQUEST — an
 * address that is not one, no connection — which says nothing about accounts.
 *
 * The reset itself is its own route (`/reset-password`), where the emailed
 * link lands (through app/auth/callback.tsx); "I have a code" goes there for
 * an email read on another device, where the link cannot work (PKCE).
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Field, Text } from '@/ui';
import { Pressable } from '@/ui/Pressable';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { TextInput } from '@/ui/TextInput';
import { forgotPassword } from '@/features/auth/supabaseAuth';
import { formErrors } from '@/features/auth/formErrors';
import { useInputStyle } from '@/features/auth/inputStyle';
import { Notice } from '@/features/auth/Notice';
import { formatCountdown, useCooldown } from '@/features/auth/useCooldown';
import { space, target, useTheme } from '@/theme';

export default function ForgotPassword() {
  const { c } = useTheme();
  const input = useInputStyle();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const cooldown = useCooldown();

  async function send() {
    const address = email.trim();
    setErrors({});
    setGeneral(null);
    if (!address) {
      setErrors({ email: 'Enter your email address.' });
      return;
    }
    setBusy(true);
    try {
      await forgotPassword(address);
      setSentTo(address);
      cooldown.start();
    } catch (e) {
      const f = formErrors(e);
      setErrors(f.fields);
      setGeneral(f.general);
    } finally {
      setBusy(false);
    }
  }

  const waiting = cooldown.remaining > 0;
  return (
    <ScreenScaffold title="Reset your password">
      <View style={{ gap: space.base }}>
        <Text variant="body" tone="ink2">
          Enter the email you signed up with and we'll send a link to choose a new password.
        </Text>

        {general ? <Notice tone="crit" testID="forgot-error">{general}</Notice> : null}
        {sentTo ? (
          <Notice tone="good" testID="forgot-sent">
            If an account exists for {sentTo}, we've sent a reset link and a 6-digit code. They
            work once, for an hour. Not there? Check your spam folder.
          </Notice>
        ) : null}

        <Field label="Email" error={errors.email}>
          <TextInput
            value={email} onChangeText={setEmail}
            placeholder="you@example.com" placeholderTextColor={c.ink3}
            accessibilityLabel="Email" accessibilityHint={errors.email}
            testID="forgot-email"
            autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
            textContentType="emailAddress" autoComplete="email"
            returnKeyType="send" onSubmitEditing={() => { if (!busy && !waiting) void send(); }}
            style={input(errors.email)}
          />
        </Field>

        <Button
          title={sentTo
            ? (waiting ? `Resend in ${formatCountdown(cooldown.remaining)}` : 'Resend link')
            : 'Send reset link'}
          onPress={() => { void send(); }} loading={busy} disabled={waiting}
          testID="forgot-send"
        />

        <Pressable
          onPress={() => router.push({ pathname: '/reset-password', params: { email: email.trim() } })}
          accessibilityRole="link" accessibilityLabel="I have a code"
          style={{ minHeight: target.min, justifyContent: 'center', alignSelf: 'center' }}
        >
          <Text variant="caption" tone="ink2">I have a code</Text>
        </Pressable>
      </View>
    </ScreenScaffold>
  );
}
