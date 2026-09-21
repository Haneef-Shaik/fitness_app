/** A-03 Sign Up */
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, Text } from '@/ui';
import { useTheme, space, radius, font } from '@/theme';
import { useSession } from '@/lib/session';
import { ApiError } from '@/lib/api';

export default function Register() {
  const { c } = useTheme();
  const { signUp } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);

  const strength = Math.min(4, Math.floor(password.length / 3));

  async function submit() {
    setBusy(true); setErrors({}); setGeneral(null);
    try {
      await signUp(email.trim(), password);
      router.replace('/');
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
    <SafeAreaView style={{ flex: 1, backgroundColor: c.page }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: space.lg }} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back"
            style={{ width: 34, height: 34, justifyContent: 'center' }}>
            <Text variant="h2" tone="ink">‹</Text>
          </Pressable>

          <Text variant="h1" style={{ marginTop: space.sm, marginBottom: space.lg }}>Create your account</Text>

          {general ? (
            <View style={{ borderWidth: 1, borderColor: c.crit, borderRadius: radius.card, padding: 12, marginBottom: space.base }}>
              <Text variant="caption" tone="crit">{general}</Text>
            </View>
          ) : null}

          <Field label="Email" error={errors.email}>
            <TextInput
              value={email} onChangeText={setEmail}
              placeholder="you@example.com" placeholderTextColor={c.ink3}
              autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
              textContentType="emailAddress" autoComplete="email"
              style={[input, { borderColor: errors.email ? c.crit : c.line }]}
            />
          </Field>

          <Field label="Password" error={errors.password} helper="At least 10 characters.">
            <TextInput
              value={password} onChangeText={setPassword}
              placeholder="••••••••••" placeholderTextColor={c.ink3}
              secureTextEntry autoCapitalize="none" textContentType="newPassword" autoComplete="password-new"
              style={[input, { borderColor: errors.password ? c.crit : c.line }]}
            />
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={{ flex: 1, height: 4, borderRadius: 2,
                  backgroundColor: i < strength ? c.good : c.line2 }} />
              ))}
            </View>
          </Field>

          <Button title="Create account" onPress={submit} loading={busy} style={{ marginTop: space.md }} />

          <Pressable onPress={() => router.replace('/login')} style={{ marginTop: space.lg }}>
            <Text variant="caption" tone="ink3" style={{ textAlign: 'center' }}>
              Already have an account? <Text variant="caption" tone="ink2">Log in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
