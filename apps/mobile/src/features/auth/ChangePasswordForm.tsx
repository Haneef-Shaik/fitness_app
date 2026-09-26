/**
 * K-02 · Change password (Supabase Auth, docs/14).
 *
 * Asks for the current password — a stolen, unlocked phone should not be
 * enough — and applies sign-up's rule to the new one. Every other device is
 * signed out; this one stays signed in.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Field } from '@/ui';
import { TextInput } from '@/ui/TextInput';
import { AuthProblem, changePassword } from './supabaseAuth';
import { useSession } from '@/lib/session';
import { space, useTheme } from '@/theme';
import { formErrors } from './formErrors';
import { useInputStyle } from './inputStyle';
import { NewPasswordFields } from './NewPasswordFields';
import { Notice } from './Notice';
import { newPasswordProblems } from './password';

export function ChangePasswordForm({ onDone, onCancel }: {
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const { c } = useTheme();
  const input = useInputStyle();
  const { email } = useSession();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);

  async function save() {
    setGeneral(null);
    const problems = {
      ...(current ? {} : { current_password: 'Enter your current password.' }),
      ...newPasswordProblems(password, confirm),
    };
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setBusy(true);
    try {
      const othersOut = await changePassword(email ?? '', current, password);
      onDone(othersOut
        ? 'Password changed. Every other device was signed out; this one is still signed in.'
        : 'Password changed, but other devices could not be signed out just now. Use "Sign out other devices" below.');
    } catch (e) {
      if (e instanceof AuthProblem && e.code === 'invalid_credentials') {
        setErrors({ current_password: e.message });
      } else {
        const f = formErrors(e);
        // Supabase names the field `password`; here it is the NEW one.
        const { password: problem, ...rest } = f.fields;
        setErrors(problem ? { ...rest, new_password: problem } : rest);
        setGeneral(f.general);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ marginTop: space.md }} testID="change-password-form">
      {general ? <View style={{ marginBottom: space.md }}><Notice tone="crit">{general}</Notice></View> : null}
      <Field label="Current password" error={errors.current_password}>
        <TextInput
          value={current} onChangeText={setCurrent}
          placeholder="••••••••••" placeholderTextColor={c.ink3}
          accessibilityLabel="Current password" accessibilityHint={errors.current_password}
          testID="password-current"
          secureTextEntry autoCapitalize="none" autoCorrect={false}
          textContentType="password" autoComplete="password"
          style={input(errors.current_password)}
        />
      </Field>
      <NewPasswordFields
        password={password} confirm={confirm}
        onPassword={setPassword} onConfirm={setConfirm}
        errors={errors} testIDPrefix="password"
      />
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button title="Cancel" kind="ghost" style={{ flex: 1 }} onPress={onCancel} />
        <Button title="Save new password" style={{ flex: 1 }} loading={busy}
          testID="password-save" onPress={() => { void save(); }} />
      </View>
    </View>
  );
}
