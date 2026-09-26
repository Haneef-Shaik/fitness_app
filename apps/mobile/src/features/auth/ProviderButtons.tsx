/**
 * "Continue with Google" and "Continue with Apple" (docs/14, S7).
 *
 * Each appears only where it can work: Google when the build was given its
 * client ids, Apple on an iPhone that supports it (and never on Android).
 * Apple's is Apple's own button — the App Store's rules for it are specific.
 * Nothing renders when neither is available, so an unconfigured build shows
 * the email form alone rather than a button that fails.
 */
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Button, Text } from '@/ui';
import { resetTo } from '@/lib/navigation';
import { useSession } from '@/lib/session';
import { radius, space, useTheme } from '@/theme';
import { AuthProblem, appleAvailable, googleConfigured } from './supabaseAuth';

export function ProviderButtons({ onProblem }: { onProblem: (message: string) => void }) {
  const { c, scheme } = useTheme();
  const { signInWithGoogle, signInWithApple } = useSession();
  const [apple, setApple] = useState(false);
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);
  const google = googleConfigured();

  useEffect(() => {
    if (Platform.OS !== 'ios') return undefined; // never on Android
    let live = true;
    void appleAvailable().then((ok) => { if (live && ok) setApple(true); });
    return () => { live = false; };
  }, []);

  if (!google && !apple) return null;

  const run = async (which: 'google' | 'apple') => {
    setBusy(which);
    try {
      const done = which === 'google' ? await signInWithGoogle() : await signInWithApple();
      if (done) resetTo('/');
    } catch (e) {
      onProblem(e instanceof AuthProblem ? e.message : 'That did not work. Try again.');
    } finally {
      setBusy(null);
    }
  };

  const AppleButton = apple && Platform.OS === 'ios'
    ? (require('expo-apple-authentication') as typeof import('expo-apple-authentication'))
    : null;

  return (
    <View style={{ gap: space.sm, marginBottom: space.lg }} testID="provider-buttons">
      {AppleButton ? (
        <AppleButton.AppleAuthenticationButton
          buttonType={AppleButton.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={scheme === 'dark'
            ? AppleButton.AppleAuthenticationButtonStyle.WHITE
            : AppleButton.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={radius.btn}
          style={{ height: 50 }}
          onPress={() => { if (!busy) void run('apple'); }}
        />
      ) : null}
      {google ? (
        <Button
          title="Continue with Google" kind="ghost" testID="continue-google"
          loading={busy === 'google'} disabled={busy !== null}
          onPress={() => void run('google')}
        />
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm }}>
        <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
        <Text variant="caption" tone="ink3">or with email</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
      </View>
    </View>
  );
}
