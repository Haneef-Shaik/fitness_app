/**
 * H-01 · Nutrition Diary — the day: totals, remaining, meals.
 *
 * **AC-07's surface.** Logging a meal moves these numbers, on the user's local
 * date, with no refresh.
 *
 * Only confirmed items are in the totals (**I2 / D5**) — the server enforces
 * that in one place. Pending items are shown as a count, because hiding them
 * would be as wrong as counting them.
 */
import { router } from 'expo-router';
import { View } from 'react-native';
import { Pressable } from '@/ui/Pressable';
import type { Meal, MealCategory } from '@fitlog/api-types';
import { Button, Card, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { Meter } from '@/ui/charts';
import { grams, kcal, macroLabel, mealTypeLabel, count } from '@/features/nutrition/format';
import { useMealCategories, useNutritionDay, useProfile } from '@/lib/query/hooks';
import { NavGroup, NavRow } from '@/ui/NavRow';
import { friendlyDate } from '@/features/dashboard/date';
import { space } from '@/theme';

export default function Diary() {
  const day = useNutritionDay();
  const profile = useProfile();
  // Labels come from the category list, never from the slug alone, so a rename
  // in H-16 shows up here without the diary knowing anything about it.
  const categories = useMealCategories();
  const profileTarget = profile.data?.daily_calorie_target ?? null;

  // The wireframes call this a tab root, and there is no tab bar yet — so
  // `back={false}` made it a dead end: reachable from B-01, with no way home
  // except the hardware button, which on this phone exits the app from a root.
  // Found on a device in G10; it cost AC-11 a run.
  return (
    <ScreenScaffold
      root
      title="Nutrition"
      action={{ label: '+ Food', onPress: () => router.push('/nutrition/add') }}
      onRefresh={() => { void day.refetch(); }}
    >
      <DataBoundary
        query={day}
        isEmpty={() => false}
        empty={{ title: 'Nothing logged yet' }}
      >
        {(data) => {
          // The target in force ON THIS DAY (Q8): a later change does not rewrite it.
          const target = data.targets !== undefined ? (data.targets?.calories ?? null) : profileTarget;
          return (
          <View style={{ gap: space.lg }}>
            <Card hero>
              <Pill>{friendlyDate(data.local_date)}</Pill>
              <View
                accessible
                accessibilityLabel={`${kcal(data.calories)} kilocalories eaten`}
                style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8 }}
              >
                <Text variant="display" style={{ fontSize: 34 }}>{kcal(data.calories)}</Text>
                <Text variant="caption" tone="ink3">kcal</Text>
              </View>
              {target ? (
                <View style={{ marginTop: space.base }}>
                  <Meter
                    testID="calorie-meter"
                    label={`${kcal(Math.max(0, target - data.calories))} left`}
                    value={Math.min(1, data.calories / target)}
                  />
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: space.lg, marginTop: space.base }}>
                <Macro label="Protein" value={data.protein_g} />
                <Macro label="Carbs" value={data.carbs_g} />
                <Macro label="Fat" value={data.fat_g} />
              </View>

              {data.pending_count > 0 ? (
                // Shown, and in no total. Hiding it would be as wrong as counting it.
                <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
                  {data.pending_count} item{data.pending_count === 1 ? '' : 's'} waiting to be
                  confirmed — not counted yet.
                </Text>
              ) : null}
              {data.incomplete ? (
                <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                  Some items are missing macros, so this total is a floor.
                </Text>
              ) : null}
            </Card>

            {data.meals.length === 0 ? (
              <Card>
                <Text variant="body">Nothing logged today</Text>
                <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                  Add your first meal and the numbers above move straight away.
                </Text>
                <Button
                  title="Add food"
                  style={{ marginTop: space.base }}
                  onPress={() => router.push('/nutrition/add')}
                />
              </Card>
            ) : (
              data.meals.map((meal) => (
                <MealRow key={String(meal.id)} meal={meal} categories={categories.data} />
              ))
            )}

            {/* The rest of the nutrition surface. Kept at the bottom because the
                day is what this screen is for; everything here is management. */}
            <NavGroup>
              <NavRow icon="stats-chart-outline" label="Analytics" testID="go-nutrition-analytics"
                onPress={() => router.push('/nutrition/analytics')} />
              <NavRow icon="book-outline" label="Recipes" testID="go-recipes"
                onPress={() => router.push('/nutrition/recipes')} />
              <NavRow icon="flame-outline" label="Targets" testID="go-targets"
                onPress={() => router.push('/nutrition/targets')} />
              <NavRow icon="pricetags-outline" label="Meal categories" testID="go-categories"
                onPress={() => router.push('/nutrition/categories')} />
              <NavRow icon="sparkles-outline" label="Food analyses" testID="go-analyses"
                onPress={() => router.push('/nutrition/analyses')} />
              {data.meals.length > 0 ? (
                <NavRow icon="copy-outline" label="Copy this day" testID="go-copy-day"
                  onPress={() => router.push(`/nutrition/copy?date=${data.local_date}`)} />
              ) : null}
            </NavGroup>
          </View>
          );
        }}
      </DataBoundary>
    </ScreenScaffold>
  );
}

function Macro({ label, value }: { label: string; value: number }) {
  return (
    <View accessible accessibilityLabel={macroLabel(label, value)}>
      <Text variant="label" tone="ink3">{label}</Text>
      <Text variant="body">{grams(value)}</Text>
    </View>
  );
}

function MealRow({ meal, categories }: { meal: Meal; categories?: MealCategory[] }) {
  const items = meal.items ?? [];
  const total = items
    .filter((i) => i.confirmed)
    .reduce((n, i) => n + (i.calories ?? 0), 0);

  return (
    <Pressable
      onPress={() => router.push(`/nutrition/meal/${meal.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${mealTypeLabel(meal.meal_type, categories)}, ${kcal(total)} kcal, ${count(items.length, 'item')}`}
    >
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="body">{mealTypeLabel(meal.meal_type, categories)}</Text>
            <Text variant="caption" tone="ink3" numberOfLines={1}>
              {items.map((i) => i.display_name).join(' · ') || 'Nothing in this meal'}
            </Text>
          </View>
          <Text variant="body" tone="ink2">{kcal(total)}</Text>
        </View>
      </Card>
    </Pressable>
  );
}
