/** A-03 Sign Up */
import { router } from 'expo-router';
import { resetTo } from '@/lib/navigation';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import { Pressable } from '@/ui/Pressable';
import { ScreenSafeArea } from '@/ui/ScreenSafeArea';
import { Button, Field, Text } from '@/ui';
import { useTheme, space, radius, font } from '@/theme';
import { useSession } from '@/lib/session';
import { MIN_PASSWORD_LENGTH } from '@/features/auth/password';
import { PasswordStrength } from '@/features/auth/PasswordStrength';
import { Notice } from '@/features/auth/Notice';
import { ProviderButtons } from '@/features/auth/ProviderButtons';
import { AuthProblem, resendConfirmation } from '@/features/auth/supabaseAuth';

export default function Register() {
  const { c } = useTheme();
  const { signUp } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  // S8: the account exists and its confirmation email is out.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function submit() {
    setBusy(true); setErrors({}); setGeneral(null);
    try {
      const { confirm } = await signUp(email.trim(), password);
      if (confirm) setSentTo(email.trim());
      else resetTo('/');
    } catch (e) {
      const problem = e instanceof AuthProblem ? e : new AuthProblem('Could not reach FitLog. Check your connection.');
      if (problem.field) setErrors({ [problem.field]: problem.message });
      else setGeneral(problem.message);
    } finally { setBusy(false); }
  }

  async function resend() {
    if (!sentTo) return;
    try { await resendConfirmation(sentTo); setResent(true); } catch (e) {
      setGeneral(e instanceof AuthProblem ? e.message : 'That did not work. Try again.');
    }
  }

  const input = {
    minHeight: 50, borderRadius: radius.btn, backgroundColor: c.sunken,
    borderWidth: 1, paddingHorizontal: 14, color: c.ink,
    fontFamily: font.ui, fontSize: 15.5,
  } as const;

  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: c.page }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: space.lg }} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back"
            style={{ width: 34, height: 34, justifyContent: 'center' }}>
            <Text variant="h2" tone="ink">‹</Text>
          </Pressable>

          <Text variant="h1" style={{ marginTop: space.sm, marginBottom: space.lg }}>
            {sentTo ? 'Check your email' : 'Create your account'}
          </Text>

          {sentTo ? (
            <View style={{ gap: space.base }} testID="register-check-email">
              <Notice tone="good">
                {`We sent a link to ${sentTo}. Open it on this phone to confirm your address — then you're in.`}
              </Notice>
              <Text variant="caption" tone="ink3">It can take a minute to arrive; check your spam folder too.</Text>
              <Button title={resent ? 'Sent again' : 'Send the link again'} kind="ghost"
                disabled={resent} onPress={() => void resend()} testID="register-resend" />
              <Button title="Back to log in" kind="ghost" onPress={() => router.replace('/login')} />
            </View>
          ) : (<>
          <ProviderButtons onProblem={setGeneral} />

          {general ? (
            <View style={{ borderWidth: 1, borderColor: c.crit, borderRadius: radius.card, padding: 12, marginBottom: space.base }}>
              <Text variant="caption" tone="crit">{general}</Text>
            </View>
          ) : null}

          <Field label="Email" error={errors.email}>
            <TextInput
              value={email} onChangeText={setEmail}
              placeholder="you@example.com" placeholderTextColor={c.ink3}
              accessibilityLabel="Email" testID="register-email"
              autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
              textContentType="emailAddress" autoComplete="email"
              style={[input, { borderColor: errors.email ? c.crit : c.line }]}
            />
          </Field>

          <Field label="Password" error={errors.password} helper={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
            <TextInput
              value={password} onChangeText={setPassword}
              placeholder="••••••••••" placeholderTextColor={c.ink3}
              accessibilityLabel="Password" testID="register-password"
              secureTextEntry autoCapitalize="none" textContentType="newPassword" autoComplete="password-new"
              style={[input, { borderColor: errors.password ? c.crit : c.line }]}
            />
            {/* Shared with A-05 and K-02, so the three screens state one rule. */}
            <PasswordStrength password={password} />
          </Field>

          <Button title="Create account" onPress={submit} loading={busy} style={{ marginTop: space.md }} />

          <Pressable onPress={() => router.replace('/login')} style={{ marginTop: space.lg }}>
            <Text variant="caption" tone="ink3" style={{ textAlign: 'center' }}>
              Already have an account? <Text variant="caption" tone="ink2">Log in</Text>
            </Text>
          </Pressable>
          </>)}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenSafeArea>
  );
}
