/**
 * H-11 · Recipe detail — log it, or edit it.
 *
 * **Editing a recipe never changes a meal already logged from it.** Logging
 * snapshotted the macros onto the meal's items; this screen edits the plan, and
 * the note on it says so, because "I fixed the recipe and last Tuesday moved"
 * is the exact confusion the snapshot rule exists to prevent.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import { Button, Card, Text } from '@/ui';
import { Choice } from '@/ui/Choice';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { grams, kcal } from '@/features/nutrition/format';
import { useCategoryOptions } from '@/features/nutrition/useCategoryOptions';
import {
  useDeleteRecipe, useLogRecipe, useRecipe, useUpdateRecipe,
} from '@/lib/query/hooks';
import { radius, space, useTheme } from '@/theme';

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const query = useRecipe(id ?? '');
  const log = useLogRecipe();
  const update = useUpdateRecipe();
  const remove = useDeleteRecipe();
  const { options } = useCategoryOptions();

  const [mealType, setMealType] = useState('breakfast');
  const [servings, setServings] = useState('1');
  const [batchServings, setBatchServings] = useState('');

  useEffect(() => {
    if (query.data) setBatchServings(String(query.data.servings));
  }, [query.data]);

  useEffect(() => {
    if (options.length > 0 && !options.some((o) => o.value === mealType)) {
      setMealType(options[0]!.value);
    }
  }, [options, mealType]);

  return (
    <ScreenScaffold title="Recipe">
      <DataBoundary
        query={query}
        isEmpty={(r) => !r}
        empty={{ title: 'That recipe no longer exists.' }}
      >
        {(recipe) => {
          const per = recipe.per_serving;
          const wanted = Math.max(0.25, Number(servings) || 1);

          return (
            <View style={{ gap: space.lg }}>
              <Card hero>
                <Text variant="title">{recipe.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                  <Text variant="display" style={{ fontSize: 30 }}>
                    {kcal((per?.calories ?? 0) * wanted)}
                  </Text>
                  <Text variant="caption" tone="ink3">
                    kcal · {wanted} serving{wanted === 1 ? '' : 's'}
                  </Text>
                </View>
                <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                  P {grams((per?.protein_g ?? 0) * wanted)} ·{' '}
                  C {grams((per?.carbs_g ?? 0) * wanted)} ·{' '}
                  F {grams((per?.fat_g ?? 0) * wanted)}
                </Text>
              </Card>

              <Card>
                <Text variant="label">Ingredients</Text>
                {(recipe.items ?? []).map((item) => (
                  <View
                    key={String(item.id)}
                    style={{ flexDirection: 'row', marginTop: space.sm, gap: space.sm }}
                  >
                    <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                      {item.display_name}
                    </Text>
                    <Text variant="caption" tone="ink3">{grams(item.quantity_grams)}</Text>
                    <Text variant="caption" tone="ink3">{kcal(item.calories)} kcal</Text>
                  </View>
                ))}
                <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
                  Quantities are for the whole batch of {recipe.servings}.
                </Text>
              </Card>

              <View>
                <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>Log to</Text>
                <Choice
                  testID="recipe-meal-type"
                  value={mealType}
                  onChange={setMealType}
                  options={options}
                />
              </View>

              <View>
                <Text variant="label" accessibilityElementsHidden importantForAccessibility="no" style={{ marginBottom: space.sm }}>Servings</Text>
                <TextInput
                  value={servings}
                  onChangeText={setServings}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Servings to log"
                  testID="recipe-log-servings"
                  style={{
                    minHeight: 46, borderRadius: radius.btn, borderWidth: 1,
                    borderColor: c.line2, paddingHorizontal: space.md,
                    color: c.ink, backgroundColor: c.sunken,
                  }}
                />
              </View>

              <Button
                title={log.isPending ? 'Logging…' : 'Log it'}
                testID="recipe-log"
                onPress={async () => {
                  await log.mutateAsync({
                    id: String(recipe.id),
                    body: { meal_type: mealType, servings: wanted },
                  });
                  router.replace('/nutrition');
                }}
              />

              <Card>
                <Text variant="label" accessibilityElementsHidden importantForAccessibility="no" style={{ marginBottom: space.sm }}>
                  Servings this batch makes
                </Text>
                <TextInput
                  value={batchServings}
                  onChangeText={setBatchServings}
                  keyboardType="number-pad"
                  accessibilityLabel="Servings this batch makes"
                  testID="recipe-batch-servings"
                  style={{
                    minHeight: 46, borderRadius: radius.btn, borderWidth: 1,
                    borderColor: c.line2, paddingHorizontal: space.md,
                    color: c.ink, backgroundColor: c.sunken,
                  }}
                />
                <Button
                  title="Save changes"
                  kind="ghost"
                  size="sm"
                  style={{ marginTop: space.sm }}
                  testID="recipe-save"
                  onPress={() => update.mutate({
                    id: String(recipe.id),
                    body: { servings: Math.max(1, Number(batchServings) || 1) },
                  })}
                />
                {/* The sentence that stops "I fixed the recipe and last Tuesday moved". */}
                <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
                  Editing a recipe changes what it will make next time. Meals already
                  logged from it keep the numbers they had.
                </Text>
              </Card>

              <Button
                title="Delete recipe"
                kind="danger"
                testID="recipe-delete"
                onPress={async () => {
                  await remove.mutateAsync(String(recipe.id));
                  router.back();
                }}
              />
            </View>
          );
        }}
      </DataBoundary>
    </ScreenScaffold>
  );
}
