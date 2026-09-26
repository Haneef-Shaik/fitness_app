/**
 * H-03 · Add Food — mode chooser, and H-04 · Food Search in one screen.
 *
 * The modes the wireframe lists are Search / Describe / Photo / Quick add.
 * **Describe and Photo belong to G8** and are shown as coming rather than
 * hidden, because a chooser that silently lacks two of its four options reads
 * as broken rather than unfinished.
 *
 * **I13** — no results is not the same as no foods. Searching something the
 * catalog has never heard of offers to create it, carrying the typed name.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import { Pressable } from '@/ui/Pressable';
import type { Food } from '@fitlog/api-types';
import { Button, Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { grams, kcal } from '@/features/nutrition/format';
import { useFoods } from '@/lib/query/hooks';
import { radius, space, useTheme } from '@/theme';

export default function AddFood() {
  const { c } = useTheme();
  const [query, setQuery] = useState('');
  const search = useFoods(query);

  const rows = search.data?.data ?? [];
  const meta = search.data?.meta;

  const boundaryQuery = {
    data: rows,
    isPending: search.isPending,
    isError: search.isError,
    error: search.error,
    refetch: () => { void search.refetch(); },
  };

  return (
    <ScreenScaffold title="Add food">
      <View style={{ padding: space.lg, gap: space.base }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search foods"
          placeholderTextColor={c.ink3}
          accessibilityLabel="Search foods"
          testID="food-search"
          autoCorrect={false}
          style={{
            minHeight: 46, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
            paddingHorizontal: space.md, color: c.ink, backgroundColor: c.sunken,
          }}
        />

        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button
            title="Quick add"
            kind="ghost"
            size="sm"
            style={{ flex: 1 }}
            onPress={() => router.push('/nutrition/quick-add')}
          />
          <Button
            title="New food"
            kind="ghost"
            size="sm"
            style={{ flex: 1 }}
            onPress={() => router.push(`/nutrition/food/new?name=${encodeURIComponent(query)}`)}
          />
        </View>

        {/* The AI modes sit with the other modes, above the list. Below it
            they were off screen once the catalog was seeded — and the screen
            did not scroll, so on a phone they could not be reached at all
            (G10, writing the AC-09 flow). */}
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button
            title="Describe it"
            kind="ghost"
            size="sm"
            style={{ flex: 1 }}
            testID="go-describe"
            onPress={() => router.push('/nutrition/describe')}
          />
          <Button
            title="Photograph it"
            kind="ghost"
            size="sm"
            style={{ flex: 1 }}
            testID="go-photo"
            onPress={() => router.push('/nutrition/photo')}
          />
        </View>

        <DataBoundary
          query={boundaryQuery}
          empty={{
            title: 'No foods yet',
            body: 'Create one and it is yours to reuse.',
          }}
          filtered={{
            isActive: Boolean(query),
            onClear: () => setQuery(''),
            describe: query,
            title: `Nothing matches "${query}"`,
            body: meta?.total_unfiltered
              ? 'Create it once and it is there next time.'
              : undefined,
          }}
        >
          {(foods) => (
            <View style={{ gap: space.sm }}>
              {foods.map((food) => <FoodRow key={String(food.id)} food={food} />)}
            </View>
          )}
        </DataBoundary>

      </View>
    </ScreenScaffold>
  );
}

function FoodRow({ food }: { food: Food }) {
  return (
    <Pressable
      onPress={() => router.push(`/nutrition/food/${food.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${food.name}, ${kcal(food.calories)} kcal per 100 grams`}
    >
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="body" numberOfLines={1}>{food.name}</Text>
            <Text variant="caption" tone="ink3">
              {/* Per 100 g, and it says so — the unit is the whole trap. */}
              {kcal(food.calories)} kcal · {grams(food.protein_g)} protein · per 100 g
            </Text>
          </View>
          <Text variant="title" tone="ink3">›</Text>
        </View>
      </Card>
    </Pressable>
  );
}
