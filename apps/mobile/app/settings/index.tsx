/**
 * K-01 · Profile & settings — where the avatar goes.
 *
 * Built in G10 because the avatar on the dashboard WAS the sign-out button:
 * one tap, no confirmation, signed out. Sign-out lives here now, behind a
 * confirmation that says what happens to unfinished work — an unfinished
 * workout stays on the device for this account (K-01) and queued changes
 * upload when they sign back in.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { NavGroup, NavRow } from '@/ui/NavRow';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useSession } from '@/lib/session';
import { store } from '@/lib/db';
import { count } from '@/features/nutrition/format';
import { font, space, useTheme } from '@/theme';

interface Unfinished { workout: boolean; unsent: number }

export default function Settings() {
  const { c } = useTheme();
  const { email, profile, signOut } = useSession();
  const [confirm, setConfirm] = useState<Unfinished | null>(null);
  const [leaving, setLeaving] = useState(false);

  const name = profile?.display_name || email || 'Your account';
  const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0]!.toUpperCase()).join('');

  const askToSignOut = async () => {
    // What is on the device for THIS account, so the confirmation can say what
    // happens to it rather than a generic "are you sure".
    const [draft, entries] = await Promise.all([
      store.loadDraft().catch(() => null),
      store.allEntries().catch(() => []),
    ]);
    setConfirm({ workout: draft !== null, unsent: entries.filter((e) => e.state === 'pending').length });
  };

  const doSignOut = async () => {
    setLeaving(true);
    try { await signOut(); } finally { setLeaving(false); }
  };

  return (
    <ScreenScaffold title="Profile">
      <View style={{ gap: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.base }}>
          <View
            style={{
              width: 56, height: 56, borderRadius: 28, backgroundColor: c.accentWash,
              borderWidth: 1, borderColor: c.line2, alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text variant="title" tone="accent" style={{ fontFamily: font.uiSemi }}>{initials || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h2" numberOfLines={1}>{name}</Text>
            {email && email !== name ? (
              <Text variant="caption" tone="ink3" numberOfLines={1}>{email}</Text>
            ) : null}
            {profile?.timezone ? (
              <Text variant="caption" tone="ink3" numberOfLines={1}>{profile.timezone}</Text>
            ) : null}
          </View>
        </View>

        <View>
          <Text variant="label" style={{ marginBottom: space.sm }}>Settings</Text>
          <NavGroup>
            <NavRow icon="person-outline" label="Your details" testID="go-profile-details"
              onPress={() => router.push('/settings/profile')} />
            <NavRow icon="flame-outline" label="Calorie and macro targets"
              onPress={() => router.push('/nutrition/targets')} />
            <NavRow icon="grid-outline" label="Dashboard layout"
              onPress={() => router.push('/home/customize')} />
            <NavRow icon="notifications-outline" label="Notifications and reminders"
              onPress={() => router.push('/notifications')} />
            <NavRow icon="cloud-upload-outline" label="Sync"
              onPress={() => router.push('/sync')} />
          </NavGroup>
        </View>

        {confirm ? (
          <Card testID="signout-confirm">
            <Text variant="title">Sign out of {email ?? 'this account'}?</Text>
            {confirm.workout ? (
              <Text variant="body" tone="ink2" style={{ marginTop: space.sm }}>
                You have an unfinished workout on this device. It'll still be here when you sign back in.
              </Text>
            ) : null}
            {confirm.unsent > 0 ? (
              <Text variant="body" tone="ink2" style={{ marginTop: space.sm }}>
                {count(confirm.unsent, 'change')} {confirm.unsent === 1 ? "hasn't" : "haven't"} uploaded
                yet. {confirm.unsent === 1 ? "It'll" : "They'll"} upload when you sign back in.
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.base }}>
              <Button title="Stay signed in" kind="ghost" style={{ flex: 1 }} onPress={() => setConfirm(null)} />
              <Button title="Yes, sign out" kind="danger" style={{ flex: 1 }} loading={leaving} onPress={doSignOut} />
            </View>
          </Card>
        ) : (
          <Button title="Sign out" kind="ghost" testID="sign-out" onPress={askToSignOut} />
        )}
      </View>
    </ScreenScaffold>
  );
}
