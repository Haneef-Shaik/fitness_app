/**
 * E-12 · Plate Calculator — what to put on each side for the load being entered.
 *
 * The bar and plates are the user's (K-04), in their unit: a lifter in pounds
 * loads 45s, and a calculator that answered in kilograms would be arithmetic
 * they have to redo at the rack. When the exact load cannot be made, it says
 * so and offers the nearest one rather than pretending.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { kgToLb, lbToKg } from '@fitlog/domain';
import { Button, Text } from '@/ui';
import { Chips } from '@/features/onboarding/ui';
import { Sheet } from '@/ui/Sheet';
import { radius, space, useTheme } from '@/theme';
import {
  IMPERIAL_BAR_LB, IMPERIAL_PLATES_LB, METRIC_BAR_KG, METRIC_PLATES_KG, platesFor,
} from '../plates';

export interface PlateCalculatorSheetProps {
  visible: boolean;
  loadKg: number | null;
  imperial: boolean;
  /** K-04 — metric only; an imperial user gets the standard pound set. */
  barKg?: number;
  platesKg?: readonly number[];
  onUse: (loadKg: number) => void;
  onClose: () => void;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function PlateCalculatorSheet({
  visible, loadKg, imperial, barKg, platesKg, onUse, onClose,
}: PlateCalculatorSheetProps) {
  const { c } = useTheme();
  const unit = imperial ? 'lb' : 'kg';
  const defaultBar = imperial ? IMPERIAL_BAR_LB : (barKg ?? METRIC_BAR_KG);
  const [bar, setBar] = useState<number>(defaultBar);
  const inventory = imperial ? IMPERIAL_PLATES_LB : (platesKg ?? METRIC_PLATES_KG);
  const bars = imperial ? [35, 45] : [10, 15, 20];

  const target = loadKg === null ? null : round(imperial ? kgToLb(loadKg) : loadKg);
  const result = useMemo(
    () => (target === null ? null : platesFor(target, bar, inventory)),
    [target, bar, inventory],
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="Plate calculator" testID="plate-sheet"
      footer={<Button title="Done" onPress={onClose} testID="plate-done" />}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
        {target === null ? (
          <Text variant="body" tone="ink2">Enter a load first, then open the calculator.</Text>
        ) : (
          <>
            <Text variant="title" testID="plate-target">Load {target} {unit}</Text>
            <View style={{ gap: space.sm }}>
              <Text variant="label">Bar</Text>
              <Chips
                testID="plate-bar"
                value={bar}
                onChange={setBar}
                options={[...new Set([...bars, defaultBar])].sort((a, b) => a - b)
                  .map((b) => ({ value: b, label: `${b}`, a11y: `${b} ${unit} bar` }))}
              />
            </View>

            {result ? (
              <View style={{ gap: space.md }}>
                <Text variant="label">Per side</Text>
                <Text variant="title" testID="plate-per-side"
                  accessibilityLabel={result.perSide.length
                    ? `Per side: ${result.perSide.join(', ')} ${unit}`
                    : 'No plates — just the bar'}>
                  {result.perSide.length ? result.perSide.join(' · ') : 'Just the bar'}
                </Text>
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 3, padding: space.sm,
                    borderRadius: radius.btn, backgroundColor: c.sunken,
                  }}
                >
                  {result.perSide.map((p, i) => (
                    <View
                      key={`${p}-${i}`}
                      style={{
                        width: 10, height: 24 + (p / Math.max(...inventory)) * 40,
                        borderRadius: 2, backgroundColor: c.accent,
                      }}
                    />
                  ))}
                  <View style={{ flex: 1, height: 6, backgroundColor: c.line2, marginLeft: 4 }} />
                </View>
                {result.exact ? (
                  <Text variant="caption" tone="good" testID="plate-exact">Exactly {result.achieved} {unit} ✓</Text>
                ) : (
                  <View style={{ gap: space.sm }}>
                    <Text variant="caption" tone="warn" testID="plate-closest">
                      {target} {unit} can't be made with these plates. Closest: {result.achieved} {unit}.
                    </Text>
                    <Button
                      title={`Use ${result.achieved} ${unit}`}
                      kind="ghost"
                      testID="plate-use"
                      onPress={() => onUse(round(imperial ? lbToKg(result.achieved) : result.achieved))}
                    />
                  </View>
                )}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </Sheet>
  );
}
