/**
 * H-02 · Meal Detail — items, per-meal totals, edit.
 *
 * An unconfirmed item is shown with a badge and is **not** in the total
 * (**I2 / D5 / I12**). Estimated must never look confirmed, and the total is
 * the place that distinction pays off.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import type { MealItem } from '@fitlog/api-types';
import { Button, Card, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { grams, kcal, mealTypeLabel, portion } from '@/features/nutrition/format';
import { useCategoryOptions } from '@/features/nutrition/useCategoryOptions';
import { useDeleteMeal, useMeal, useUpdateMealItem } from '@/lib/query/hooks';
import { space } from '@/theme';

export default function MealDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useMeal(id ?? '');
  const { categories } = useCategoryOptions();
  const confirm = useUpdateMealItem();
  const remove = useDeleteMeal();

  return (
    <ScreenScaffold title="Meal">
      <DataBoundary
        query={query}
        isEmpty={(m) => !m}
        empty={{ title: 'That meal no longer exists.' }}
      >
        {(meal) => {
          const items = meal.items ?? [];
          // Confirmed only — the same rule the server applies to the day.
          const total = items.filter((i) => i.confirmed)
            .reduce((n, i) => n + (i.calories ?? 0), 0);
          const pending = items.filter((i) => !i.confirmed);

          return (
            <View style={{ gap: space.lg }}>
              <Card hero>
                <Pill>{mealTypeLabel(meal.meal_type, categories)}</Pill>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                  <Text variant="display" style={{ fontSize: 30 }}>{kcal(total)}</Text>
                  <Text variant="caption" tone="ink3">kcal</Text>
                </View>
                <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                  {meal.local_date}
                </Text>
              </Card>

              <View style={{ gap: space.sm }}>
                {items.map((item) => (
                  <ItemRow
                    key={String(item.id)}
                    item={item}
                    onConfirm={() => confirm.mutate({
                      id: String(item.id), body: { confirmed: true },
                    })}
                  />
                ))}
              </View>

              {pending.length > 0 ? (
                <Text variant="caption" tone="ink3">
                  {pending.length} item{pending.length === 1 ? '' : 's'} not counted until
                  confirmed.
                </Text>
              ) : null}

              <Button
                title="Copy this meal"
                kind="ghost"
                testID="meal-copy"
                onPress={() => router.push(`/nutrition/copy?meal=${meal.id}`)}
              />

              <Button
                title="Delete meal"
                kind="ghost"
                onPress={async () => {
                  await remove.mutateAsync(String(meal.id));
                  router.replace('/nutrition');
                }}
              />
            </View>
          );
        }}
      </DataBoundary>
    </ScreenScaffold>
  );
}

function ItemRow({ item, onConfirm }: { item: MealItem; onConfirm: () => void }) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Text variant="body" numberOfLines={1}>{item.display_name}</Text>
          <Text variant="caption" tone="ink3">
            {portion(item.quantity_grams)} · {grams(item.protein_g)} protein
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="body" tone={item.confirmed ? undefined : 'ink3'}>
            {kcal(item.calories)}
          </Text>
          {/* I12 — an estimate is visibly an estimate, and says what that costs. */}
          {!item.confirmed ? <Pill kind="mute">not counted</Pill> : null}
        </View>
      </View>
      {!item.confirmed ? (
        <Button title="Confirm" size="sm" style={{ marginTop: space.sm }} onPress={onConfirm} />
      ) : null}
    </Card>
  );
}
