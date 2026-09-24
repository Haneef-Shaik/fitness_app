/**
 * The onboarding steps that turn the answers into a plan: the target review
 * (A-08), the program pick (A-09) and the summary (A-10).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { EnergyPlan } from '@volt/domain';
import { Card, Text } from '@/ui';
import { Pressable } from '@/ui/Pressable';
import { DataBoundary } from '@/ui/DataBoundary';
import { ProgramCard } from '@/features/programs/ProgramCard';
import { useProgramTemplates } from '@/lib/query/hooks';
import { font, radius, space, useTheme } from '@/theme';

const fmt = (n: number) => Math.round(n).toLocaleString('en-GB');

export function TargetsStep({ plan }: { plan: EnergyPlan | null }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  if (!plan) {
    return (
      <Text variant="body" tone="ink2" testID="targets-none">
        We need your current weight to suggest a target. Go back and add it, or skip — you can set targets
        yourself later in Nutrition.
      </Text>
    );
  }
  const macro = (label: string, grams: number, kcalPerG: number) => {
    const pct = Math.round((grams * kcalPerG * 100) / plan.calories);
    return (
      <View key={label} style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="body">{label}</Text>
          <Text variant="body" tone="ink2">{grams} g · {pct}%</Text>
        </View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: c.line }}>
          <View style={{ height: 6, borderRadius: 3, width: `${Math.min(100, pct)}%`, backgroundColor: c.accent }} />
        </View>
      </View>
    );
  };
  return (
    <>
      {/* ✦ and a dashed border: this is an estimate (00 §3.7), not a measurement. */}
      <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.line2, borderRadius: radius.card, padding: space.lg, gap: space.base }}>
        <Text variant="caption" tone="ink3">✦ Estimated from your answers</Text>
        <View style={{ alignItems: 'center' }}>
          <Text variant="hero" style={{ fontSize: 44 }} testID="targets-kcal">{fmt(plan.calories)}</Text>
          <Text variant="caption" tone="ink3">kcal a day</Text>
        </View>
        {/* The two numbers the target is made of, before the detail. */}
        <View style={{ flexDirection: 'row', borderRadius: radius.btn, backgroundColor: c.sunken, paddingVertical: space.sm }}>
          <Stat label="To maintain" value={fmt(plan.maintenance)} />
          <View style={{ width: 1, backgroundColor: c.line }} />
          <Stat
            label={plan.adjustment < 0 ? 'Deficit' : plan.adjustment > 0 ? 'Surplus' : 'Adjustment'}
            value={plan.adjustment === 0 ? '0' : `${plan.adjustment < 0 ? '−' : '+'}${fmt(Math.abs(plan.adjustment))}`}
          />
        </View>
        {macro('Protein', plan.proteinG, 4)}
        {macro('Carbs', plan.carbsG, 4)}
        {macro('Fat', plan.fatG, 9)}
      </View>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button"
        accessibilityState={{ expanded: open }} accessibilityLabel="How we got there"
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 44 }}>
        <Text variant="body" tone="accent">How we got there</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={c.accent} />
      </Pressable>
      {open ? (
        <View style={{ gap: space.sm, marginTop: -space.sm }} testID="targets-working">
          {plan.steps.map((s, n) => (
            <View key={s} style={{ flexDirection: 'row', gap: space.sm }}>
              <Text variant="caption" tone="accent" style={{ width: 16 }}>{n + 1}</Text>
              <Text variant="caption" tone="ink2" style={{ flex: 1 }}>{s}</Text>
            </View>
          ))}
          <Text variant="caption" tone="ink3">An estimate, not medical advice. Adjust it any time in Nutrition → Targets.</Text>
        </View>
      ) : null}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text variant="caption" tone="ink3">{label}</Text>
      <Text variant="body" style={{ fontFamily: font.dataSemi }}>{value}</Text>
    </View>
  );
}

export function ProgramStep({ chosen, onChoose }: { chosen: string | null; onChoose: (key: string | null) => void }) {
  const templates = useProgramTemplates();
  const [all, setAll] = useState(false);
  return (
    <DataBoundary query={templates} empty={{ title: 'No programs available' }}>
      {(rows) => {
        const shown = all ? rows : rows.filter((r) => r.fits).slice(0, 3);
        return (
          <View style={{ gap: space.sm }}>
            {shown.map((t) => (
              <ProgramCard key={t.key} t={t} on={chosen === t.key} onPress={() => onChoose(chosen === t.key ? null : t.key)} />
            ))}
            {!all && rows.length > shown.length ? (
              <Pressable onPress={() => setAll(true)} accessibilityRole="button" accessibilityLabel="Show every program"
                style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text variant="body" tone="accent">Show all {rows.length} programs</Text>
              </Pressable>
            ) : null}
            <Text variant="caption" tone="ink3">
              It becomes your own copy — rename days, swap exercises, change sets. Or skip and build one later.
            </Text>
          </View>
        );
      }}
    </DataBoundary>
  );
}

export function DoneStep({ lines }: { lines: string[] }) {
  const { c } = useTheme();
  return (
    <Card>
      <View style={{ alignItems: 'center', marginBottom: space.base }}>
        <Ionicons name="checkmark-circle" size={48} color={c.good} />
      </View>
      <View style={{ gap: space.sm }}>
        {lines.map((l) => (
          <View key={l} style={{ flexDirection: 'row', gap: space.sm }}>
            <Text variant="body" tone="ink3">•</Text>
            <Text variant="body" style={{ flex: 1 }}>{l}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
