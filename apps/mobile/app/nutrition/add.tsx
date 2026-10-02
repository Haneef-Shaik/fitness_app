/**
 * H-03 · Add Food — mode chooser, and H-04 · Food Search in one screen.
 *
 * The four ways in are big obvious rows above the search results: describe
 * it (AI), photograph it (AI), quick add, or make a new food. They sit ABOVE
 * the list because below it they were off screen once the catalog was
 * seeded, and the screen did not scroll (G10, writing the AC-09 flow).
 *
 * **I13** — no results is not the same as no foods. Searching something the
 * catalog has never heard of offers to create it, carrying the typed name.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TextInput } from '@/ui/TextInput';
import { Pressable } from '@/ui/Pressable';
import type { Food } from '@fitlog/api-types';
import { Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { MenuList } from '@/ui/MenuList';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { SectionHeader } from '@/ui/SectionHeader';
import { grams, kcal } from '@/features/nutrition/format';
import { useFoods } from '@/lib/query/hooks';
import { font, radius, space, useTheme } from '@/theme';

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
    <ScreenScaffold eyebrow="Nutrition" title="Add food">
      <View style={{ gap: space.base }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 52, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2, backgroundColor: c.surface, paddingHorizontal: space.md }}>
          <Ionicons name="search-outline" size={20} color={c.ink3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search foods"
            placeholderTextColor={c.ink3}
            accessibilityLabel="Search foods"
            testID="food-search"
            autoCorrect={false}
            style={{ flex: 1, minHeight: 50, color: c.ink, fontSize: 16, fontFamily: font.ui }}
          />
        </View>

        <MenuList items={[
          { key: 'describe', icon: 'sparkles-outline', label: 'Describe it', hint: 'Type what you ate; check the estimate before it counts', badge: 'AI', testID: 'go-describe', onPress: () => router.push('/nutrition/describe') },
          { key: 'photo', icon: 'camera-outline', label: 'Photograph it', hint: 'Snap the plate; check the estimate before it counts', badge: 'AI', testID: 'go-photo', onPress: () => router.push('/nutrition/photo') },
          { key: 'quick', icon: 'flash-outline', label: 'Quick add', hint: 'Just the calories and macros, no food record', testID: 'go-quick-add', onPress: () => router.push('/nutrition/quick-add') },
          { key: 'new', icon: 'add-circle-outline', label: 'New food', hint: query ? `Create "${query}" to reuse next time` : 'Create one and it is yours to reuse', testID: 'go-new-food', onPress: () => router.push(`/nutrition/food/new?name=${encodeURIComponent(query)}`) },
        ]} />

        <View>
          <SectionHeader title={query ? 'Results' : 'Catalog'} detail={meta?.total_unfiltered ? `${meta.total_unfiltered} foods` : undefined} />
          <DataBoundary
            query={boundaryQuery}
            empty={{
              icon: 'nutrition-outline',
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
              <View style={{ backgroundColor: c.surface, borderRadius: radius.card, borderWidth: 1, borderColor: c.line, overflow: 'hidden' }}>
                {foods.map((food, i) => <FoodRow key={String(food.id)} food={food} last={i === foods.length - 1} />)}
              </View>
            )}
          </DataBoundary>
        </View>
      </View>
    </ScreenScaffold>
  );
}

function FoodRow({ food, last }: { food: Food; last: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => router.push(`/nutrition/food/${food.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${food.name}, ${kcal(food.calories)} kcal per 100 grams`}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 60,
        paddingHorizontal: space.md, paddingVertical: space.sm,
        backgroundColor: pressed ? c.surface2 : 'transparent',
        borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line,
      })}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        {/* Two lines: a USDA name carries its meaning in the qualifiers
            ("Rice, white, long-grain, cooked"), and one line cut them off. */}
        <Text variant="body" weight="medium" numberOfLines={2}>{food.name}</Text>
        <Text variant="caption" tone="ink3">
          {/* Per 100 g, and it says so — the unit is the whole trap. */}
          {kcal(food.calories)} kcal · {grams(food.protein_g)} protein · per 100 g
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.ink3} />
    </Pressable>
  );
}
