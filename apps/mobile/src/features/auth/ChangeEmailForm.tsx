/**
 * K-02 · Change email (Supabase Auth, docs/14).
 *
 * The password again, then confirmation links. Nothing changes until they are
 * opened — a typo here must not move the account, and every future reset link
 * with it, to an inbox nobody reads.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Field } from '@/ui';
import { TextInput } from '@/ui/TextInput';
import { changeEmail } from './supabaseAuth';
import { useSession } from '@/lib/session';
import { space, useTheme } from '@/theme';
import { formErrors } from './formErrors';
import { useInputStyle } from './inputStyle';
import { Notice } from './Notice';

export function ChangeEmailForm({ onDone, onCancel }: {
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const { c } = useTheme();
  const input = useInputStyle();
  const { email: current, refreshAccount } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);

  async function send() {
    setGeneral(null);
    const problems = {
      ...(email.trim() ? {} : { new_email: 'Enter the new email address.' }),
      ...(password ? {} : { password: 'Enter your password.' }),
    };
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setBusy(true);
    try {
      await changeEmail(current ?? '', password, email.trim());
      // So K-02 shows "Waiting for you to confirm…" from Supabase's own record.
      await refreshAccount().catch(() => {});
      onDone(`We sent confirmation links to ${email.trim()} and to your current address. `
        + 'Your email changes once you open them.');
    } catch (e) {
      const f = formErrors(e);
      // Supabase names the address field "email"; here it is the NEW one.
      const { email: onEmail, ...rest } = f.fields;
      setErrors(onEmail ? { ...rest, new_email: onEmail } : rest);
      setGeneral(f.general);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ marginTop: space.md }} testID="change-email-form">
      {general ? <View style={{ marginBottom: space.md }}><Notice tone="crit">{general}</Notice></View> : null}
      <Field label="New email" error={errors.new_email}>
        <TextInput
          value={email} onChangeText={setEmail}
          placeholder="you@example.com" placeholderTextColor={c.ink3}
          accessibilityLabel="New email" accessibilityHint={errors.new_email}
          testID="email-new"
          autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
          textContentType="emailAddress" autoComplete="email"
          style={input(errors.new_email)}
        />
      </Field>
      <Field label="Your password" error={errors.password}>
        <TextInput
          value={password} onChangeText={setPassword}
          placeholder="••••••••••" placeholderTextColor={c.ink3}
          accessibilityLabel="Your password" accessibilityHint={errors.password}
          testID="email-password"
          secureTextEntry autoCapitalize="none" autoCorrect={false}
          textContentType="password" autoComplete="password"
          style={input(errors.password)}
        />
      </Field>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button title="Cancel" kind="ghost" style={{ flex: 1 }} onPress={onCancel} />
        <Button title="Send confirmation link" style={{ flex: 1 }} loading={busy}
          testID="email-send" onPress={() => { void send(); }} />
      </View>
    </View>
  );
}
