/** D-01 · Exercise Library — search, muscle filters, virtualised list. */
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import { Pressable } from '@/ui/Pressable';
import type { Exercise } from '@volt/api-types';
import { Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { FilterChips, anyFilterActive, describeFilters } from '@/ui/FilterChips';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { VirtualList } from '@/ui/VirtualList';
import { useExercises, useMuscleGroups } from '@/lib/query/hooks';
import { muscleSummary } from '@/features/exercises/format';
import { radius, space, useTheme } from '@/theme';

export default function ExerciseLibrary() {
  const { c } = useTheme();
  const [query, setQuery] = useState('');
  const [muscles, setMuscles] = useState<string[]>([]);

  const groups = useMuscleGroups();
  const exercises = useExercises({ q: query || undefined, muscle: muscles[0] });

  const chips = useMemo(
    () => (groups.data ?? [])
      .filter((g) => g.parent_id === null)
      .map((g) => ({ value: g.slug, label: g.name })),
    [groups.data],
  );
  const labelOf = (slug: string) => chips.find((o) => o.value === slug)?.label ?? slug;
  const filtered = anyFilterActive(query, muscles);

  const row = ({ item }: { item: Exercise }) => (
    <Pressable
      onPress={() => router.push(`/train/exercises/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.equipment}`}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 64,
        paddingHorizontal: space.lg, paddingVertical: space.md,
        borderBottomWidth: 1, borderColor: c.line,
      }}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Text variant="body" numberOfLines={1} style={{ flexShrink: 1 }}>{item.name}</Text>
          {item.is_custom ? <Pill>custom</Pill> : null}
          {item.status === 'archived' ? <Pill>archived</Pill> : null}
        </View>
        <Text variant="caption" tone="ink3" numberOfLines={1}>
          {item.equipment}{muscleSummary(item) ? ` · ${muscleSummary(item)}` : ''}
        </Text>
      </View>
      <Text variant="body" tone="ink3">›</Text>
    </Pressable>
  );

  return (
    <ScreenScaffold
      title="Exercises"
      scroll={false}
      action={{ label: '+ New', onPress: () => router.push('/train/exercises/new') }}
    >
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
          placeholderTextColor={c.ink3}
          accessibilityLabel="Search exercises"
          testID="library-search"
          style={{
            minHeight: 44, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
            paddingHorizontal: space.md, color: c.ink, backgroundColor: c.sunken,
          }}
        />
      </View>

      <FilterChips options={chips} selected={muscles} onChange={setMuscles} multi={false} />

      <DataBoundary
        query={exercises}
        empty={{
          title: 'No exercises yet',
          body: 'Your catalog is empty.',
          action: { label: 'Create one', onPress: () => router.push('/train/exercises/new') },
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
            testID="library-list"
            onRefresh={() => { exercises.refetch(); }}
            refreshing={exercises.isFetching}
          />
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
