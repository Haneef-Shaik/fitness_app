/**
 * K-07's "Delete my account" — the three steps the wireframe draws.
 *
 *   1. What goes, with "Download my data first" offered right there: losing
 *      data you meant to keep is the worst outcome of this screen (K-07).
 *   2. Type DELETE. The server checks it again, and asks for a sign-in from the
 *      last ten minutes (docs/14 S5): if this one is older, the screen asks the
 *      person to confirm it is them — their password, or Google or Apple — and
 *      then deletes. A stolen, unlocked phone is not enough.
 *   3. There is no step 3 on this screen: the account is gone, the session
 *      ends, and the welcome screen says so (farewell.ts).
 *
 * Immediate rather than K-07's 30-day grace `[ASSUMPTION]` — the API deletes at
 * once, and saying "scheduled" about something already done would be worse
 * than saying "deleted" and meaning it. The copy is careful to say which.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Field, Text } from '@/ui';
import { TextInput } from '@/ui/TextInput';
import { ApiError } from '@/lib/api';
import { accountApi, needsFreshSignIn } from '@/lib/api-account';
import { AuthProblem } from '@/features/auth/supabaseAuth';
import { store } from '@/lib/db';
import { useSession } from '@/lib/session';
import { useSessionStore } from '@/features/workout-session/store/sessionStore';
import { applyReminders } from '@/features/reminders/schedule';
import { font, radius, space, useTheme } from '@/theme';
import { deleteAccountEverywhere, failureMessage } from './deleteAccount';
import { removeExportCopies } from './saveExport';

const WORD = 'DELETE';

type Step = 'idle' | 'explain' | 'confirm';

export function DeleteAccountFlow({ onExport, webUrl }: {
  /** Runs K-07's export, so "download it first" is the same button's work. */
  onExport: () => void;
  /** The web deletion page, for when the app is no longer installed. */
  webUrl: string;
}) {
  const { c } = useTheme();
  const { signOut, reauthenticate, provider } = useSession();
  const external = provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : null;
  // The server wants a fresher sign-in before it deletes.
  const [signIn, setSignIn] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [typed, setTyped] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState<string | null>(null);

  const ready = typed === WORD && (!signIn || external !== null || password.length > 0);

  const cancel = () => {
    setStep('idle'); setTyped(''); setPassword(''); setErrors({}); setGeneral(null); setSignIn(false);
  };

  const remove = () => deleteAccountEverywhere({
    remove: accountApi.delete,
    store,
    releaseWorkout: () => useSessionStore.setState({ draft: null, recoveryCandidate: null }),
    cancelReminders: () => applyReminders([]),
    removeExports: () => removeExportCopies(),
    signOut,
  });
  // Nothing to set after it: the session has ended and AuthGate has moved on.

  const submit = async () => {
    setBusy(true); setErrors({}); setGeneral(null);
    try {
      if (signIn) {
        await reauthenticate(external ? undefined : password);
        setSignIn(false);
      }
      await remove();
    } catch (e) {
      if (needsFreshSignIn(e)) {
        setSignIn(true);
      } else if (e instanceof AuthProblem) {
        if (e.field === 'password') setErrors({ password: e.message }); else setGeneral(e.message);
      } else if (e instanceof ApiError && Object.keys(e.fields).length > 0) {
        setErrors(e.fields);
      } else {
        setGeneral(failureMessage(e));
      }
      setBusy(false);
    }
  };

  const input = {
    minHeight: 50, borderRadius: radius.btn, backgroundColor: c.sunken,
    borderWidth: 1, paddingHorizontal: 14, color: c.ink, fontFamily: font.ui, fontSize: 15.5,
  } as const;

  if (step === 'idle') {
    return (
      <Button title="Delete my account" kind="danger" testID="delete-account-start"
        onPress={() => setStep('explain')} />
    );
  }

  if (step === 'explain') {
    return (
      <Card testID="delete-account-explain">
        <Text variant="title">Delete your account?</Text>
        <Text variant="body" tone="ink2" style={{ marginTop: space.sm }}>
          This deletes your account and everything in it — every workout, meal, food analysis,
          body measurement, goal and photo — permanently, straight away. It can't be undone,
          and we can't get it back for you.
        </Text>
        <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
          If you ever no longer have the app, you can also delete your account at {webUrl}
        </Text>
        <View style={{ gap: space.sm, marginTop: space.base }}>
          <Button title="Download my data first" kind="ghost" onPress={onExport} />
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button title="Cancel" kind="ghost" style={{ flex: 1 }} onPress={cancel} />
            <Button title="Continue" kind="danger" style={{ flex: 1 }}
              onPress={() => setStep('confirm')} />
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card testID="delete-account-confirm">
      <Text variant="title" style={{ marginBottom: space.base }}>Confirm it's you</Text>
      {general ? (
        <Text variant="body" tone="crit" accessibilityLiveRegion="polite"
          style={{ marginBottom: space.base }}>{general}</Text>
      ) : null}

      <Field label={`Type ${WORD} to confirm`} error={errors.confirmation}>
        <TextInput
          value={typed} onChangeText={setTyped}
          accessibilityLabel={`Type ${WORD} to confirm`} testID="delete-account-word"
          autoCapitalize="characters" autoCorrect={false} autoComplete="off"
          style={[input, { borderColor: errors.confirmation ? c.crit : c.line }]}
        />
      </Field>

      {signIn ? (
        <View testID="delete-account-sign-in" style={{ marginBottom: space.base }}>
          <Text variant="body" tone="ink2" style={{ marginBottom: space.sm }}>
            {external
              ? `For your safety, sign in with ${external} again to delete your account.`
              : 'For your safety, enter your password to delete your account.'}
          </Text>
          {external ? null : (
            <Field label="Your password" error={errors.password}>
              <TextInput
                value={password} onChangeText={setPassword}
                accessibilityLabel="Your password" testID="delete-account-password"
                secureTextEntry autoCapitalize="none" textContentType="password"
                autoComplete="password"
                style={[input, { borderColor: errors.password ? c.crit : c.line }]}
              />
            </Field>
          )}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
        <Button title="Cancel" kind="ghost" style={{ flex: 1 }} onPress={cancel} disabled={busy} />
        <Button
          title={signIn && external ? `Sign in with ${external} and delete` : 'Delete my account permanently'}
          kind="danger" style={{ flex: 2 }}
          testID="delete-account-confirm-button"
          disabled={!ready} loading={busy} onPress={submit}
        />
      </View>
    </Card>
  );
}
