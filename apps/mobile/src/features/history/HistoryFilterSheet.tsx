/**
 * F-02 · History Filters.
 *
 * A sheet over F-01 rather than a screen, so the list stays cached behind it —
 * changing a filter is a different query key, not a refetch of the same one.
 *
 * The draft is local until Apply. Filtering the list on every tap would refetch
 * per keystroke of intent, and "I was still choosing" is not a request.
 */
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Text } from '../../ui';
import { Sheet } from '../../ui/Sheet';
import { FilterChips } from '../../ui/FilterChips';
import { useMuscleGroups } from '../../lib/query/hooks';
import { space } from '../../theme';

export interface HistoryFilterValue {
  muscle?: string;
  exerciseId?: string;
  from?: string;
  to?: string;
}

export interface HistoryFilterSheetProps {
  visible: boolean;
  value: HistoryFilterValue;
  onClose: () => void;
  onApply: (next: HistoryFilterValue) => void;
}

/** Ranges offered as chips: a date picker for "last month" is three taps too many. */
const RANGES: Array<{ id: string; label: string; days: number | null }> = [
  { id: 'all', label: 'All time', days: null },
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: '90', label: 'Last 90 days', days: 90 },
  { id: '365', label: 'Last year', days: 365 },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function HistoryFilterSheet({
  visible, value, onClose, onApply,
}: HistoryFilterSheetProps) {
  const groups = useMuscleGroups();
  const [muscle, setMuscle] = useState<string | undefined>(value.muscle);
  const [range, setRange] = useState<string>('all');

  // Re-seed each time it opens, so a cancelled edit does not leak into the next.
  useEffect(() => {
    if (!visible) return;
    setMuscle(value.muscle);
    setRange(value.from ? guessRange(value.from) : 'all');
  }, [visible, value.muscle, value.from]);

  const apply = () => {
    const chosen = RANGES.find((r) => r.id === range);
    onApply({
      ...value,
      muscle,
      from: chosen?.days ? isoDaysAgo(chosen.days) : undefined,
      to: undefined,
    });
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Filter history"
      testID="history-filters"
      footer={
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Button
            title="Clear"
            kind="ghost"
            size="sm"
            style={{ flex: 1 }}
            onPress={() => onApply({})}
          />
          <Button title="Apply" size="sm" style={{ flex: 2 }} onPress={apply} />
        </View>
      }
    >
      <ScrollView
        contentContainerStyle={{ padding: space.lg, gap: space.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>Muscle group</Text>
          <FilterChips
            options={(groups.data ?? []).map((g) => ({ value: g.slug, label: g.name }))}
            selected={muscle ? [muscle] : []}
            onChange={(ids) => setMuscle(ids[0])}
            multi={false}
            testID="filter-muscle"
          />
        </View>

        <View>
          <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>When</Text>
          <FilterChips
            options={RANGES.map((r) => ({ value: r.id, label: r.label }))}
            selected={[range]}
            onChange={(ids) => setRange(ids[0] ?? 'all')}
            multi={false}
            testID="filter-range"
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}

/** Which chip a stored `from` came from, so reopening shows what is applied. */
function guessRange(from: string): string {
  const days = Math.round(
    (Date.now() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000,
  );
  const match = RANGES.filter((r) => r.days !== null)
    .sort((a, b) => Math.abs((a.days ?? 0) - days) - Math.abs((b.days ?? 0) - days))[0];
  return match?.id ?? 'all';
}
