/**
 * H-01 · one meal on the diary: a header row (the meal's name, its confirmed
 * total, and "+" to add to it) over its items, each with a bar in the hue of
 * the macro that dominates it.
 *
 * Only confirmed items are in the total (**I2 / D5**); an estimated one is
 * drawn with the sparkle and its figure in the accent, and counts for nothing.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Meal, MealCategory, MealItem } from '@fitlog/api-types';
import { Pressable } from '@/ui/Pressable';
import { Text } from '@/ui';
import { count, grams, kcal, mealTypeLabel } from '@/features/nutrition/format';
import { radius, space, useTheme, type Colors } from '@/theme';

const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

/** Which macro carries most of an item's energy — the colour of its bar. */
export function dominantMacro(item: Pick<MealItem, 'protein_g' | 'carbs_g' | 'fat_g'>): keyof Colors | null {
  const p = (item.protein_g ?? 0) * KCAL_PER_G.protein;
  const c = (item.carbs_g ?? 0) * KCAL_PER_G.carbs;
  const f = (item.fat_g ?? 0) * KCAL_PER_G.fat;
  if (p === 0 && c === 0 && f === 0) return null;
  if (p >= c && p >= f) return 's1';
  return c >= f ? 's2' : 's3';
}

function ItemRow({ item, last }: { item: MealItem; last: boolean }) {
  const { c } = useTheme();
  const hue = dominantMacro(item);
  const macros = [
    item.protein_g != null ? `P ${grams(item.protein_g)}` : null,
    item.carbs_g != null ? `C ${grams(item.carbs_g)}` : null,
    item.fat_g != null ? `F ${grams(item.fat_g)}` : null,
  ].filter(Boolean).join(' · ');
  const detail = [item.quantity_grams != null ? grams(item.quantity_grams) : null, macros].filter(Boolean).join(' · ');
  return (
    <View
      accessible
      accessibilityLabel={`${item.display_name}, ${kcal(item.calories)} kilocalories${item.confirmed ? '' : ', estimated, not counted'}`}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: space.sm,
        minHeight: 52, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line,
      }}
    >
      <View style={{ width: 3, height: 28, borderRadius: radius.pill, backgroundColor: hue ? c[hue] : c.line2 }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="body" weight="medium" numberOfLines={1}>
          {item.confirmed ? '' : '✦ '}{item.display_name}
        </Text>
        {detail ? <Text variant="caption" tone="ink3" numberOfLines={1}>{detail}</Text> : null}
      </View>
      <Text variant="body" weight="semi" tone={item.confirmed ? 'ink' : 'accent'}>
        {item.confirmed ? '' : '~'}{kcal(item.calories)} kcal
      </Text>
    </View>
  );
}

export function MealSection({ meal, categories }: { meal: Meal; categories?: readonly MealCategory[] }) {
  const { c } = useTheme();
  const items = meal.items ?? [];
  const name = mealTypeLabel(meal.meal_type, categories);
  const total = items.filter((i) => i.confirmed).reduce((n, i) => n + (i.calories ?? 0), 0);

  return (
    <View
      testID={`meal-${meal.id}`}
      style={{ backgroundColor: c.surface, borderRadius: radius.card, borderWidth: 1, borderColor: c.line, overflow: 'hidden' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface2, borderBottomWidth: items.length ? 1 : 0, borderBottomColor: c.line }}>
        <Pressable
          onPress={() => router.push(`/nutrition/meal/${meal.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`${name}, ${kcal(total)} kcal, ${count(items.length, 'item')}`}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: space.sm, paddingHorizontal: space.md, minHeight: 48 }}
        >
          <Text variant="label" tone="accent" style={{ alignSelf: 'center' }}>{name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, alignSelf: 'center' }}>
            <Text variant="caption" tone="ink3" weight="semi">{kcal(total)}</Text>
            <Text variant="caption" tone="ink3">kcal</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => router.push('/nutrition/add')}
          accessibilityRole="button"
          accessibilityLabel={`Add to ${name}`}
          hitSlop={6}
          style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="add" size={22} color={c.ink2} />
        </Pressable>
      </View>
      {items.map((item, i) => <ItemRow key={String(item.id)} item={item} last={i === items.length - 1} />)}
    </View>
  );
}
