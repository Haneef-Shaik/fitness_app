/**
 * H-08 · Check this before saving — **AC-09 and AC-10**.
 *
 * This is where BRD §12.7 ("the user reviews and corrects") becomes real, and
 * where three rules meet:
 *
 * **Nothing here has moved a total.** Every item is a proposal until it is
 * saved, and the dashed border, the "Est." chip and the accessible name all say
 * so (**I12**).
 *
 * **Confidence is not permission.** A low-confidence item starts unchecked; a
 * high-confidence one is still only *checked*, never saved on its own. Q7 is
 * answered — no auto-confirmation, at any threshold.
 *
 * **Saving leaves the analysis alone.** The correction goes to `meal_items`;
 * `food_analysis_items` is append-only at the database level, so what the model
 * said survives byte for byte (**AC-10**).
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import type { ConfirmItemIn, FoodAnalysis } from '@volt/api-types';
import { Button, Card, Text } from '@/ui';
import { Choice } from '@/ui/Choice';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { AnalysisItemCard, type Draft, draftFor } from '@/features/nutrition/AnalysisItemCard';
import { useCategoryOptions } from '@/features/nutrition/useCategoryOptions';
import { grams, kcal } from '@/features/nutrition/format';
import { useAnalysis, useConfirmAnalysis } from '@/lib/query/hooks';
import { space } from '@/theme';

/** H-07's error table, as sentences. A user never sees a code. */
const FAILURE_MESSAGE: Record<string, string> = {
  ai_unavailable: 'The service did not respond. Your meal has not changed.',
  ai_invalid_output: 'We got a result we could not read. Your meal has not changed.',
  image_unreadable: 'That image was too blurry or dark to read.',
  no_food_detected: 'We could not find any food in that photo.',
  quota_exceeded: 'You have used all of today’s analyses.',
};

export default function AnalysisReview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useAnalysis(id ?? '');
  const confirm = useConfirmAnalysis();
  const { options } = useCategoryOptions();

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [mealType, setMealType] = useState('lunch');
  const [error, setError] = useState<string | null>(null);

  // Seed one draft per item, once, when the analysis lands.
  useEffect(() => {
    const items = query.data?.items ?? [];
    if (items.length === 0) return;
    setDrafts((current) => {
      const next = { ...current };
      for (const item of items) {
        if (!(String(item.id) in next)) next[String(item.id)] = draftFor(item);
      }
      return next;
    });
  }, [query.data]);

  useEffect(() => {
    if (options.length > 0 && !options.some((o) => o.value === mealType)) {
      setMealType(options[0]!.value);
    }
  }, [options, mealType]);

  const selectedTotal = useMemo(() => totalOf(query.data, drafts), [query.data, drafts]);
  const chosen = (query.data?.items ?? []).filter((i) => drafts[String(i.id)]?.include);

  return (
    <ScreenScaffold title="Check this before saving">
      <DataBoundary
        query={query}
        isEmpty={(a) => !a}
        empty={{ title: 'That analysis no longer exists.' }}
      >
        {(analysis) => {
          if (analysis.status === 'pending' || analysis.status === 'processing') {
            return <Working analysis={analysis} />;
          }
          if (analysis.status === 'failed') {
            return <Failed analysis={analysis} />;
          }

          return (
            <View style={{ gap: space.lg }}>
              {analysis.source_text ? (
                <Card>
                  <Text variant="label">You wrote</Text>
                  <Text variant="body" style={{ marginTop: 4 }}>{analysis.source_text}</Text>
                </Card>
              ) : null}

              {analysis.items.length === 0 ? (
                <Card>
                  <Text variant="body" testID="analysis-no-items">
                    We could not pick out any foods.
                  </Text>
                  <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                    Try including amounts, like &ldquo;2 eggs&rdquo;. What you wrote is
                    still above.
                  </Text>
                  <Button
                    title="Add it manually"
                    kind="ghost"
                    size="sm"
                    style={{ marginTop: space.sm }}
                    testID="analysis-manual"
                    onPress={() => router.replace('/nutrition/add')}
                  />
                </Card>
              ) : (
                analysis.items.map((item) => {
                  const key = String(item.id);
                  const draft = drafts[key];
                  if (!draft) return null;
                  return (
                    <AnalysisItemCard
                      key={key}
                      testID={`analysis-item-${key}`}
                      item={item}
                      draft={draft}
                      onChange={(next) => setDrafts((d) => ({ ...d, [key]: next }))}
                    />
                  );
                })
              )}

              {analysis.items.length > 0 ? (
                <>
                  <View>
                    <Text variant="label" style={{ marginBottom: space.sm }}>Add to</Text>
                    <Choice
                      testID="analysis-meal-type"
                      value={mealType}
                      onChange={setMealType}
                      options={options}
                    />
                  </View>

                  <Card>
                    <Text variant="label">Selected total</Text>
                    <Text variant="display" style={{ fontSize: 28, marginTop: 4 }}>
                      {kcal(selectedTotal.calories)} kcal
                    </Text>
                    <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                      P {grams(selectedTotal.protein)} · C {grams(selectedTotal.carbs)} ·
                      {' '}F {grams(selectedTotal.fat)}
                    </Text>
                  </Card>

                  <Card>
                    {/* Required on the screen, not in a tooltip. The single most
                        important sentence in the product for keeping the AI
                        honest (BRD §13, Risk R1). */}
                    <Text variant="caption" tone="ink3" testID="analysis-confidence-note">
                      Confidence is how sure we are we spotted the food — not how accurate
                      the calories are. Check the amounts.
                    </Text>
                  </Card>
                </>
              ) : null}

              {error ? (
                <Text variant="caption" tone="crit" testID="analysis-error">{error}</Text>
              ) : null}

              <Button
                title={
                  chosen.length === 0
                    ? 'Check at least one item'
                    : `Save ${chosen.length} item${chosen.length === 1 ? '' : 's'}`
                }
                disabled={chosen.length === 0 || confirm.isPending}
                testID="analysis-save"
                onPress={async () => {
                  setError(null);
                  try {
                    await confirm.mutateAsync({
                      id: String(analysis.id),
                      body: {
                        meal_type: mealType,
                        consumed_at: null,
                        client_id: null,
                        items: (analysis.items ?? []).map((item) =>
                          payloadFor(item.id, drafts[String(item.id)]!),
                        ),
                      },
                    });
                    router.replace('/nutrition');
                  } catch (e) {
                    setError(
                      e instanceof Error && e.message
                        ? e.message
                        : 'That did not save. Nothing has been logged.',
                    );
                  }
                }}
              />
            </View>
          );
        }}
      </DataBoundary>
    </ScreenScaffold>
  );
}

