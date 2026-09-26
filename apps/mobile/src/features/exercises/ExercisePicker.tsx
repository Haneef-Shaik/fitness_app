/**
 * C-06 · Exercise Picker (H2.2).
 *
 * **Selection is controlled by the caller.** G3 needs exactly this sheet for the
 * logger's add-exercise and swap-exercise, where the selection belongs to the
 * session draft rather than to this component. Owning the state here would mean
 * building it twice, so it is a prop:
 *
 *     <ExercisePicker visible selected={ids} onChange={setIds} onCommit={...} />
 *
 * Single-select (swap) is `max={1}`.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import { Pressable } from '@/ui/Pressable';
import type { Exercise } from '@fitlog/api-types';
import { Button, Text } from '../../ui';
import { DataBoundary } from '../../ui/DataBoundary';
import { FilterChips, anyFilterActive, describeFilters } from '../../ui/FilterChips';
import { Sheet } from '../../ui/Sheet';
import { VirtualList } from '../../ui/VirtualList';
import { useExercises, useMuscleGroups } from '../../lib/query/hooks';
import { radius, space, useTheme } from '../../theme';
import { muscleSummary } from './format';

export interface ExercisePickerProps {
  visible: boolean;
  onClose: () => void;
  /** Controlled selection — ids, in pick order. */
  selected: readonly string[];
  onChange: (next: string[]) => void;
  /** Commit. Receives the selection so a caller need not read it back. */
  onCommit?: (ids: string[]) => void;
  /** 1 turns the sheet into swap-one (G3's swap). Defaults to unlimited. */
  max?: number;
  /** Offer "Create <query>" when the search finds nothing. */
  allowCreate?: boolean;
  onCreate?: (name: string) => void;
  title?: string;
  /** Ids already present in the caller's list — shown as a hint, never blocked. */
  alreadyPresent?: readonly string[];
}

export function ExercisePicker({
  visible, onClose, selected, onChange, onCommit, max, allowCreate = false, onCreate,
  title = 'Add exercises', alreadyPresent = [],
}: ExercisePickerProps) {
  const { c } = useTheme();
  const [query, setQuery] = useState('');
  const [muscles, setMuscles] = useState<string[]>([]);

  const groups = useMuscleGroups();
  const exercises = useExercises({ q: query || undefined, muscle: muscles[0] });

  const chipOptions = useMemo(
    () => (groups.data ?? [])
      .filter((g) => g.parent_id === null)
      .map((g) => ({ value: g.slug, label: g.name })),
    [groups.data],
  );

  const labelOf = (slug: string) =>
    chipOptions.find((o) => o.value === slug)?.label ?? slug;

  const filtered = anyFilterActive(query, muscles);

  const toggle = (id: string) => {
    if (selected.includes(id)) return onChange(selected.filter((x) => x !== id));
    if (max === 1) return onChange([id]);
    if (max !== undefined && selected.length >= max) return;
    onChange([...selected, id]);
  };

  const row = ({ item }: { item: Exercise }) => {
    const checked = selected.includes(item.id);
    const present = alreadyPresent.includes(item.id);
    return (
      <Pressable
        onPress={() => toggle(item.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={`${item.name}, ${item.equipment}${present ? ', already in this day' : ''}`}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: space.md,
          paddingHorizontal: space.lg, paddingVertical: space.md,
          borderBottomWidth: 1, borderColor: c.line, minHeight: 56,
        }}
      >
        <View
          style={{
            width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
            borderColor: checked ? c.accent : c.line2,
            backgroundColor: checked ? c.accent : 'transparent',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {checked ? <Text variant="caption" style={{ color: c.accentInk }}>✓</Text> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="body" numberOfLines={1}>{item.name}</Text>
          <Text variant="caption" tone="ink3" numberOfLines={1}>
            {item.equipment}
            {muscleSummary(item) ? ` · ${muscleSummary(item)}` : ''}
            {present ? ' · already in this day' : ''}
          </Text>
        </View>
      </Pressable>
    );
  };

  const createLabel = query.trim() ? `Create "${query.trim()}"` : 'Create an exercise';

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title}
      testID="exercise-picker"
      footer={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Text variant="caption" tone="ink3" style={{ flex: 1 }}>
            {selected.length} selected
          </Text>
          <Button
            title={selected.length ? `Add ${selected.length}` : 'Add'}
            size="sm"
            disabled={selected.length === 0}
            onPress={() => { onCommit?.([...selected]); }}
            style={{ minWidth: 120 }}
          />
        </View>
      }
    >
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
          placeholderTextColor={c.ink3}
          accessibilityLabel="Search exercises"
          testID="picker-search"
          style={{
            minHeight: 44, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
            paddingHorizontal: space.md, color: c.ink, backgroundColor: c.sunken,
          }}
        />
      </View>

      <FilterChips
        options={chipOptions}
        selected={muscles}
        onChange={setMuscles}
        multi={false}
        testID="picker-muscle-chips"
      />

      <View style={{ flex: 1, minHeight: 200 }}>
        <DataBoundary
          query={exercises}
          empty={{
            title: 'No exercises yet',
            body: 'Your catalog is empty.',
          }}
          filtered={{
            isActive: filtered,
            onClear: () => { setQuery(''); setMuscles([]); },
            describe: describeFilters(query, muscles, labelOf),
          }}
        >
          {(rows) => (
            <VirtualList
              data={rows}
              keyExtractor={(e) => e.id}
              renderItem={row}
              estimatedItemSize={64}
              testID="picker-list"
            />
          )}
        </DataBoundary>
      </View>

      {allowCreate && onCreate ? (
        <View
          style={{
            paddingHorizontal: space.lg, paddingVertical: space.md,
            borderTopWidth: 1, borderColor: c.line,
          }}
        >
          <Text variant="caption" tone="ink3" style={{ marginBottom: space.sm }}>
            Can't find it?
          </Text>
          <Button
            title={createLabel}
            kind="ghost"
            size="sm"
            onPress={() => onCreate(query.trim())}
          />
        </View>
      ) : null}
    </Sheet>
  );
}
