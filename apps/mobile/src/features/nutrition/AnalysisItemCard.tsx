/**
 * One reviewable item on H-08 — **AC-09** ("every field editable") and the
 * visible half of **I12**.
 *
 * The estimated treatment is a dashed border, an "Est." chip **and** the words
 * in the accessible name. The border alone would be the only cue for a sighted
 * user and no cue at all for anyone else, and 05 §3 is explicit that a
 * colour-or-border-only signal is not a signal.
 *
 * The confidence sentence on the parent screen matters more than any of this:
 * confidence is how sure the model is that it *spotted* the food, not how
 * accurate the calories are. Nothing here implies otherwise.
 */
import React from 'react';
import { View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import { Pressable } from '@/ui/Pressable';
import type { FoodAnalysisItem } from '@fitlog/api-types';
import { Pill, Text } from '@/ui';
import { grams, kcal } from './format';
import { radius, space, useTheme } from '@/theme';

export interface Draft {
  include: boolean;
  quantityGrams: string;
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
}

export function draftFor(item: FoodAnalysisItem): Draft {
  return {
    // N04.3 — a low-confidence item starts UNCHECKED. The server decides which
    // band it is in so every screen agrees.
    include: !item.low_confidence,
    quantityGrams: item.estimated_quantity === null ? '' : String(item.estimated_quantity),
    calories: '', proteinG: '', carbsG: '', fatG: '',
  };
}

/** Confidence as dots, because a bare percentage reads as precision. */
function dots(confidence: number | null | undefined): string {
  if (confidence === null || confidence === undefined) return '';
  const filled = Math.round(confidence * 10);
  return '●'.repeat(filled) + '○'.repeat(10 - filled);
}

export function AnalysisItemCard({
  item, draft, onChange, testID,
}: {
  item: FoodAnalysisItem;
  draft: Draft;
  onChange: (next: Draft) => void;
  testID: string;
}) {
  const { c } = useTheme();
  // The generated types make every optional field `| undefined` as well as
  // `| null`; normalising once here keeps the rest of the component readable.
  const confidence = item.confidence ?? null;

  // What this item will contribute, scaled if the quantity was edited.
  const typedGrams = Number(draft.quantityGrams);
  const proposedGrams = item.estimated_quantity;
  const scale =
    Number.isFinite(typedGrams) && proposedGrams ? typedGrams / proposedGrams : 1;
  const shown = {
    calories: Number(draft.calories) || (item.proposed_calories ?? 0) * scale,
    protein: Number(draft.proteinG) || (item.proposed_protein_g ?? 0) * scale,
    carbs: Number(draft.carbsG) || (item.proposed_carbs_g ?? 0) * scale,
    fat: Number(draft.fatG) || (item.proposed_fat_g ?? 0) * scale,
  };

  const field = (
    label: string, key: keyof Draft, placeholder: string, width?: number,
  ) => (
    <View style={{ width, flex: width ? undefined : 1 }}>
      <Text variant="caption" tone="ink3">{label}</Text>
      <TextInput
        value={String(draft[key])}
        onChangeText={(v) => onChange({ ...draft, [key]: v })}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={c.ink3}
        accessibilityLabel={`${item.detected_name}, ${label}`}
        testID={`${testID}-${key}`}
        style={{
          minHeight: 40, marginTop: 4, borderRadius: radius.btn, borderWidth: 1,
          borderColor: c.line2, paddingHorizontal: space.sm,
          color: c.ink, backgroundColor: c.sunken,
        }}
      />
    </View>
  );

  const accessibleName =
    `${item.detected_name}, ${draft.quantityGrams || '?'} grams, `
    + `${kcal(shown.calories)} kilocalories, `
    + (confidence === null ? '' : `${Math.round(confidence * 100)} percent confidence, `)
    // The words, not just the border (05 §3).
    + 'estimated, not yet confirmed, '
    + (draft.include ? 'selected' : 'not selected');

  return (
    <View
      testID={testID}
      accessibilityRole="none"
      accessibilityLabel={accessibleName}
      style={{
        borderRadius: radius.card, padding: space.base,
        borderWidth: 1, borderStyle: 'dashed', borderColor: c.line2,
        backgroundColor: c.surface, gap: space.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Pressable
          onPress={() => onChange({ ...draft, include: !draft.include })}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: draft.include }}
          accessibilityLabel={`Include ${item.detected_name}`}
          testID={`${testID}-include`}
          hitSlop={10}
          style={{
            width: 26, height: 26, borderRadius: 7, borderWidth: 1,
            alignItems: 'center', justifyContent: 'center',
            borderColor: draft.include ? c.accent : c.line2,
            backgroundColor: draft.include ? c.accent : 'transparent',
          }}
        >
          <Text variant="caption" style={{ color: draft.include ? c.accentInk : 'transparent' }}>
            ✓
          </Text>
        </Pressable>
        <Text variant="body" style={{ flex: 1 }} numberOfLines={2}>{item.detected_name}</Text>
        <Pill kind="mute">Est.</Pill>
      </View>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {field('Amount (g)', 'quantityGrams', '0', 110)}
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Text variant="stat">{kcal(shown.calories)}</Text>
          <Text variant="caption" tone="ink3">
            P {grams(shown.protein)} · C {grams(shown.carbs)} · F {grams(shown.fat)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {field('kcal', 'calories', kcal(shown.calories))}
        {field('P', 'proteinG', String(Math.round(shown.protein)))}
        {field('C', 'carbsG', String(Math.round(shown.carbs)))}
        {field('F', 'fatG', String(Math.round(shown.fat)))}
      </View>

      {confidence !== null ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Text variant="caption" tone="ink3" testID={`${testID}-confidence`}>
            {dots(confidence)} {Math.round(confidence * 100)}% confident
          </Text>
          {item.low_confidence ? (
            <Text variant="caption" tone="warn" testID={`${testID}-please-check`}>
              ⚠ please check
            </Text>
          ) : null}
        </View>
      ) : null}

      {item.resolved_food_id ? (
        <Text variant="caption" tone="ink3" testID={`${testID}-matched`}>
          ✓ matched to &ldquo;{item.resolved_food_name}&rdquo;
        </Text>
      ) : (
        // Ladder step 5. Saying so is what keeps the estimate honest.
        <Text variant="caption" tone="ink3" testID={`${testID}-unmatched`}>
          ⚠ no nutrition match — using our estimate
        </Text>
      )}
    </View>
  );
}
