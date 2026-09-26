/**
 * L-05 · Session Expired — sign back in without losing the screen underneath.
 *
 * The server ended this session (a password changed elsewhere, "sign out other
 * devices", or a revoked token family). Dropping the user at the login screen
 * would throw away whatever they were in the middle of — a workout is safe on
 * the device, but a half-typed meal is not. So this sits over the current
 * screen, asks only for the password of the account already shown, and closes
 * on success. Queued changes were waiting for exactly this and upload next.
 */
import React, { useState } from 'react';
import { Modal, View } from 'react-native';
import { Button, Text } from '@/ui';
import { TextInput } from '@/ui/TextInput';
import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';
import { radius, space, useTheme } from '@/theme';

export function SessionExpiredDialog() {
  const { c } = useTheme();
  const { expired, email, reauthenticate, signOut } = useSession();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!expired) return null;

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await reauthenticate(password);
      setPassword('');
    } catch (e) {
      setError(e instanceof ApiError && e.status === 401
        ? "That password didn't match. Try again."
        : e instanceof ApiError ? e.message : "Couldn't reach FitLog. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}} testID="session-expired">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: space.lg }}>
        <View
          accessibilityViewIsModal
          style={{
            gap: space.md, padding: space.lg, borderRadius: radius.lg,
            backgroundColor: c.surface, borderWidth: 1, borderColor: c.line,
          }}
        >
          <Text variant="title" accessibilityRole="header">Sign in again to carry on</Text>
          <Text variant="body" tone="ink2">
            Your session for {email ?? 'this account'} ended. Nothing on this screen is lost, and
            anything waiting to upload will go once you're back in.
          </Text>
          <TextInput
            testID="expired-password"
            accessibilityLabel="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={() => { void submit(); }}
            style={{
              minHeight: 48, paddingHorizontal: space.md, borderRadius: radius.btn,
              borderWidth: 1, borderColor: c.line2, color: c.ink, backgroundColor: c.sunken,
            }}
          />
          {error ? <Text variant="caption" tone="crit" testID="expired-error">{error}</Text> : null}
          <Button title="Sign in" loading={busy} disabled={!password} testID="expired-submit"
            onPress={() => { void submit(); }} />
          <Button title="Sign out instead" kind="ghost" testID="expired-signout"
            onPress={() => { void signOut(); }} />
        </View>
      </View>
    </Modal>
  );
}
