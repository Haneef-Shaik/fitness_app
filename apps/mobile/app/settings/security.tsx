/**
 * K-02 · Account & security — email, password, other devices.
 *
 * Each is something a person holding an unlocked phone should not be able to
 * do quietly, so each asks for the password or the new inbox, and says before
 * it happens what it will do to other devices. Every outcome is stated in
 * words here.
 *
 * Not yet here from the K-02 wireframe: the per-device "Signed in on" list and
 * "Last changed". The server records neither a device name nor a password
 * date yet; "Sign out other devices" covers the need without them.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useSession } from '@/lib/session';
import { ChangeEmailForm } from '@/features/auth/ChangeEmailForm';
import { ChangePasswordForm } from '@/features/auth/ChangePasswordForm';
import { Notice } from '@/features/auth/Notice';
import { ResendVerification } from '@/features/auth/ResendVerification';
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

function verification(verified: boolean | null): string | null {
  if (verified === null) return null;
  return verified ? 'Verified' : 'Not verified yet';
}

export default function Security() {
  const { email, emailVerified, pendingEmail } = useSession();
  const [open, setOpen] = useState<Open>(null);
  const [done, setDone] = useState<{ section: Open; text: string } | null>(null);

  const finish = (section: Open) => (text: string) => { setOpen(null); setDone({ section, text }); };
  const start = (section: Open) => { setDone(null); setOpen(section); };
  const status = verification(emailVerified);

  return (
    <ScreenScaffold title="Account and security">
      <View style={{ gap: space.xl }}>
        <Section title="Email">
          <Card>
            <Text variant="title" numberOfLines={1}>{email ?? ''}</Text>
            {status ? (
              <Text variant="caption" tone={emailVerified ? 'good' : 'ink3'} style={{ marginTop: space.xs }}>
                {status}
              </Text>
            ) : null}
            {pendingEmail ? (
              <Text variant="body" tone="ink2" style={{ marginTop: space.sm }}>
                Waiting for you to confirm {pendingEmail}. Open the link we sent there.
              </Text>
            ) : null}
            {emailVerified === false ? (
              <View style={{ marginTop: space.md }}><ResendVerification /></View>
            ) : null}
            {done?.section === 'email' ? (
              <View style={{ marginTop: space.md }}><Notice tone="good">{done.text}</Notice></View>
            ) : null}
            {open === 'email'
              ? <ChangeEmailForm onDone={finish('email')} onCancel={() => setOpen(null)} />
              : <Button title="Change email" kind="ghost" style={{ marginTop: space.md }}
                  testID="open-change-email" onPress={() => start('email')} />}
          </Card>
        </Section>

        <Section title="Password">
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
        </Section>

        <Section title="Other devices">
          <SignOutOthers />
        </Section>
      </View>
    </ScreenScaffold>
  );
}