/**
 * Only fields the user actually typed are sent.
 *
 * The server decides `user_corrected` by comparing what arrives against the
 * analysis row, so sending a value the user did not enter would claim a
 * correction they never made.
 */
function payloadFor(itemId: string, draft: Draft): ConfirmItemIn {
  const num = (v: string) => {
    const n = Number(v);
    return v.trim() !== '' && Number.isFinite(n) ? n : null;
  };
  return {
    analysis_item_id: itemId,
    include: draft.include,
    display_name: null,
    food_id: null,
    quantity_grams: num(draft.quantityGrams),
    calories: num(draft.calories),
    protein_g: num(draft.proteinG),
    carbs_g: num(draft.carbsG),
    fat_g: num(draft.fatG),
  };
}

function totalOf(analysis: FoodAnalysis | undefined, drafts: Record<string, Draft>) {
  const zero = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  if (!analysis) return zero;

  return (analysis.items ?? []).reduce((sum, item) => {
    const draft = drafts[String(item.id)];
    if (!draft?.include) return sum;

    const typedGrams = Number(draft.quantityGrams);
    const proposed = item.estimated_quantity;
    const scale = Number.isFinite(typedGrams) && proposed ? typedGrams / proposed : 1;
    const pick = (typed: string, fallback: number | null | undefined) =>
      Number(typed) || (fallback ?? 0) * scale;

    return {
      calories: sum.calories + pick(draft.calories, item.proposed_calories),
      protein: sum.protein + pick(draft.proteinG, item.proposed_protein_g),
      carbs: sum.carbs + pick(draft.carbsG, item.proposed_carbs_g),
      fat: sum.fat + pick(draft.fatG, item.proposed_fat_g),
    };
  }, zero);
}

/** H-07, inline. Dismissible from the first second — the job runs regardless. */
function Working({ analysis }: { analysis: FoodAnalysis }) {
  return (
    <View style={{ gap: space.lg }}>
      <Card>
        <Text variant="title">Working out what&apos;s in there…</Text>
        <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
          Usually about 10 seconds. {analysis.input_type === 'image' ? 'Photo' : 'Text'} received.
        </Text>
      </Card>
      <Button
        title="Do something else — we'll keep going"
        kind="ghost"
        testID="analysis-dismiss"
        onPress={() => router.replace('/nutrition')}
      />
    </View>
  );
}

function Failed({ analysis }: { analysis: FoodAnalysis }) {
  const message =
    FAILURE_MESSAGE[analysis.error_code ?? ''] ?? 'That did not work. Your meal has not changed.';

  return (
    <View style={{ gap: space.lg }}>
      <Card>
        <Text variant="title">We couldn&apos;t analyse that</Text>
        <Text variant="body" style={{ marginTop: space.sm }} testID="analysis-failure">
          {message}
        </Text>
        {/* Every failure leaves the meal intact, and says so. */}
        <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
          Nothing has been logged.
        </Text>
      </Card>
      <Button
        title="Enter it manually"
        testID="analysis-failed-manual"
        onPress={() => router.replace('/nutrition/add')}
      />
      <Button
        title="Try again"
        kind="ghost"
        testID="analysis-retry"
        onPress={() => router.replace(
          analysis.input_type === 'image' ? '/nutrition/photo' : '/nutrition/describe',
        )}
      />
    </View>
  );
}
