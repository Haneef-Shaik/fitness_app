/**
 * H-01 · Nutrition Diary — the day: what is left, the macros, the meals.
 *
 * **AC-07's surface.** Logging a meal moves these numbers, on the user's local
 * date, with no refresh.
 *
 * Only confirmed items are in the totals (**I2 / D5**) — the server enforces
 * that in one place. Pending items are shown as a count, because hiding them
 * would be as wrong as counting them; here they get a banner with a way to
 * go and check them.
 */
import { router } from 'expo-router';
import { View } from 'react-native';
import type { Meal } from '@fitlog/api-types';
import { Button, Card, Meter, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { EmptyState } from '@/ui/EmptyState';
import { IconTile } from '@/ui/IconTile';
import { NavGroup, NavRow } from '@/ui/NavRow';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { SectionHeader } from '@/ui/SectionHeader';
import { count, kcal } from '@/features/nutrition/format';
import { MacroTrio, type MacroTargets } from '@/features/nutrition/MacroTrio';
import { MealSection } from '@/features/nutrition/MealSection';
import { useMealCategories, useNutritionDay, useProfile } from '@/lib/query/hooks';
import { friendlyDate } from '@/features/dashboard/date';
import { CoachPrompt } from '@/features/coach/CoachPrompt';
import { space } from '@/theme';

/** The meal holding the first unconfirmed item — where "Review" goes. */
function firstPending(meals: readonly Meal[]): Meal | undefined {
  return meals.find((m) => (m.items ?? []).some((i) => !i.confirmed));
}

export default function Diary() {
  const day = useNutritionDay();
  const profile = useProfile();
  // Labels come from the category list, never from the slug alone, so a rename
  // in H-16 shows up here without the diary knowing anything about it.
  const categories = useMealCategories();
  const p = profile.data;
  const profileTargets: MacroTargets & { calories: number | null } = {
    calories: p?.daily_calorie_target ?? null,
    protein_g: p?.protein_g_target ?? null, carbs_g: p?.carbs_g_target ?? null, fat_g: p?.fat_g_target ?? null,
  };

  return (
    <ScreenScaffold
      root
      title="Nutrition"
      onRefresh={() => { void day.refetch(); }}
      footer={
        <Button title="Add food" icon="add" size="lg" testID="add-food" onPress={() => router.push('/nutrition/add')} />
      }
    >
      <DataBoundary
        query={day}
        isEmpty={() => false}
        empty={{ title: 'Nothing logged yet' }}
      >
        {(data) => {
          // The target in force ON THIS DAY (Q8): a later change does not rewrite it.
          const targets = data.targets !== undefined ? data.targets : profileTargets;
          const target = targets?.calories ?? null;
          const left = target === null ? null : target - data.calories;
          const over = left !== null && left < 0;
          const pending = firstPending(data.meals);
          return (
            <View style={{ gap: space.base }}>
              <Card hero label="Energy budget" right={<Pill>{friendlyDate(data.local_date)}</Pill>}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm }}>
                  <View
                    accessible
                    accessibilityLabel={left === null
                      ? `${kcal(data.calories)} kilocalories eaten, no target set`
                      : over
                        ? `${kcal(-left)} kilocalories over your target`
                        : `${kcal(left)} kilocalories left, ${kcal(data.calories)} of ${kcal(target)} eaten`}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 }}
                  >
                    <Text variant="display" testID="kcal-left">{kcal(left === null ? data.calories : Math.abs(left))}</Text>
                    <Text variant="body" weight="semi" tone={left === null ? 'ink3' : over ? 'serious' : 'accent'}>
                      {left === null ? 'kcal eaten' : over ? 'kcal over' : 'kcal left'}
                    </Text>
                  </View>
                  {target !== null ? (
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, paddingBottom: 4 }}>
                      <Text variant="caption" tone="ink3">{kcal(data.calories)}</Text>
                      <Text variant="caption" tone="ink3">/ {kcal(target)} kcal</Text>
                    </View>
                  ) : null}
                </View>
                {target !== null ? (
                  <View testID="calorie-meter" style={{ marginTop: space.md }}>
                    <Meter value={data.calories} max={target} over={over} />
                  </View>
                ) : (
                  <Text variant="caption" tone="ink2" style={{ marginTop: space.xs }}>
                    No target set yet — set one below and this shows what's left.
                  </Text>
                )}
                <View style={{ marginTop: space.md }}>
                  <MacroTrio protein={data.protein_g} carbs={data.carbs_g} fat={data.fat_g} targets={targets} compact />
                </View>
                {data.incomplete ? (
                  <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
                    Some items are missing macros, so this total is a floor.
                  </Text>
                ) : null}
              </Card>

              <CoachPrompt
                title="Close the loop on your next meal"
                body="Describe it or take a photo and the coach will return an estimate for you to check before it counts."
                detail="AI estimates stay pending until you confirm them."
                badgeLabel="Pro AI"
                actionLabel="Add with coach"
                onAction={() => router.push('/nutrition/add')}
                testID="nutrition-coach-prompt"
              />

              {data.pending_count > 0 ? (
                // Shown, and in no total. Hiding it would be as wrong as counting it.
                <Card accent style={{ borderStyle: 'dashed', borderWidth: 1.5 }} testID="pending-banner">
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                    <IconTile icon="sparkles-outline" size={40} tone="accent" bg="accentWash" />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text variant="body" weight="semi">Check {count(data.pending_count, 'estimated item')}</Text>
                      <Text variant="caption" tone="ink3">
                        {count(data.pending_count, 'item')} waiting to be confirmed — not counted yet.
                      </Text>
                    </View>
                    <Button
                      title="Review" size="sm" testID="review-pending"
                      onPress={() => router.push(pending ? `/nutrition/meal/${pending.id}` : '/nutrition/analyses')}
                    />
                  </View>
                </Card>
              ) : null}

              {data.meals.length === 0 ? (
                <Card>
                  <EmptyState
                    compact
                    icon="restaurant-outline"
                    title="Nothing logged today"
                    body="Add your first meal and the numbers above move straight away."
                  />
                </Card>
              ) : (
                data.meals.map((meal) => (
                  <MealSection key={String(meal.id)} meal={meal} categories={categories.data} />
                ))
              )}

              {/* The rest of the nutrition surface. Kept at the bottom because the
                  day is what this screen is for; everything here is management. */}
              <View>
                <SectionHeader title="More" />
                <NavGroup>
                  <NavRow icon="stats-chart-outline" label="Analytics" hint="Week and month, against your targets" testID="go-nutrition-analytics"
                    onPress={() => router.push('/nutrition/analytics')} />
                  <NavRow icon="flag-outline" label="Targets" hint="Calories and macros" testID="go-targets"
                    onPress={() => router.push('/nutrition/targets')} />
                  <NavRow icon="book-outline" label="Recipes" hint="Meals you log again and again" testID="go-recipes"
                    onPress={() => router.push('/nutrition/recipes')} />
                  <NavRow icon="pricetags-outline" label="Meal categories" testID="go-categories"
                    onPress={() => router.push('/nutrition/categories')} />
                  <NavRow icon="sparkles-outline" label="Food analyses" hint="Every estimate, and what it became" testID="go-analyses"
                    onPress={() => router.push('/nutrition/analyses')} />
                  {data.meals.length > 0 ? (
                    <NavRow icon="copy-outline" label="Copy this day" testID="go-copy-day"
                      onPress={() => router.push(`/nutrition/copy?date=${data.local_date}`)} />
                  ) : null}
                </NavGroup>
              </View>
            </View>
          );
        }}
      </DataBoundary>
    </ScreenScaffold>
  );
}
