/**
 * B-01 · the nutrition card: what is left today, the macros against their
 * targets, and what is still waiting to be confirmed (I12: visible, and in no
 * total).
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { NutritionCard as NutritionCardData } from '@fitlog/api-types';
import { Button, Card, Meter, Pill, Text } from '@/ui';
import { count, kcal } from '@/features/nutrition/format';
import { MacroTrio } from '@/features/nutrition/MacroTrio';
import { space } from '@/theme';

export function NutritionCard({ card }: { card: NutritionCardData }) {
  const target = card.targets?.calories ?? null;
  const remaining = target === null ? null : target - card.calories;
  const over = remaining !== null && remaining < 0;
  const pct = target ? Math.round((Math.max(0, remaining ?? 0) / target) * 100) : null;

  return (
    <Card
      hero
      label="Today's nutrition"
      right={target !== null ? (
        <Text variant="caption" tone="ink3">{kcal(card.calories)} / {kcal(target)} kcal</Text>
      ) : null}
    >
      {target !== null && remaining !== null ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <View
              accessible
              accessibilityLabel={over
                ? `${kcal(-remaining)} kilocalories over your target`
                : `${kcal(remaining)} kilocalories left, ${kcal(card.calories)} of ${kcal(target)} eaten`}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 }}
            >
              <Text variant="display" testID="kcal-remaining">{kcal(Math.abs(remaining))}</Text>
              <Text variant="body" tone={over ? 'serious' : 'accent'} weight="semi">{over ? 'kcal over' : 'kcal left'}</Text>
            </View>
            {pct !== null ? (
              <Pill kind={over ? 'serious' : 'good'}>{over ? 'Over target' : `${pct}% left`}</Pill>
            ) : null}
          </View>
          <View style={{ marginTop: space.md }}>
            <Meter value={card.calories} max={target} over={over} />
          </View>
        </>
      ) : (
        <>
          <View
            accessible
            accessibilityLabel={`${kcal(card.calories)} kilocalories eaten, no target set`}
            style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}
          >
            <Text variant="display">{kcal(card.calories)}</Text>
            <Text variant="body" tone="ink3" weight="semi">kcal eaten</Text>
          </View>
          {/* No invented target, and no meter drawn against nothing. */}
          <Text variant="caption" tone="ink2" testID="no-target" style={{ marginTop: space.xs }}>
            No target set yet — set one and this shows what's left.
          </Text>
        </>
      )}

      <View style={{ marginTop: space.md }}>
        <MacroTrio
          protein={card.protein_g} carbs={card.carbs_g} fat={card.fat_g}
          targets={card.targets}
        />
      </View>

      {card.pending_count > 0 ? (
        // Visible, and in no total. I12 — the preview IS the bug.
        <Text variant="caption" tone="accent" style={{ marginTop: space.md }} testID="pending">
          ✦ {count(card.pending_count, 'item')} waiting to be confirmed — not counted yet.
        </Text>
      ) : null}
      {card.incomplete ? (
        <Text variant="caption" tone="ink3" style={{ marginTop: space.xs }}>
          Some items are missing macros, so this total is a floor.
        </Text>
      ) : null}
      {card.meals_logged === 0 ? (
        <Text variant="caption" tone="ink3" style={{ marginTop: space.md }} testID="nutrition-empty">
          Nothing logged today.
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.base }}>
        <Button
          title="Log a meal" icon="add" kind="secondary" size="sm" style={{ flex: 1 }}
          testID="go-nutrition" onPress={() => router.push('/nutrition')}
        />
        {target === null ? (
          <Button
            title="Set a target" icon="flag-outline" kind="secondary" size="sm" style={{ flex: 1 }}
            testID="go-targets" onPress={() => router.push('/nutrition/targets')}
          />
        ) : (
          <Button
            title="Describe a meal" icon="sparkles-outline" kind="secondary" size="sm" style={{ flex: 1 }}
            testID="go-describe" onPress={() => router.push('/nutrition/describe')}
          />
        )}
      </View>
    </Card>
  );
}
