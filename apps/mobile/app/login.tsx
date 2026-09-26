/** A-04 Log In */
import { router, useLocalSearchParams } from 'expo-router';
import { resetTo } from '@/lib/navigation';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import { Pressable } from '@/ui/Pressable';
import { ScreenSafeArea } from '@/ui/ScreenSafeArea';
import { Button, Field, Text } from '@/ui';
import { useTheme, space, radius, font, target } from '@/theme';
import { useSession } from '@/lib/session';
import { ApiError } from '@/lib/api';
import { Notice } from '@/features/auth/Notice';

export default function Login() {
  const { c } = useTheme();
  const { signIn } = useSession();
  // A-05 lands here after a reset: every session ended, so say why this one did.
  const { notice } = useLocalSearchParams<{ notice?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);


  async function submit() {
    setBusy(true); setErrors({}); setGeneral(null);
    try {
      await signIn(email.trim(), password);
      resetTo('/');
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(e.fields);
        // Only show a banner when the server did not attribute it to a field.
        if (Object.keys(e.fields).length === 0) setGeneral(e.message);
      } else setGeneral('Could not reach the server. Check your connection.');
    } finally { setBusy(false); }
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

          <Text variant="h1" style={{ marginTop: space.sm, marginBottom: space.lg }}>Welcome back</Text>

          {notice === 'password-updated' ? (
            <View style={{ marginBottom: space.base }}>
              <Notice tone="good" testID="login-notice">Password updated. Log in with your new password.</Notice>
            </View>
          ) : null}

          {general ? (
            <View style={{ borderWidth: 1, borderColor: c.crit, borderRadius: radius.card, padding: 12, marginBottom: space.base }}>
              <Text variant="caption" tone="crit">{general}</Text>
            </View>
          ) : null}

          <Field label="Email" error={errors.email}>
            <TextInput
              value={email} onChangeText={setEmail}
              placeholder="you@example.com" placeholderTextColor={c.ink3}
              accessibilityLabel="Email" testID="login-email"
              autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
              textContentType="emailAddress" autoComplete="email"
              style={[input, { borderColor: errors.email ? c.crit : c.line }]}
            />
          </Field>

          <Field label="Password" error={errors.password} >
            <TextInput
              value={password} onChangeText={setPassword}
              placeholder="••••••••••" placeholderTextColor={c.ink3}
              accessibilityLabel="Password"
              secureTextEntry autoCapitalize="none" textContentType="password" autoComplete="password"
              // The keyboard's Go logs in: no reaching past the keyboard for the button.
              returnKeyType="go" onSubmitEditing={() => { if (!busy) void submit(); }}
              testID="login-password"
              style={[input, { borderColor: errors.password ? c.crit : c.line }]}
            />
          </Field>

          {/* A-04 → A-05, carrying the typed email so nobody types it twice. */}
          <Pressable
            onPress={() => router.push({
              pathname: '/forgot-password', params: email.trim() ? { email: email.trim() } : {},
            })}
            accessibilityRole="link" accessibilityLabel="Forgot password?" testID="login-forgot"
            style={{ alignSelf: 'flex-end', minHeight: target.min, justifyContent: 'center' }}
          >
            <Text variant="caption" tone="ink2">Forgot password?</Text>
          </Pressable>

          <Button title="Log in" onPress={submit} loading={busy} style={{ marginTop: space.md }} />

          <Pressable onPress={() => router.replace('/register')} style={{ marginTop: space.lg }}>
            <Text variant="caption" tone="ink3" style={{ textAlign: 'center' }}>
              New here? <Text variant="caption" tone="ink2">Create an account</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenSafeArea>
  );
}
