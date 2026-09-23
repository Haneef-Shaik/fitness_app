/**
 * B-05 · Global search.
 *
 * **It searches what the app can already search, and says what it cannot.** An
 * empty box that quietly misses half the app is worse than one that tells you
 * where to look — so the scope is stated, not implied.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import { Pressable } from '@/ui/Pressable';
import { Card, Pill, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useExercises, useFoods } from '@/lib/query/hooks';
import { radius, space, useTheme } from '@/theme';

export default function Search() {
  const { c } = useTheme();
  const [query, setQuery] = useState('');
  const term = query.trim();

  const exercises = useExercises(term ? { q: term } : {});
  const foods = useFoods(term || undefined);

  const exerciseRows = term ? (exercises.data ?? []).slice(0, 6) : [];
  const foodRows = term ? (foods.data?.data ?? []).slice(0, 6) : [];
  const nothing = term.length > 0 && exerciseRows.length === 0 && foodRows.length === 0;

  return (
    <ScreenScaffold title="Search">
      <View style={{ gap: space.lg }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Exercises and foods"
          placeholderTextColor={c.ink3}
          autoCorrect={false}
          accessibilityLabel="Search"
          testID="search-input"
          style={{
            minHeight: 46, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
            paddingHorizontal: space.md, color: c.ink, backgroundColor: c.sunken,
          }}
        />

        {term.length === 0 ? (
          <Card>
            {/* Stated, so nobody concludes their workout is missing. */}
            <Text variant="body">Exercises and foods.</Text>
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
              Past workouts have their own search, with filters that matter there —
              muscle, exercise and date.
            </Text>
          </Card>
        ) : null}

        {exerciseRows.length > 0 ? (
          <View>
            <Text variant="label" style={{ marginBottom: space.sm }}>Exercises</Text>
            {exerciseRows.map((row) => (
              <Pressable
                key={String(row.id)}
                onPress={() => router.push(`/train/exercises/${row.id}`)}
                accessibilityRole="button"
                accessibilityLabel={row.name}
                testID={`search-exercise-${row.id}`}
              >
                <Card style={{ marginBottom: 8 }}>
                  <Text variant="body">{row.name}</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        ) : null}

        {foodRows.length > 0 ? (
          <View>
            <Text variant="label" style={{ marginBottom: space.sm }}>Foods</Text>
            {foodRows.map((row) => (
              <Pressable
                key={String(row.id)}
                onPress={() => router.push(`/nutrition/food/${row.id}`)}
                accessibilityRole="button"
                accessibilityLabel={row.name}
                testID={`search-food-${row.id}`}
              >
                <Card style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <Text variant="body" style={{ flex: 1 }}>{row.name}</Text>
                    {row.is_custom ? <Pill kind="mute">yours</Pill> : null}
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        ) : null}

        {nothing ? (
          <Card>
            {/* I13 — filtered-empty quotes what was searched for. */}
            <Text variant="body" testID="search-empty">Nothing matches &ldquo;{term}&rdquo;</Text>
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
              Try fewer words, or add it as a custom exercise or food.
            </Text>
          </Card>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}
