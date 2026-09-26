/**
 * H-14 · Nutrition analytics — week, month, three months or a custom range
 * (N05.3–N05.5, built in G10; it was the one P0 screen of the nutrition
 * domain that did not exist).
 *
 * Three rules from the wireframe, each visible here:
 *   - averages are over LOGGED days, and the count is always beside them;
 *   - below three logged days the screen says "Not enough data yet" instead of
 *     drawing a noisy chart;
 *   - weight and intake are two charts on one time axis, never one chart with
 *     two y-axes (05 §3.4).
 */
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import type { NutritionRange } from '@fitlog/api-types';
import { Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { Column, Line } from '@/ui/charts';
import { useDashboard, useNutritionRange } from '@/lib/query/hooks';
import { Chips, TextField } from '@/features/onboarding/ui';
import { rangeFor, rangeLabel, validCustom, type RangeKind } from '@/features/nutrition/range';
import { count } from '@/features/nutrition/format';
import { font, radius, space, useTheme } from '@/theme';

const KINDS: readonly { value: RangeKind; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: '3 months' },
  { value: 'custom', label: 'Custom' },
];

const kcal = (n: number) => Math.round(n).toLocaleString('en-GB');

export default function NutritionAnalytics() {
  const today = useDashboard().data?.local_date;
  const [kind, setKind] = useState<RangeKind>('week');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [lastGood, setLastGood] = useState<{ from: string; to: string } | null>(null);

  const customError = kind === 'custom' && today && (from || to) ? validCustom(from, to, today) : null;
  const range = useMemo(() => {
    if (!today) return null;
    if (kind !== 'custom') return rangeFor(kind, today);
    if (from && to && !validCustom(from, to, today)) return { from, to };
    // Until the typed range is usable, keep showing the last one that was.
    return lastGood ?? rangeFor('week', today);
  }, [kind, from, to, today, lastGood]);

  const data = useNutritionRange(range ?? {});
  useEffect(() => {
    if (range) setLastGood((prev) => (prev?.from === range.from && prev.to === range.to ? prev : range));
  }, [range]);

  return (
    <ScreenScaffold title="Nutrition analytics" subtitle={range ? rangeLabel(range.from, range.to) : undefined}>
      <View style={{ gap: space.lg }}>
        <Chips testID="range" value={kind} onChange={setKind} options={KINDS} />
        {kind === 'custom' ? (
          <View style={{ gap: space.sm }}>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <View style={{ flex: 1 }}>
                <TextField label="From" value={from} onChange={setFrom} placeholder="YYYY-MM-DD" testID="custom-from" />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label="To" value={to} onChange={setTo} placeholder="YYYY-MM-DD" testID="custom-to" />
              </View>
            </View>
            {customError ? <Text variant="caption" tone="crit" testID="custom-error">{customError}</Text> : null}
          </View>
        ) : null}
        <DataBoundary query={data} isEmpty={() => false} empty={{ title: 'Nothing yet' }}>
          {(r) => <RangeBody r={r} />}
        </DataBoundary>
      </View>
    </ScreenScaffold>
  );
}

