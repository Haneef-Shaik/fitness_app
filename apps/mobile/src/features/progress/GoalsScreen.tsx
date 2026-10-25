import { useRouter } from 'expo-router';
import { goalProgress, latestDailyWeights, strengthGoalValue, localDateAt } from '@fitlog/domain';
import { useMember } from '@/data/MemberProvider';
import { t } from '@/lib/i18n';
import { AppButton, AppText, Card, Header, Screen } from '@/ui';

export function GoalsScreen() {
  const { data, profile } = useMember(); const router = useRouter(); const weights = latestDailyWeights(data.body);
  return <Screen><Header title={t('goals')} back /><AppButton label={t('newGoal')} onPress={() => router.push('/goal-new')} />
    {data.goals.map((goal) => {
      const current = goal.metric === 'weight' ? weights.filter((w) => w.localDate >= goal.startDate && (!goal.deadline || w.localDate <= goal.deadline)).at(-1)?.weightKg ?? null : goal.type === 'strength' ? strengthGoalValue(goal, data.sessions, localDateAt(new Date(), profile.timezone)) : null;
      const result = goalProgress(goal, current);
      return <Card key={goal.id}><AppText variant="title">{goal.name}</AppText><AppText tone="muted">{goal.baseline} → {goal.target} · {t(goal.status)}</AppText><AppText variant="number">{result?.percent === null || !result ? '—' : `${Math.round(result.percent)}%`}</AppText><AppText>{current === null ? t('notMeasured') : String(current)}</AppText></Card>;
    })}
    {!data.goals.length && <Card><AppText variant="title">{t('noGoals')}</AppText><AppText tone="muted">{t('noGoalsBody')}</AppText></Card>}
  </Screen>;
}
