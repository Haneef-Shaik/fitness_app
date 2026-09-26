/**
 * A-05 · a new password, after a reset email.
 *
 * The email's link (Supabase Auth, docs/14) comes back through
 * app/auth/callback.tsx and signs this phone in; this screen then sets the new
 * password and signs every other device out, so whoever had the old one is
 * out. PKCE means the link only works on the phone that asked for it — so the
 * same email carries a six-digit code, and someone who opened it on a laptop
 * arrives here signed out ("I have a code") and types the code instead.
 *
 * **Only a reset may skip the old password.** Signed in any other way — a
 * `fitlog://reset-password` link opened on an unlocked phone, say — this
 * screen sends the person to Account and security, which asks for it (K-02).
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Field, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { TextInput } from '@/ui/TextInput';
import { resetTo } from '@/lib/navigation';
import { useSession } from '@/lib/session';
import { formErrors } from '@/features/auth/formErrors';
import { useInputStyle } from '@/features/auth/inputStyle';
import { NewPasswordFields } from '@/features/auth/NewPasswordFields';
import { Notice } from '@/features/auth/Notice';
import { newPasswordProblems } from '@/features/auth/password';
import { setNewPassword, verifyResetCode } from '@/features/auth/supabaseAuth';
import { space, useTheme } from '@/theme';

export default function ResetPassword() {
  const { status, recovering } = useSession();
  if (status === 'signed-out') return <EnterCode />;
  return recovering ? <NewPassword /> : <NotAReset />;
}

/** Signed in, but not by a reset: the old password is asked for elsewhere. */
function NotAReset() {
  return (
    <ScreenScaffold title="Change your password">
      <View style={{ gap: space.base }} testID="reset-not-a-reset">
        <Text variant="body" tone="ink2">
          You're signed in. Change your password in Account and security — it asks for the
          current one first.
        </Text>
        <Button title="Account and security" onPress={() => router.replace('/settings/security')}
          testID="reset-go-security" />
      </View>
    </ScreenScaffold>
  );
}

/** Signed out: the code from the email signs this phone in first. */
function EnterCode() {
  const { c } = useTheme();
  const input = useInputStyle();
  const { adoptSession } = useSession();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);

  async function verify() {
    setGeneral(null);
    const missing = {
      ...(email.trim() ? {} : { email: 'Enter your email address.' }),
      ...(code.trim() ? {} : { code: 'Enter the 6-digit code from the email.' }),
    };
    setErrors(missing);
    if (Object.keys(missing).length > 0) return;

    setBusy(true);
    try {
      // Signed in, the screen becomes the new-password form.
      await adoptSession(await verifyResetCode(email, code), { recovery: true });
    } catch (e) {
      const f = formErrors(e);
      setErrors(f.fields);
      setGeneral(f.general);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenScaffold title="Choose a new password">
      <View style={{ gap: space.base }} testID="reset-enter-code">
        <Text variant="body" tone="ink2">
          Opened the email somewhere else? Enter the 6-digit code from it. On this phone, the
          link in it works too.
        </Text>

        {general ? <Notice tone="crit" testID="reset-error">{general}</Notice> : null}

        <Field label="Email" error={errors.email}>
          <TextInput
            value={email} onChangeText={setEmail}
            placeholder="you@example.com" placeholderTextColor={c.ink3}
            accessibilityLabel="Email" accessibilityHint={errors.email}
            testID="reset-email"
            autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
            textContentType="emailAddress" autoComplete="email"
            style={input(errors.email)}
          />
        </Field>

        <Field label="Code from the email" error={errors.code}>
          <TextInput
            value={code} onChangeText={setCode}
            placeholder="123456" placeholderTextColor={c.ink3}
            accessibilityLabel="Code from the email" accessibilityHint={errors.code}
            testID="reset-code"
            keyboardType="number-pad" maxLength={8}
            textContentType="oneTimeCode" autoComplete="one-time-code"
            returnKeyType="go" onSubmitEditing={() => { if (!busy) void verify(); }}
            style={input(errors.code)}
          />
        </Field>

        <Button title="Continue" onPress={() => { void verify(); }} loading={busy}
          testID="reset-verify" />
        <Button title="Send a new email" kind="ghost"
          onPress={() => router.replace('/forgot-password')} testID="reset-request-new" />
      </View>
    </ScreenScaffold>
  );
}

/** Signed in by the link or the code: the new password. */
function NewPassword() {
  const { finishRecovery } = useSession();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);
  // The password changed but other devices could not be signed out (no signal).
  const [othersLeft, setOthersLeft] = useState(false);

  async function submit() {
    setGeneral(null);
    const problems = newPasswordProblems(password, confirm);
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setBusy(true);
    try {
      const othersOut = await setNewPassword(password);
      finishRecovery();
      if (othersOut) resetTo('/'); else setOthersLeft(true);
    } catch (e) {
      const f = formErrors(e);
      // Supabase names the field `password`; this form calls it `new_password`.
      const { password: problem, ...rest } = f.fields;
      setErrors(problem ? { ...rest, new_password: problem } : rest);
      setGeneral(f.general);
    } finally {
      setBusy(false);
    }
  }

  if (othersLeft) {
    return (
      <ScreenScaffold title="Password changed">
        <View style={{ gap: space.base }} testID="reset-others-left">
          <Notice tone="crit">
            Your password is changed, but other devices could not be signed out just now. Use
            "Sign out other devices" in Account and security when you have signal.
          </Notice>
          <Button title="Continue" onPress={() => resetTo('/')} testID="reset-continue" />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title="Choose a new password">
      <View style={{ gap: space.base }}>
        <Text variant="body" tone="ink2">
          This signs you out on every other device. You stay signed in here.
        </Text>

        {general ? <Notice tone="crit" testID="reset-error">{general}</Notice> : null}

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