function RangeBody({ r }: { r: NutritionRange }) {
  if (!r.enough_data || !r.averages) {
    return (
      <Card>
        <Text variant="body">Not enough data yet</Text>
        <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
          {count(r.logged_days, 'day')} logged in this range. Three is the fewest that says anything —
          a chart of fewer is noise.
        </Text>
      </Card>
    );
  }
  const avg = r.averages;
  return (
    <View style={{ gap: space.lg }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        <Tile label="Daily average" value={kcal(avg.calories)} unit="kcal" testID="avg-kcal" />
        <Tile label="Protein average" value={String(Math.round(avg.protein_g))} unit="g" />
        <Tile label="Days logged" value={`${r.logged_days}`} unit={`of ${r.days}`} />
        {r.within_target_days != null ? (
          <Tile label="Within 10% of target" value={String(r.within_target_days)} unit="days" testID="within-target" />
        ) : null}
      </View>
      <Text variant="caption" tone="ink3">Averages use the {count(r.logged_days, 'day')} you logged.</Text>

      <Section title="Daily calories · kcal">
        <Column
          testID="intake-chart"
          data={r.daily.map((d) => ({ label: d.local_date, value: d.calories ?? 0, tick: String(Number(d.local_date.slice(8))) }))}
          format={kcal}
        />
        {r.target_kcal ? <Text variant="caption" tone="ink3">Target {kcal(r.target_kcal)} kcal · a gap is a day not logged</Text> : null}
      </Section>

      {r.macro_split ? (
        <Section title="Macro split · daily average">
          <Macro label="Protein" grams={avg.protein_g} pct={r.macro_split.protein ?? 0} />
          <Macro label="Carbs" grams={avg.carbs_g} pct={r.macro_split.carbs ?? 0} />
          <Macro label="Fat" grams={avg.fat_g} pct={r.macro_split.fat ?? 0} />
          {r.incomplete_days ? (
            <Text variant="caption" tone="ink3">
              {r.incomplete_days === 1 ? '1 day has' : `${r.incomplete_days} days have`} foods without macro data —
              those macros are missing from the averages.
            </Text>
          ) : null}
        </Section>
      ) : null}

      {r.training || r.rest ? (
        <Section title="Training vs rest days">
          {r.training ? <SplitRow label={`Training (${r.training.days})`} kcalAvg={r.training.calories} protein={r.training.protein_g} /> : null}
          {r.rest ? <SplitRow label={`Rest (${r.rest.days})`} kcalAvg={r.rest.calories} protein={r.rest.protein_g} /> : null}
        </Section>
      ) : null}

      <WeightChart r={r} />
    </View>
  );
}

function WeightChart({ r }: { r: NutritionRange }) {
  const points = r.daily.filter((d) => d.body_weight_kg != null)
    .map((d) => ({ label: d.local_date, value: d.body_weight_kg! }));
  return (
    <Section title="Weight · kg">
      {points.length >= 2 ? (
        // Its own chart, on the same days as intake above — not a second y-axis.
        <Line testID="weight-chart" data={points} format={(v) => v.toFixed(1)} />
      ) : (
        <Text variant="caption" tone="ink3">Two weigh-ins in this range and the trend appears here.</Text>
      )}
    </Section>
  );
}

function Tile({ label, value, unit, testID }: { label: string; value: string; unit?: string; testID?: string }) {
  return (
    <Card style={{ flexBasis: '45%', flexGrow: 1 }}>
      <Text variant="caption" tone="ink3">{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <Text variant="stat" testID={testID}>{value}</Text>
        {unit ? <Text variant="caption" tone="ink3">{unit}</Text> : null}
      </View>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="label">{title}</Text>
      {children}
    </View>
  );
}

function Macro({ label, grams, pct }: { label: string; grams: number; pct: number }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 4 }} accessible accessibilityLabel={`${label}, ${Math.round(grams)} grams, ${pct} percent`}>
      <View style={{ flexDirection: 'row' }}>
        <Text variant="body" style={{ flex: 1 }}>{label}</Text>
        <Text variant="body" tone="ink2" style={{ fontFamily: font.dataSemi }}>{Math.round(grams)} g · {pct}%</Text>
      </View>
      <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: c.line }}>
        <View style={{ height: 6, borderRadius: radius.pill, width: `${Math.min(100, pct)}%`, backgroundColor: c.accent }} />
      </View>
    </View>
  );
}

function SplitRow({ label, kcalAvg, protein }: { label: string; kcalAvg: number; protein: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <Text variant="body" style={{ flex: 1 }}>{label}</Text>
      <Text variant="body" tone="ink2">{kcal(kcalAvg)} kcal · {Math.round(protein)} g protein</Text>
    </View>
  );
}
