/**
 * Every link in an email from Supabase Auth comes back here (docs/14):
 * confirming a new account, a password reset, confirming a new address.
 *
 * The link carries a PKCE code (lib/supabase.ts), which becomes a session only
 * on the phone that asked for it. A reset goes on to choosing the password —
 * known from what Supabase recorded when the reset was asked for, never from
 * the link itself; everything else lands in the app, signed in.
 *
 * A change of address needs a link opened at BOTH addresses (K-02,
 * double_confirm_changes); the first carries only `message` — halfway, not a
 * failure. A link Supabase refused carries `error_code`, said in FitLog's words
 * only: text in a link is anyone's to write, so none of it is shown.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Button, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { resetTo } from '@/lib/navigation';
import { useSession } from '@/lib/session';
import { AuthProblem, completeLink, wordsFor } from '@/features/auth/supabaseAuth';
import { Notice } from '@/features/auth/Notice';
import { space, useTheme } from '@/theme';

export default function AuthCallback() {
  const { c } = useTheme();
  const { adoptSession } = useSession();
  const params = useLocalSearchParams<{
    code?: string; message?: string; error_code?: string; error_description?: string;
  }>();
  const [problem, setProblem] = useState<string | null>(() => refusal(params));
  const started = useRef(false);

  useEffect(() => {
    if (started.current || problem || !params.code) return;
    started.current = true;
    (async () => {
      try {
        const { session, recovery } = await completeLink(String(params.code));
        await adoptSession(session, { recovery });
        if (recovery) router.replace('/reset-password');
        else resetTo('/');
      } catch (e) {
        setProblem(e instanceof AuthProblem ? e.message : 'That link did not work. Ask for a new one.');
      }
    })();
  }, [params.code, problem, adoptSession]);

  if (!problem && !params.code && params.message) {
    return (
      <ScreenScaffold title="One more link">
        <View style={{ gap: space.base }} testID="auth-callback-halfway">
          <Notice tone="good">
            That address is confirmed. Now open the link we sent to the other one — the change
            happens once both are confirmed.
          </Notice>
          <Button title="Done" onPress={() => resetTo('/')} testID="auth-callback-done" />
        </View>
      </ScreenScaffold>
    );
  }
  if (!problem && params.code) {
    return (
      <ScreenScaffold title="Signing you in">
        <View style={{ paddingTop: space.xl, alignItems: 'center' }} testID="auth-callback-working">
          <ActivityIndicator color={c.accent} />
        </View>
      </ScreenScaffold>
    );
  }
  return (
    <ScreenScaffold title="That link did not work">
      <View style={{ gap: space.base }} testID="auth-callback-problem">
        <Notice tone="crit">{problem ?? 'That link is incomplete. Open it again from the email.'}</Notice>
        <Text variant="caption" tone="ink3">
          Links work once, for an hour, and only on the phone that asked for them.
        </Text>
        <Button title="Log in" onPress={() => resetTo('/login')} testID="auth-callback-login" />
        <Button title="Reset my password" kind="ghost" onPress={() => router.replace('/forgot-password')} />
      </View>
    </ScreenScaffold>
  );
}

/** Supabase's refusal, in FitLog's words — never the link's own text. */
function refusal(params: { error_code?: string; error_description?: string }): string | null {
  if (!params.error_code && !params.error_description) return null;
  return wordsFor(params.error_code) ?? 'That link did not work. Ask for a new one.';
}
