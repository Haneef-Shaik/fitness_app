/**
 * K-02 · Change email.
 *
 * The password again, then a link to the NEW address. Nothing changes until
 * that link is opened — a typo here must not move the account, and every
 * future reset link with it, to an inbox nobody reads. The old address is told
 * once the change lands.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Field } from '@/ui';
import { TextInput } from '@/ui/TextInput';
import { accountApi } from '@/lib/api-account';
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
  const { refreshAccount } = useSession();
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
      const { pending_email: pending } = await accountApi.changeEmail(email.trim(), password);
      // So K-02 shows "Waiting for you to confirm…" from the server's own record.
      await refreshAccount().catch(() => {});
      onDone(`We sent a link to ${pending}. Your email changes when you open it.`);
    } catch (e) {
      const f = formErrors(e);
      setErrors(f.fields);
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
