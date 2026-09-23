/**
 * H-05 · Food Detail & Portion.
 *
 * The screen where per-100 g becomes an actual amount. It shows BOTH, labelled,
 * because the single most expensive mistake available here is a number whose
 * unit is ambiguous — 165 kcal is a fact about 100 g, not about lunch.
 *
 * The computed figures are a PREVIEW. The server does the conversion again on
 * write and stores that, so what is saved cannot disagree with the food it came
 * from.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { scaleToGrams } from '@volt/domain';
import { Button, Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { grams, kcal } from '@/features/nutrition/format';
import { useCategoryOptions } from '@/features/nutrition/useCategoryOptions';
import { FilterChips } from '@/ui/FilterChips';
import { useFoods, useLogMeal } from '@/lib/query/hooks';
import { radius, space, useTheme } from '@/theme';

export default function FoodDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const search = useFoods('');
  const food = (search.data?.data ?? []).find((f) => String(f.id) === id);

  const [amount, setAmount] = useState('100');
  const [mealType, setMealType] = useState<string>('lunch');
  const { options } = useCategoryOptions();
  const log = useLogMeal();

  const quantity = Number(amount.replace(',', '.')) || 0;

  // Previewed with the SAME function the server uses, through the shared
  // vectors — so the number on screen is the number that gets stored.
  const preview = useMemo(() => scaleToGrams({
    calories: food?.calories ?? null,
    proteinG: food?.protein_g ?? null,
    carbsG: food?.carbs_g ?? null,
    fatG: food?.fat_g ?? null,
  }, quantity), [food, quantity]);

  const boundary = {
    data: food,
    isPending: search.isPending,
    isError: search.isError,
    error: search.error,
    refetch: () => { void search.refetch(); },
  };

  return (
    <ScreenScaffold title={food?.name ?? 'Food'}>
      <DataBoundary
        query={boundary}
        isEmpty={(f) => !f}
        empty={{ title: 'That food no longer exists.' }}
      >
        {(f) => (
          <View style={{ gap: space.lg }}>
            <Card>
              <Text variant="label" tone="ink3">Per 100 g</Text>
              <Text variant="body" style={{ marginTop: 4 }}>
                {kcal(f.calories)} kcal · {grams(f.protein_g)} protein ·{' '}
                {grams(f.carbs_g)} carbs · {grams(f.fat_g)} fat
              </Text>
            </Card>

            <View>
              <Text variant="label" style={{ marginBottom: space.sm }}>Amount (g)</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                accessibilityLabel="Amount in grams"
                testID="portion-grams"
                placeholderTextColor={c.ink3}
                style={{
                  minHeight: 46, borderRadius: radius.btn, borderWidth: 1,
                  borderColor: c.line2, paddingHorizontal: space.md,
                  color: c.ink, backgroundColor: c.sunken,
                }}
              />
              {f.serving_label && f.serving_grams ? (
                <Button
                  title={`${f.serving_label} — ${grams(f.serving_grams)}`}
                  kind="ghost"
                  size="sm"
                  style={{ marginTop: space.sm }}
                  onPress={() => setAmount(String(f.serving_grams))}
                />
              ) : null}
            </View>

            <Card testID="portion-preview">
              <Text variant="label" tone="ink3">{grams(quantity)} of this</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <Text variant="display" style={{ fontSize: 30 }}>{kcal(preview.calories)}</Text>
                <Text variant="caption" tone="ink3">kcal</Text>
              </View>
              <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                {grams(preview.proteinG)} protein · {grams(preview.carbsG)} carbs ·{' '}
                {grams(preview.fatG)} fat
              </Text>
            </Card>

            <View>
              <Text variant="label" style={{ marginBottom: space.sm }}>Meal</Text>
              <FilterChips
                options={options}
                selected={[mealType]}
                onChange={(ids) => setMealType(ids[0] ?? 'lunch')}
                multi={false}
                testID="meal-type"
              />
            </View>

            <Button
              title={log.isPending ? 'Adding…' : 'Add to diary'}
              onPress={async () => {
                await log.mutateAsync({
                  meal_type: mealType as 'lunch',
                  items: [{
                    food_id: String(f.id),
                    quantity_grams: quantity,
                    confirmed: true,
                    source: 'manual',
                  }],
                });
                router.replace('/nutrition');
              }}
            />
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
