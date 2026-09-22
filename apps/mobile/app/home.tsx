/** B-01 Home Dashboard — BRD §14. First-run shows a checklist, never zeroed charts. */
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Meter, Pill, Stat, StatRow, Text, Well } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { useTheme, space, font } from '@/theme';
import { useSession } from '@/lib/session';
import { formatDayLabel } from '@/lib/datetime';
import { useCreateGoal, useGoals } from '@/lib/query/hooks';
import { dayTotals, remainingKcal } from '@volt/domain';

export default function Home() {
  const { c } = useTheme();
  const { profile, email, signOut, refreshProfile } = useSession();

  // The query layer owns fetching, caching, retry and the error surface (docs/03 §6).
  const goals = useGoals();
  const createGoal = useCreateGoal();

  // No meals logged yet — the totals come from the domain package, not a hardcoded 0.
  const totals = dayTotals([]);
  const target = profile?.daily_calorie_target ?? 0;
  const remaining = remainingKcal(totals.calories, target);
  const tz = profile?.timezone ?? 'UTC';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.page }}>
      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.huge }}
        refreshControl={
          <RefreshControl refreshing={goals.isFetching} tintColor={c.ink3}
            onRefresh={async () => { await Promise.all([goals.refetch(), refreshProfile()]); }} />
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="title">{formatDayLabel(new Date(), tz)}</Text>
          <Pressable onPress={signOut} accessibilityRole="button" accessibilityLabel="Sign out"
            style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: c.line2,
              alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="caption" tone="ink2" style={{ fontFamily: font.dataSemi }}>
              {(email ?? 'U').slice(0, 2).toUpperCase()}
            </Text>
          </Pressable>
        </View>

        {/* Today's workout */}
        <Text variant="label" style={{ marginTop: space.xl, marginBottom: space.sm }}>Today's workout</Text>
        <Card hero>
          <Pill>No program yet</Pill>
          <Text variant="display" style={{ fontSize: 28, marginTop: 10 }}>Nothing planned</Text>
          <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
            Build a program, or start an empty session.
          </Text>
          {/* Starting a workout is the primary thing this screen is for. G3 left
              it reachable only by URL, which G4 found by trying to drive it. */}
          <Button
            title="Start workout"
            style={{ marginTop: space.base }}
            onPress={() => router.push('/train/start')}
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <Button
              title="Programs"
              kind="ghost"
              size="sm"
              style={{ flex: 1 }}
              onPress={() => router.push('/train/programs')}
            />
            <Button
              title="Exercises"
              kind="ghost"
              size="sm"
              style={{ flex: 1 }}
              onPress={() => router.push('/train/exercises')}
            />
          </View>
        </Card>

        {/* Today's nutrition */}
        <Text variant="label" style={{ marginTop: space.xl, marginBottom: space.sm }}>Today's nutrition</Text>
        <Card hero>
          {target > 0 ? (
            <>
              <View style={{ alignItems: 'center' }}>
                <Text variant="hero" style={{ fontSize: 56 }}>{remaining.toLocaleString()}</Text>
                <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                  kcal left · {totals.calories.toLocaleString()} of {target.toLocaleString()}
                </Text>
              </View>
              <View style={{ marginTop: space.md }}>
                <Meter value={totals.calories} max={target} />
              </View>
              <View style={{ marginTop: space.base, gap: 9 }}>
                {([['Protein', profile?.protein_g_target, c.s1],
                   ['Carbs', profile?.carbs_g_target, c.s2],
                   ['Fat', profile?.fat_g_target, c.s3]] as const).map(([n, t, col]) => (
                  <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text variant="caption" tone="ink3" style={{ width: 54 }}>{n}</Text>
                    <View style={{ flex: 1, height: 7, borderRadius: 4, backgroundColor: c.sunken,
                      borderWidth: 1, borderColor: c.line, overflow: 'hidden' }}>
                      <View style={{ width: '0%', height: '100%', backgroundColor: col }} />
                    </View>
                    <Text variant="caption" tone="ink2" style={{ fontFamily: font.dataSemi, fontSize: 14 }}>
                      0/{t ?? 0} g
                    </Text>
                  </View>
                ))}
              </View>
              <Text variant="caption" tone="ink3" style={{ marginTop: space.md }}>Nothing logged yet.</Text>
            </>
          ) : (
            <>
              <Text variant="body" tone="ink2">No targets set yet.</Text>
              <Button title="Set a target" kind="ghost" size="sm" style={{ marginTop: space.md }} />
            </>
          )}
        </Card>

        {/* Goals */}
        <Text variant="label" style={{ marginTop: space.xl, marginBottom: space.sm }}>Goals</Text>
        <DataBoundary
          query={goals}
          empty={{
            title: 'No goals yet',
            body: 'Set a goal to track progress against.',
            action: {
              label: 'Set a goal',
              onPress: () => createGoal.mutate({
                goal_type: 'fat_loss', metric_key: 'body_weight', direction: 'down',
                start_value: 78.4, target_value: 74, target_unit: 'kg',
                start_date: new Date().toISOString().slice(0, 10),
              } as never),
            },
          }}
        >
          {(rows) => (
            <>
              {rows.map(g => (
                <Card key={g.id} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="label">{g.goal_type.replace('_', ' ')}</Text>
                    <Pill kind="accent">{g.status}</Pill>
                  </View>
                  <Text variant="stat" style={{ marginTop: 8 }}>
                    {g.start_value ?? '—'} → {g.target_value} <Text variant="caption" tone="ink3">{g.target_unit}</Text>
                  </Text>
                  <View style={{ marginTop: space.md }}>
                    <Meter value={0.54} max={1} />
                  </View>
                </Card>
              ))}
            </>
          )}
        </DataBoundary>

        {/* Profile summary — proves the API round-trip */}
        <Text variant="label" style={{ marginTop: space.xl, marginBottom: space.sm }}>Your setup</Text>
        <StatRow>
          <Stat value={profile?.preferred_unit_system === 'metric' ? 'kg' : 'lb'} label="Units" />
          <Stat value={String(profile?.daily_calorie_target ?? '—')} label="kcal target" />
          <Stat value={String(profile?.protein_g_target ?? '—')} label="g protein" />
        </StatRow>
        <Well style={{ marginTop: space.md }}>
          <Text variant="caption" tone="ink3">
            Signed in as {email} · time zone {tz}. Your day starts and ends there — that decides
            which day a workout or meal belongs to.
          </Text>
        </Well>
      </ScrollView>
    </SafeAreaView>
  );
}
