/**
 * H-11 · New recipe.
 *
 * Ingredients are picked from the food catalog, so a recipe references live
 * foods and its preview updates when one is corrected. What it has already
 * produced does not move — logging snapshots.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View, type TextInputProps } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import type { Food } from '@volt/api-types';
import { Button, Card, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { grams, kcal } from '@/features/nutrition/format';
import { useCreateRecipe, useFoods } from '@/lib/query/hooks';
import { radius, space, useTheme } from '@/theme';

interface Draft {
  food: Food;
  quantityGrams: number;
}

export default function NewRecipe() {
  const { c } = useTheme();
  const [name, setName] = useState('');
  const [servings, setServings] = useState('1');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<readonly Draft[]>([]);
  const foods = useFoods(query.trim() || undefined);
  const create = useCreateRecipe();

  const servingCount = Math.max(1, Number(servings) || 1);
  const batchKcal = items.reduce(
    (n, i) => n + ((i.food.calories ?? 0) * i.quantityGrams) / 100, 0,
  );

  const input = (props: TextInputProps) => (
    <TextInput
      placeholderTextColor={c.ink3}
      {...props}
      style={{
        minHeight: 46, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
        paddingHorizontal: space.md, color: c.ink, backgroundColor: c.sunken,
      }}
    />
  );

  return (
    <ScreenScaffold title="New recipe">
      <View style={{ gap: space.lg }}>
        <View>
          <Text variant="label" accessibilityElementsHidden importantForAccessibility="no" style={{ marginBottom: space.sm }}>Name</Text>
          {input({
            value: name, onChangeText: setName, testID: 'recipe-name',
            accessibilityLabel: 'Recipe name', placeholder: 'Morning oats',
          })}
        </View>

        <View>
          <Text variant="label" accessibilityElementsHidden importantForAccessibility="no" style={{ marginBottom: space.sm }}>
            Servings this makes
          </Text>
          {input({
            value: servings, onChangeText: setServings, keyboardType: 'number-pad',
            testID: 'recipe-servings', accessibilityLabel: 'Servings this makes',
          })}
          <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
            Quantities below are for the whole batch. Everything else is shown per serving.
          </Text>
        </View>

        {items.length > 0 ? (
          <Card>
            <Text variant="label">Ingredients</Text>
            {items.map((item, index) => (
              <View
                key={`${item.food.id}-${index}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm }}
              >
                <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                  {item.food.name}
                </Text>
                <Text variant="caption" tone="ink3">{grams(item.quantityGrams)}</Text>
                <Button
                  title="Remove"
                  kind="ghost"
                  size="sm"
                  testID={`recipe-item-${index}-remove`}
                  onPress={() => setItems((rows) => rows.filter((_, i) => i !== index))}
                />
              </View>
            ))}
            <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
              {kcal(batchKcal / servingCount)} kcal per serving
            </Text>
          </Card>
        ) : null}

        <View>
          <Text variant="label" accessibilityElementsHidden importantForAccessibility="no" style={{ marginBottom: space.sm }}>Add an ingredient</Text>
          {input({
            value: query, onChangeText: setQuery, testID: 'recipe-food-search',
            accessibilityLabel: 'Search foods', placeholder: 'Search foods',
          })}
          {(foods.data?.data ?? []).slice(0, 6).map((food) => (
            <Button
              key={String(food.id)}
              title={`${food.name} · 100 g`}
              kind="ghost"
              size="sm"
              style={{ marginTop: space.sm }}
              testID={`recipe-add-${food.id}`}
              onPress={() => setItems((rows) => [...rows, { food, quantityGrams: 100 }])}
            />
          ))}
        </View>

        <Button
          title={create.isPending ? 'Saving…' : 'Save recipe'}
          disabled={!name.trim() || items.length === 0}
          onPress={async () => {
            const recipe = await create.mutateAsync({
              name: name.trim(),
              servings: servingCount,
              notes: null,
              items: items.map((i) => ({
                food_id: i.food.id,
                display_name: i.food.name,
                quantity_grams: i.quantityGrams,
                calories: null, protein_g: null, carbs_g: null, fat_g: null,
              })),
            });
            router.replace(`/nutrition/recipes/${recipe.id}`);
          }}
        />
      </View>
    </ScreenScaffold>
  );
}
