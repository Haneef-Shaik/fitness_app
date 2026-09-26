/**
 * H-05's two supporting pieces: the portion presets and "Details & source".
 *
 * **Presets are grams, labelled.** "1 katori (small bowl) · 150 g" fills the
 * gram field; it never becomes a second unit. The food stays per 100 g and the
 * item stores grams, so a preset can be corrected later without touching
 * anything already logged — and the number the person confirms is the number
 * they can see.
 *
 * **The source is shown because the data asks to be.** USDA FoodData Central
 * is public domain but asks to be named, and a curated Indian dish is only as
 * trustworthy as the record or recipe it cites. Both live one tap away.
 */
import { useState } from 'react';
import { View } from 'react-native';
import type { Food } from '@fitlog/api-types';
import { Button, Card, Text } from '@/ui';
import { grams } from '@/features/nutrition/format';
import { space } from '@/theme';

interface Preset {
  label: string;
  grams: number;
}

/** The food's portions, or its single legacy serving when it has none. */
export function presetsFor(food: Pick<Food, 'portions' | 'serving_label' | 'serving_grams'>): Preset[] {
  if (food.portions && food.portions.length > 0) return food.portions;
  if (food.serving_label && food.serving_grams) {
    return [{ label: food.serving_label, grams: food.serving_grams }];
  }
  return [];
}

export function PortionPresets({ food, onPick }: {
  food: Pick<Food, 'portions' | 'serving_label' | 'serving_grams'>;
  onPick: (grams: number) => void;
}) {
  const presets = presetsFor(food);
  if (presets.length === 0) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm }}>
      {presets.map((p, i) => (
        <Button
          key={`${p.label}-${i}`}
          testID={`portion-preset-${i}`}
          title={`${p.label} · ${grams(p.grams)}`}
          accessibilityLabel={`${p.label}, ${grams(p.grams)}`}
          kind="ghost"
          size="sm"
          onPress={() => onPick(p.grams)}
        />
      ))}
    </View>
  );
}

function milligrams(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : `${Math.round(v)} mg`;
}

export function SourceDetails({ food }: {
  food: Pick<Food, 'fiber_g' | 'sugar_g' | 'saturated_fat_g' | 'sodium_mg'
    | 'attribution' | 'source_note' | 'is_custom'>;
}) {
  const [open, setOpen] = useState(false);
  const rows: [string, string][] = [
    ['Fiber', grams(food.fiber_g)],
    ['Sugar', grams(food.sugar_g)],
    ['Saturated fat', grams(food.saturated_fat_g)],
    ['Sodium', milligrams(food.sodium_mg)],
  ];
  return (
    <View>
      <Button
        title={open ? 'Hide details & source' : 'Details & source'}
        kind="ghost"
        size="sm"
        testID="food-details-toggle"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
      />
      {open ? (
        <Card testID="food-details" style={{ marginTop: space.sm }}>
          <View style={{ gap: space.sm }}>
            <Text variant="label" tone="ink3">Per 100 g</Text>
            {rows.map(([name, value]) => (
              <View
                key={name}
                accessible
                accessibilityLabel={`${name}, ${value}`}
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}
              >
                <Text variant="caption">{name}</Text>
                <Text variant="caption">{value}</Text>
              </View>
            ))}
            <Text variant="label" tone="ink3" style={{ marginTop: space.sm }}>Source</Text>
            <Text variant="caption" testID="food-source">
              {food.is_custom ? 'Your own food — the numbers are the ones you entered.'
                : food.attribution ?? 'FitLog catalog.'}
            </Text>
            {food.source_note ? (
              <Text variant="caption" tone="ink3" testID="food-source-note">
                {food.source_note}
              </Text>
            ) : null}
          </View>
        </Card>
      ) : null}
    </View>
  );
}
