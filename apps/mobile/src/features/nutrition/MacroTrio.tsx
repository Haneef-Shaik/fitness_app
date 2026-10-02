/**
 * Protein · carbs · fat, each against its target, as three small panels with
 * a bar in the macro's own hue. The label and the figure wear ink, never the
 * series colour (docs/05 §3.5): the hue is on the bar and the dot only.
 *
 * Each panel is ONE screen-reader stop — three names then three figures read
 * in columns was G10's finding #29.
 */
import React from 'react';
import { View } from 'react-native';
import { Card, Text } from '@/ui';
import { grams, macroLabel } from '@/features/nutrition/format';
import { radius, space, useTheme, type Colors } from '@/theme';

export interface MacroTargets {
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
}

const MACROS: readonly { key: keyof MacroTargets; label: string; hue: keyof Colors }[] = [
  { key: 'protein_g', label: 'Protein', hue: 's1' },
  { key: 'carbs_g', label: 'Carbs', hue: 's2' },
  { key: 'fat_g', label: 'Fat', hue: 's3' },
];

export function MacroTrio({
  protein, carbs, fat, targets, compact = false,
}: { protein: number; carbs: number; fat: number; targets?: MacroTargets | null; compact?: boolean }) {
  const { c } = useTheme();
  const values = { protein_g: protein, carbs_g: carbs, fat_g: fat };
  return (
    <View style={{ flexDirection: 'row', gap: space.sm }}>
      {MACROS.map((m) => {
        const value = values[m.key];
        const target = targets?.[m.key] ?? null;
        const share = target ? Math.min(1, value / target) : null;
        return (
          <Card
            key={m.key}
            nested
            pad={compact ? 'sm' : 'md'}
            accessible
            accessibilityLabel={macroLabel(m.label, value, target)}
            style={{ flex: 1 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: radius.pill, backgroundColor: c[m.hue] }} />
              <Text variant="label" numberOfLines={1}>{m.label}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 4 }}>
              <Text variant="stat" style={{ fontSize: compact ? 18 : 20 }}>{grams(value).replace(' g', '')}</Text>
              <Text variant="caption" tone="ink3">{target ? `/ ${target} g` : 'g'}</Text>
            </View>
            {share !== null ? (
              <View style={{ height: 4, borderRadius: radius.pill, backgroundColor: c.line, marginTop: space.sm, overflow: 'hidden' }}>
                <View style={{ width: `${share * 100}%`, height: '100%', backgroundColor: c[m.hue] }} />
              </View>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}
