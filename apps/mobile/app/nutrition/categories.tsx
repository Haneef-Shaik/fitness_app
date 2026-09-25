/**
 * H-16 · Meal Category Manager.
 *
 * **A category with meals in it cannot be deleted, only hidden.** The server
 * refuses with a 409 and this screen says why rather than swallowing it — the
 * same soft-delete principle exercises and programs use, for the same reason:
 * the meals are still there and would end up pointing at a label nobody can
 * bring back.
 *
 * Renaming is free, because meals reference the slug. Hidden categories still
 * render in history.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import { Pressable } from '@/ui/Pressable';
import type { MealCategory } from '@volt/api-types';
import { Button, Card, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import {
  useCreateMealCategory,
  useDeleteMealCategory,
  useMealCategories,
  useReorderMealCategories,
  useUpdateMealCategory,
} from '@/lib/query/hooks';
import { radius, space, useTheme } from '@/theme';

export default function Categories() {
  const { c } = useTheme();
  const query = useMealCategories();
  const create = useCreateMealCategory();
  const reorder = useReorderMealCategories();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const move = async (rows: MealCategory[], index: number, delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= rows.length) return;
    const ids = rows.map((r) => String(r.id));
    // Immutable swap — the list the server is sent is a new array, never the
    // cached one mutated in place.
    const swapped = ids.map((id, i) =>
      i === index ? ids[next]! : i === next ? ids[index]! : id,
    );
    await reorder.mutateAsync(swapped);
  };

  return (
    <ScreenScaffold title="Meal categories">
      <DataBoundary
        query={query}
        isEmpty={(rows) => rows.length === 0}
        empty={{ title: 'No categories' }}
      >
        {(rows) => (
          <View style={{ gap: space.lg }}>
            {rows.map((row, index) => (
              <CategoryRow
                key={String(row.id)}
                row={row}
                first={index === 0}
                last={index === rows.length - 1}
                onMove={(delta) => move(rows, index, delta)}
                onError={setError}
              />
            ))}

            {error ? (
              <Text variant="caption" tone="crit" testID="category-error">{error}</Text>
            ) : null}

            <Card>
              <Text variant="label" accessibilityElementsHidden importantForAccessibility="no" style={{ marginBottom: space.sm }}>Add a category</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Pre-workout"
                placeholderTextColor={c.ink3}
                accessibilityLabel="New category name"
                testID="category-new-name"
                style={{
                  minHeight: 46, borderRadius: radius.btn, borderWidth: 1,
                  borderColor: c.line2, paddingHorizontal: space.md,
                  color: c.ink, backgroundColor: c.sunken,
                }}
              />
              <Button
                title="Add"
                kind="ghost"
                size="sm"
                style={{ marginTop: space.sm }}
                disabled={!newName.trim()}
                onPress={async () => {
                  setError(null);
                  try {
                    await create.mutateAsync({ name: newName.trim(), default_time: null });
                    setNewName('');
                  } catch (e) {
                    setError(messageOf(e, 'That category could not be added.'));
                  }
                }}
              />
            </Card>

            <Button title="Done" kind="ghost" onPress={() => router.back()} />
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}

function messageOf(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

function CategoryRow({
  row, first, last, onMove, onError,
}: {
  row: MealCategory;
  first: boolean;
  last: boolean;
  onMove: (delta: number) => Promise<void>;
  onError: (message: string | null) => void;
}) {
  const { c } = useTheme();
  const update = useUpdateMealCategory();
  const remove = useDeleteMealCategory();
  const [name, setName] = useState(row.name);
  const [time, setTime] = useState(row.default_time ?? '');

  const arrow = (label: string, delta: number, disabled: boolean) => (
    <Pressable
      onPress={() => onMove(delta)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Move ${row.name} ${delta < 0 ? 'up' : 'down'}`}
      testID={`category-${row.slug}-${delta < 0 ? 'up' : 'down'}`}
      hitSlop={8}
      style={{
        width: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.3 : 1,
      }}
    >
      <Text variant="body" tone="ink2">{delta < 0 ? '↑' : '↓'}</Text>
    </Pressable>
  );

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <TextInput
          value={name}
          onChangeText={setName}
          onBlur={() => {
            if (name.trim() && name.trim() !== row.name) {
              update.mutate({ id: String(row.id), body: { name: name.trim() } });
            }
          }}
          accessibilityLabel={`Name of ${row.name}`}
          testID={`category-${row.slug}-name`}
          style={{
            flex: 1, minHeight: 42, borderRadius: radius.btn, borderWidth: 1,
            borderColor: c.line2, paddingHorizontal: space.md,
            color: c.ink, backgroundColor: c.sunken,
          }}
        />
        {arrow('up', -1, first)}
        {arrow('down', 1, last)}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm }}>
        <Text variant="caption" tone="ink3" style={{ flex: 1 }}>Usually at</Text>
        <TextInput
          value={time}
          onChangeText={setTime}
          onBlur={() => {
            const value = time.trim();
            if (value === (row.default_time ?? '')) return;
            update.mutate({
              id: String(row.id),
              body: { default_time: /^\d{2}:\d{2}$/.test(value) ? value : null },
            });
          }}
          placeholder="08:00"
          placeholderTextColor={c.ink3}
          accessibilityLabel={`Default time for ${row.name}`}
          testID={`category-${row.slug}-time`}
          style={{
            width: 90, minHeight: 38, textAlign: 'center', borderRadius: radius.btn,
            borderWidth: 1, borderColor: c.line2, color: c.ink, backgroundColor: c.sunken,
          }}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm }}>
        {row.hidden ? <Pill>Hidden</Pill> : null}
        <View style={{ flex: 1 }} />
        <Button
          title={row.hidden ? 'Show' : 'Hide'}
          kind="ghost"
          size="sm"
          testID={`category-${row.slug}-hide`}
          onPress={() => update.mutate({ id: String(row.id), body: { hidden: !row.hidden } })}
        />
        <Button
          title="Delete"
          kind="danger"
          size="sm"
          testID={`category-${row.slug}-delete`}
          onPress={async () => {
            onError(null);
            try {
              await remove.mutateAsync(String(row.id));
            } catch (e) {
              // The 409 says how many meals are in the way and to hide it
              // instead. Showing that sentence is the whole point of refusing.
              onError(messageOf(e, 'That category could not be deleted.'));
            }
          }}
        />
      </View>
    </Card>
  );
}
