/**
 * One interlocked macro row for H-15.
 *
 * The wireframe draws a slider. This is a track plus −/+ steps and a directly
 * editable gram field, which does the same job without pulling in a gesture
 * slider dependency — and is the only version of the control a screen reader
 * and a Maestro flow can both drive.
 */
import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from '@/ui';
import { radius, space, useTheme } from '@/theme';

const STEP_PCT = 5;

export function MacroRow({
  label, pct, grams, onPct, onGrams, testID,
}: {
  label: string;
  pct: number;
  grams: number;
  onPct: (next: number) => void;
  onGrams: (next: number) => void;
  testID: string;
}) {
  const { c } = useTheme();

  const step = (delta: number) => (
    <Pressable
      onPress={() => onPct(pct + delta)}
      accessibilityRole="button"
      accessibilityLabel={`${delta > 0 ? 'Increase' : 'Decrease'} ${label}`}
      testID={`${testID}-${delta > 0 ? 'up' : 'down'}`}
      hitSlop={8}
      style={{
        width: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center',
        borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
      }}
    >
      <Text variant="title" tone="ink2">{delta > 0 ? '+' : '−'}</Text>
    </Pressable>
  );

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Text variant="label" style={{ flex: 1 }}>{label}</Text>
        <Text variant="stat" testID={`${testID}-pct`}>{pct}%</Text>
      </View>

      <View
        accessibilityLabel={`${label}, ${pct} percent, ${grams} grams`}
        style={{
          height: 8, borderRadius: 4, backgroundColor: c.sunken,
          borderWidth: 1, borderColor: c.line, overflow: 'hidden',
        }}
      >
        <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', backgroundColor: c.accent }} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        {step(-STEP_PCT)}
        {step(STEP_PCT)}
        <TextInput
          value={String(grams)}
          onChangeText={(v) => {
            const n = Number(v);
            if (Number.isFinite(n) && v.trim() !== '') onGrams(Math.max(0, Math.round(n)));
          }}
          keyboardType="number-pad"
          accessibilityLabel={`${label} in grams`}
          testID={`${testID}-grams`}
          style={{
            flex: 1, minHeight: 40, textAlign: 'right', borderRadius: radius.btn,
            borderWidth: 1, borderColor: c.line2, paddingHorizontal: space.md,
            color: c.ink, backgroundColor: c.sunken,
          }}
        />
        <Text variant="body" tone="ink3">g</Text>
      </View>
    </View>
  );
}
