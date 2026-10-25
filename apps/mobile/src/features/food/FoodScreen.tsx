import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { localDateAt, nutritionTotals } from '@fitlog/domain';
import { useMember } from '@/data/MemberProvider';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Card, Field, Header, Screen } from '@/ui';
import { ProgressRing } from '@/ui/ProgressRing';

export function FoodScreen() {
  const { data, profile, offline } = useMember(); const { theme } = useTheme(); const router = useRouter();
  const [date, setDate] = useState(localDateAt(new Date(), profile.timezone));
  const meals = data.meals.filter((m) => !m.deletedAt && m.localDate === date); const totals = nutritionTotals(meals);
  const target = data.targets.filter((v) => v.effectiveDate <= date).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0];
  return <Screen><Header title={t('food')} action={t('nutritionTargets')} onAction={() => router.push('/nutrition-targets')} />
    <Field label={t('dateLabel')} value={date} onChangeText={setDate} placeholder={t('dateFormat')} />
    <Card><View style={{ flexDirection: 'row', gap: theme.spacing.xl, alignItems: 'center', flexWrap: 'wrap' }}>
      <ProgressRing value={totals.protein.value} target={target?.protein ?? null} label={t('protein')} incomplete={totals.protein.incomplete} />
      <View style={{ gap: theme.spacing.md, flex: 1 }}>{(['kcal', 'protein', 'carbs', 'fat'] as const).map((metric) => <View key={metric}><AppText variant="caption" tone="muted">{t(metric === 'kcal' ? 'calories' : metric)}</AppText><AppText variant="title">{totals[metric].logged ? Math.round(totals[metric].value) : '—'} / {target?.[metric] ?? '—'}{metric !== 'kcal' ? ' g' : ''}</AppText>{totals[metric].incomplete && <AppText variant="caption" tone="muted">{t('incomplete')}</AppText>}</View>)}</View>
    </View></Card>
    <Header title={t('meals')} />
    {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((category) => <Card key={category}>
      <AppText variant="title">{t(category)}</AppText>
      {meals.filter((m) => m.category === category).map((m) => <View key={m.id} style={{ gap: theme.spacing.xs }}><AppText>{m.label}</AppText><AppText variant="caption" tone="muted">{m.nutrients.kcal === null ? t('incomplete') : `${Math.round(m.nutrients.kcal)} kcal`} · {m.nutrients.protein ?? '—'} g {t('protein')}{m.estimate ? ` · ${t('estimate')}` : ''}</AppText></View>)}
      <AppButton label={t('addFood')} variant="secondary" onPress={() => router.push({ pathname: '/food-add', params: { category, date } })} />
    </Card>)}
    {offline && <AppText tone="muted">{t('onlineSave')}</AppText>}
  </Screen>;
}
