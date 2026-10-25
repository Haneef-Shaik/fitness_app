import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { addDays, latestDailyWeights, localDateAt, nutritionTotals, weekStart } from '@fitlog/domain';
import { useMember } from '@/data/MemberProvider';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Card, Header, Screen } from '@/ui';
import { ProgressRing } from '@/ui/ProgressRing';
import { MomentumAsset } from '@/ui/MomentumAsset';

export function TodayScreen() {
  const { data, profile, store, offline, operations } = useMember(); const { theme } = useTheme(); const router = useRouter();
  const [error, setError] = useState(''); const date = localDateAt(new Date(), profile.timezone);
  const active = data.sessions.find((s) => s.status === 'in_progress' && !s.deletedAt);
  const programme = data.programmes.find((p) => p.current && !p.archived); const day = programme?.days[0];
  const week = weekStart(date); const completed = data.sessions.filter((s) => s.status === 'completed' && !s.deletedAt && s.localDate >= week && s.localDate <= date);
  const totals = nutritionTotals(data.meals.filter((m) => m.localDate === date));
  const targets = data.targets.filter((target) => target.effectiveDate <= date).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0];
  const weight = latestDailyWeights(data.body).at(-1); const pending = operations.some((o) => o.status !== 'synced');
  async function start() {
    try { const id = active?.id ?? await store.startWorkout(day?.name ?? t('scratchWorkout'), day, programme); router.push({ pathname: '/workout/[id]', params: { id } }); }
    catch (e) { setError(e instanceof Error ? e.message : t('loadFailed')); }
  }
  return <Screen>
    <View style={{ gap: theme.spacing.xs }}>
      <AppText variant="caption" tone="muted">{new Intl.DateTimeFormat(profile.locale === 'hi' ? 'hi-IN' : 'en-IN', { timeZone: profile.timezone, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</AppText>
      <Header title={profile.displayName} action={t('settings')} onAction={() => router.push('/settings')} />
    </View>
    {offline && <AppText tone="muted">{t('offlineAvailable')}</AppText>}
    <Card tone="accent" style={{ padding: theme.spacing.xl, borderRadius: theme.radius.hero }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <View style={{ flex: 1, gap: theme.spacing.sm }}>
          <AppText variant="label" style={{ color: theme.colors.onPrimaryContainer }}>{t(active ? 'activeWorkout' : 'nextSession')}</AppText>
          <AppText variant={day || active ? 'display' : 'headline'} style={{ color: theme.colors.onPrimaryContainer }}>{active?.name ?? day?.name ?? t('choosePlan')}</AppText>
        </View>
        <MomentumAsset name="imgCookie12" size={theme.dimensions.heroArt} />
      </View>
      <AppText style={{ color: theme.colors.onPrimaryContainer }}>{day ? `${day.exercises.length} ${t('exercises')}` : t('noPlan')}</AppText>
      <AppButton label={t(active ? 'resumeWorkout' : 'startWorkout')} variant="secondary" onPress={() => { void start(); }} />
      <AppText variant="caption" style={{ color: theme.colors.onPrimaryContainer }}>{t('countsToward')}: {t('unscheduled')}</AppText>
    </Card>
    {!!error && <AppText tone="error">{error}</AppText>}
    <Card>
      <AppText variant="title">{t('thisWeek')} · {completed.length} {t('of')} {profile.weeklyGoal}</AppText>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {Array.from({ length: 7 }, (_, i) => addDays(week, i)).map((d) => {
          const logged = completed.some((s) => s.localDate === d);
          return <View key={d} accessibilityLabel={`${d}: ${logged ? t('completed') : t('notLogged')}`} style={{ alignItems: 'center', gap: theme.spacing.sm }}>
            <View style={{ width: theme.dimensions.dayMarker, height: theme.dimensions.dayMarker, borderRadius: theme.radius.full,
              backgroundColor: logged ? theme.colors.primaryContainer : theme.colors.surfaceHighest, justifyContent: 'center', alignItems: 'center' }}>
              <AppText variant="label" style={{ color: logged ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}>{new Date(`${d}T12:00:00Z`).getUTCDate()}</AppText>
            </View>
            <AppText variant="caption" tone={d === date ? 'accent' : 'muted'}>{new Intl.DateTimeFormat(profile.locale === 'hi' ? 'hi' : 'en', { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`))}</AppText>
          </View>;
        })}
      </View>
    </Card>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
      <Pressable onPress={() => router.push('/food')} style={{ flex: 1, minWidth: theme.dimensions.summaryMinWidth }}>
        <Card><AppText variant="label">{t('protein')}</AppText><ProgressRing value={totals.protein.value} target={targets?.protein ?? null} label="g" incomplete={totals.protein.incomplete} />
          <AppText variant="caption" tone="muted">{!totals.protein.logged ? t('notLogged') : totals.protein.incomplete ? t('incomplete') : `${targets?.protein ?? t('noTargets')} g`}</AppText></Card>
      </Pressable>
      <Pressable onPress={() => router.push('/progress')} style={{ flex: 1, minWidth: theme.dimensions.summaryMinWidth }}>
        <Card tone="tonal"><AppText variant="label" style={{ color: theme.colors.onSecondaryContainer }}>{t('bodyWeight')}</AppText>
          <AppText variant="number" style={{ color: theme.colors.onSecondaryContainer }}>{weight?.weightKg ?? '—'}</AppText>
          <AppText style={{ color: theme.colors.onSecondaryContainer }}>{weight ? `kg · ${weight.localDate}` : t('notMeasured')}</AppText>
          <AppText variant="caption" style={{ color: theme.colors.onSecondaryContainer }}>{data.goals.filter((g) => g.status === 'active').length} {t('goals')}</AppText></Card>
      </Pressable>
    </View>
    <Pressable accessibilityRole="button" onPress={() => router.push('/sync')} style={{ minHeight: theme.dimensions.touchTarget, justifyContent: 'center' }}><AppText tone="muted" variant="caption">{t(pending ? 'pendingSync' : 'synced')}</AppText></Pressable>
  </Screen>;
}
