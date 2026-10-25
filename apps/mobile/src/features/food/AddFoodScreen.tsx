import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { instantForDiaryDate, localDateAt, mealItemSchema, scaleFood, type Food } from '@fitlog/domain';
import { useMember } from '@/data/MemberProvider';
import { useDraft } from '@/data/useDraft';
import { saveMeal } from '@/data/api';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Card, Choice, Field, Header, Screen } from '@/ui';

export function AddFoodScreen() {
  const { profile, store, data } = useMember(); const router = useRouter(); const { theme } = useTheme();
  const { category = 'breakfast', date = localDateAt(new Date(), profile.timezone) } = useLocalSearchParams<{ category?: string; date?: string }>();
  const draft = useDraft(`meal:${date}:${category}`, { id: Crypto.randomUUID(), at: new Date().toISOString(), label: '', kcal: '', protein: '', carbs: '', fat: '', fibre: '', quantity: '100', search: '' });
  const [mode, setMode] = useState<'search' | 'quick'>('quick'); const [selected, setSelected] = useState<Food | null>(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const set = (field: keyof typeof draft.value, value: string) => draft.setValue((d) => ({ ...d, [field]: value }));
  const results = data.foods.filter((f) => !f.archived && [f.name, ...f.aliases].some((v) => v.toLowerCase().includes(draft.value.search.toLowerCase())));
  async function save() {
    setBusy(true); setError('');
    try {
      const num = (value: string) => value.trim() ? Number(value.replace(',', '.')) : null;
      const quantity = mode === 'search' ? Number(draft.value.quantity.replace(',', '.')) : 1;
      const nutrients = mode === 'search' && selected ? scaleFood(selected, quantity, selected.referenceUnit) : { kcal: num(draft.value.kcal), protein: num(draft.value.protein), carbs: num(draft.value.carbs), fat: num(draft.value.fat), fibre: num(draft.value.fibre) };
      if (!Object.values(nutrients).some((v) => v !== null)) throw new Error(t('nutritionRequired'));
      const now = instantForDiaryDate(date, profile.timezone, draft.value.at);
      const item = mealItemSchema.parse({ id: draft.value.id, ownerId: profile.id, label: selected?.name ?? draft.value.label, foodId: selected?.id ?? null, quantity, unit: selected?.referenceUnit ?? 'serving', nutrients, category,
        consumedAt: now, localDate: date, timezone: profile.timezone, source: selected ? `${selected.source}:${selected.sourceVersion}` : 'member-quick-add:v1', confirmed: true, estimate: !selected, revision: 1, deletedAt: null });
      await store.onlineWrite(() => saveMeal(item)); await draft.clear(); router.back();
    } catch (e) { setError(e instanceof Error ? e.message : t('saveFailedDraft')); } finally { setBusy(false); }
  }
  return <Screen><Header title={t('addFood')} back />
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: theme.spacing.sm }}><Choice label={t('quickAdd')} selected={mode === 'quick'} onPress={() => { setMode('quick'); setSelected(null); }} /><Choice label={t('foodSearch')} selected={mode === 'search'} onPress={() => setMode('search')} /></View>
    {mode === 'search' ? <>
      <Field label={t('foodSearch')} value={draft.value.search} onChangeText={(v) => set('search', v)} />
      {results.slice(0, 30).map((food) => <Pressable key={food.id} onPress={() => setSelected(food)}><Card tone={selected?.id === food.id ? 'tonal' : 'surface'}><AppText>{food.name}</AppText><AppText variant="caption" tone="muted">{food.referenceQuantity} {food.referenceUnit}</AppText></Card></Pressable>)}
      {selected && <Field label={`${t('quantity')} (${selected.referenceUnit})`} value={draft.value.quantity} onChangeText={(v) => set('quantity', v)} inputMode="decimal" />}
    </> : <><Field label={t('mealName')} value={draft.value.label} onChangeText={(v) => set('label', v)} />
      {(['kcal', 'protein', 'carbs', 'fat', 'fibre'] as const).map((key) => <Field key={key} label={t(key === 'kcal' ? 'calories' : key)} value={draft.value[key]} inputMode="decimal" onChangeText={(v) => set(key, v)} />)}
      <AppText variant="caption" tone="muted">{t('quickAddHint')}</AppText></>}
    {!!(error || draft.storageError) && <AppText tone="error">{error || t('saveFailedDraft')}</AppText>}
    <AppButton label={t('save')} loading={busy} disabled={mode === 'search' && !selected} onPress={() => { void save(); }} />
  </Screen>;
}
