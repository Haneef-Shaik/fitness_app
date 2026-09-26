/**
 * K-02 · Account & security — email, password, other devices (Supabase Auth,
 * docs/14).
 *
 * Each is something a person holding an unlocked phone should not be able to
 * do quietly, so each asks for the password or the new inbox, and says before
 * it happens what it will do to other devices. Every outcome is stated in
 * words here.
 *
 * A Google or Apple sign-in has no password here and its address is the
 * provider's: those sections say so instead of offering a form that cannot work.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useSession } from '@/lib/session';
import { ChangeEmailForm } from '@/features/auth/ChangeEmailForm';
import { ChangePasswordForm } from '@/features/auth/ChangePasswordForm';
import { Notice } from '@/features/auth/Notice';
import { SignOutOthers } from '@/features/auth/SignOutOthers';
import { space } from '@/theme';

type Open = 'email' | 'password' | null;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="label" accessibilityRole="header">{title}</Text>
      {children}
    </View>
  );
}

const PROVIDER_NAMES: Record<string, string> = { google: 'Google', apple: 'Apple' };

export default function Security() {
  const { email, provider, pendingEmail } = useSession();
  const external = provider ? PROVIDER_NAMES[provider] : undefined;
  const [open, setOpen] = useState<Open>(null);
  const [done, setDone] = useState<{ section: Open; text: string } | null>(null);

  const finish = (section: Open) => (text: string) => { setOpen(null); setDone({ section, text }); };
  const start = (section: Open) => { setDone(null); setOpen(section); };

  return (
    <ScreenScaffold title="Account and security">
      <View style={{ gap: space.xl }}>
        <Section title="Email">
          <Card>
            <Text variant="title" numberOfLines={1}>{email ?? ''}</Text>
            {external ? (
              <Text variant="caption" tone="ink3" style={{ marginTop: space.xs }} testID="signed-in-with">
                {`Signed in with ${external}`}
              </Text>
            ) : null}
            {pendingEmail ? (
              <Text variant="body" tone="ink2" style={{ marginTop: space.sm }}>
                Waiting for you to confirm {pendingEmail}. Open the link we sent there.
              </Text>
            ) : null}
            {done?.section === 'email' ? (
              <View style={{ marginTop: space.md }}><Notice tone="good">{done.text}</Notice></View>
            ) : null}
            {external ? (
              <Text variant="body" tone="ink2" style={{ marginTop: space.sm }}>
                {`This is your ${external} address. Change it with ${external}.`}
              </Text>
            ) : open === 'email'
              ? <ChangeEmailForm onDone={finish('email')} onCancel={() => setOpen(null)} />
              : <Button title="Change email" kind="ghost" style={{ marginTop: space.md }}
                  testID="open-change-email" onPress={() => start('email')} />}
          </Card>
        </Section>

        {external ? null : <Section title="Password">
          <Card>
            <Text variant="body" tone="ink2">
              Changing your password signs you out on every other device. This one stays signed in.
            </Text>
            {done?.section === 'password' ? (
              <View style={{ marginTop: space.md }}><Notice tone="good">{done.text}</Notice></View>
            ) : null}
            {open === 'password'
              ? <ChangePasswordForm onDone={finish('password')} onCancel={() => setOpen(null)} />
              : <Button title="Change password" kind="ghost" style={{ marginTop: space.md }}
                  testID="open-change-password" onPress={() => start('password')} />}
          </Card>
        </Section>}

        <Section title="Other devices">
          <SignOutOthers />
        </Section>
      </View>
    </ScreenScaffold>
  );
}
