/**
 * H-11 · Recipes & saved meals.
 *
 * Every figure on this list is **per serving**. A batch recipe shown at batch
 * size reads as one terrifying meal, and the number people compare against
 * their day is the portion they will actually eat.
 */
import { router } from 'expo-router';
import { View } from 'react-native';
import { Pressable } from '@/ui/Pressable';
import type { Recipe } from '@volt/api-types';
import { Button, Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { grams, kcal, count } from '@/features/nutrition/format';
import { useRecipes } from '@/lib/query/hooks';
import { space } from '@/theme';

export default function Recipes() {
  const query = useRecipes();

  return (
    <ScreenScaffold
      title="Recipes"
      action={{ label: '+ New', onPress: () => router.push('/nutrition/recipes/new') }}
    >
      <DataBoundary
        query={query}
        isEmpty={(rows) => rows.length === 0}
        empty={{
          title: 'No recipes yet',
          body: 'Save a meal you eat often and logging it becomes one tap.',
        }}
      >
        {(rows) => (
          <View style={{ gap: space.md }}>
            {rows.map((recipe) => <RecipeRow key={String(recipe.id)} recipe={recipe} />)}
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}

function RecipeRow({ recipe }: { recipe: Recipe }) {
  const items = recipe.items ?? [];
  const per = recipe.per_serving;

  return (
    <Pressable
      onPress={() => router.push(`/nutrition/recipes/${recipe.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${recipe.name}, ${count(items.length, 'item')}, ${kcal(per?.calories)} kcal per serving`}
      testID={`recipe-${recipe.id}`}
    >
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="body">{recipe.name}</Text>
            <Text variant="caption" tone="ink3">
              {items.length} item{items.length === 1 ? '' : 's'} ·{' '}
              {recipe.servings} serving{recipe.servings === 1 ? '' : 's'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="body" tone="ink2">{kcal(per?.calories)} kcal</Text>
            <Text variant="caption" tone="ink3">per serving</Text>
          </View>
        </View>
        <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
          P {grams(per?.protein_g)} · C {grams(per?.carbs_g)} · F {grams(per?.fat_g)}
        </Text>
        <Button
          title="Log it"
          kind="ghost"
          size="sm"
          style={{ marginTop: space.sm }}
          testID={`recipe-${recipe.id}-log`}
          onPress={() => router.push(`/nutrition/recipes/${recipe.id}`)}
        />
      </Card>
    </Pressable>
  );
}
