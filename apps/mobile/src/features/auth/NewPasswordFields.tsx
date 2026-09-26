/**
 * "Choose a password" and "type it again" — A-05's reset and K-02's change.
 *
 * The same rule and the same meter as sign-up (A-03), and the server's field
 * names (`new_password`), so a refusal from either side lands under the field
 * it is about.
 */
import React from 'react';
import { Field } from '@/ui';
import { TextInput } from '@/ui/TextInput';
import { useTheme } from '@/theme';
import { MIN_PASSWORD_LENGTH } from './password';
import { PasswordStrength } from './PasswordStrength';
import { useInputStyle } from './inputStyle';

export function NewPasswordFields({
  password, confirm, onPassword, onConfirm, errors, testIDPrefix,
}: {
  password: string;
  confirm: string;
  onPassword: (v: string) => void;
  onConfirm: (v: string) => void;
  errors: Record<string, string>;
  testIDPrefix: string;
}) {
  const { c } = useTheme();
  const input = useInputStyle();
  return (
    <>
      <Field label="New password" error={errors.new_password}
        helper={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
        <TextInput
          value={password} onChangeText={onPassword}
          placeholder="••••••••••" placeholderTextColor={c.ink3}
          accessibilityLabel="New password" accessibilityHint={errors.new_password}
          testID={`${testIDPrefix}-new`}
          secureTextEntry autoCapitalize="none" autoCorrect={false}
          textContentType="newPassword" autoComplete="password-new"
          style={input(errors.new_password)}
        />
        <PasswordStrength password={password} />
      </Field>
      <Field label="Type it again" error={errors.confirm}>
        <TextInput
          value={confirm} onChangeText={onConfirm}
          placeholder="••••••••••" placeholderTextColor={c.ink3}
          accessibilityLabel="Confirm new password" accessibilityHint={errors.confirm}
          testID={`${testIDPrefix}-confirm`}
          secureTextEntry autoCapitalize="none" autoCorrect={false}
          textContentType="newPassword" autoComplete="password-new"
          style={input(errors.confirm)}
        />
      </Field>
    </>
  );
}
