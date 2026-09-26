/**
 * A-05 · Reset password — the half that opens from the email.
 *
 * `fitlog://reset-password?token=…` lands here with the token. A phone that
 * will not open the link (a webmail that strips custom schemes, mail read on a
 * laptop) comes here from "I have a code" instead, and the same string is
 * pasted — so the code field shows only when there was no link.
 *
 * The new password follows sign-up's rule and meter (A-03). A completed reset
 * has ended every session on the server, this device's included, so the app
 * signs out locally too — an unfinished workout stays on the device (K-01) —
 * and lands on log in with a note saying why (A-05 → A-04).
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Field, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { TextInput } from '@/ui/TextInput';
import { isExpiredLink, recoveryApi } from '@/lib/api-account';
import { resetTo } from '@/lib/navigation';
import { useSession } from '@/lib/session';
import { formErrors } from '@/features/auth/formErrors';
import { useInputStyle } from '@/features/auth/inputStyle';
import { NewPasswordFields } from '@/features/auth/NewPasswordFields';
import { Notice } from '@/features/auth/Notice';
import { newPasswordProblems } from '@/features/auth/password';
import { space, useTheme } from '@/theme';

export default function ResetPassword() {
  const { c } = useTheme();
  const input = useInputStyle();
  const { status, signOut } = useSession();
  const { token: linked } = useLocalSearchParams<{ token?: string }>();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  async function submit() {
    const token = (linked ?? code).trim();
    setGeneral(null);
    setExpired(false);
    const problems = {
      ...(token ? {} : { token: 'Paste the code from the email.' }),
      ...newPasswordProblems(password, confirm),
    };
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setBusy(true);
    try {
      await recoveryApi.resetPassword(token, password);
      // Every session ended on the server; this device's local one follows.
      if (status !== 'signed-out') await signOut();
      resetTo({ pathname: '/login', params: { notice: 'password-updated' } });
    } catch (e) {
      if (isExpiredLink(e)) setExpired(true);
      const f = formErrors(e);
      setErrors(f.fields);
      setGeneral(f.general);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenScaffold title="Choose a new password">
      <View style={{ gap: space.base }}>
        <Text variant="body" tone="ink2">
          This signs you out everywhere, including this phone. Log in again with the new password.
        </Text>

        {general ? <Notice tone="crit" testID="reset-error">{general}</Notice> : null}
        {expired ? (
          <Button title="Request a new link" kind="ghost"
            onPress={() => router.replace('/forgot-password')} testID="reset-request-new" />
        ) : null}

        {linked ? null : (
          <Field label="Code from the email" error={errors.token}>
            <TextInput
              value={code} onChangeText={setCode}
              placeholder="Paste the code" placeholderTextColor={c.ink3}
              accessibilityLabel="Code from the email" accessibilityHint={errors.token}
              testID="reset-code"
              autoCapitalize="none" autoCorrect={false} textContentType="oneTimeCode"
              style={input(errors.token)}
            />
          </Field>
        )}

        <NewPasswordFields
          password={password} confirm={confirm}
          onPassword={setPassword} onConfirm={setConfirm}
          errors={errors} testIDPrefix="reset"
        />

        <Button title="Update password" onPress={() => { void submit(); }} loading={busy}
          testID="reset-submit" />
      </View>
    </ScreenScaffold>
  );
}
