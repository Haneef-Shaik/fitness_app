/**
 * H-10 · Create a custom food.
 *
 * Macros are entered **per 100 g**, and the form says so more than once,
 * because a user who types a per-serving figure here poisons every meal they
 * ever log from it. The label is the cheapest correction available.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useCreateFood } from '@/lib/query/hooks';
import { radius, space, useTheme } from '@/theme';

export default function NewFood() {
  const { name: prefill } = useLocalSearchParams<{ name?: string }>();
  const { c } = useTheme();
  const [name, setName] = useState(prefill ?? '');
  const [values, setValues] = useState<Record<string, string>>({
    calories: '', protein_g: '', carbs_g: '', fat_g: '', serving_grams: '',
  });
  const create = useCreateFood();

  const num = (v: string) => {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) && v.trim() !== '' ? n : null;
  };

  const field = (key: string, label: string) => (
    <View style={{ flex: 1 }}>
      <Text variant="label" style={{ marginBottom: space.sm }}>{label}</Text>
      <TextInput
        value={values[key] ?? ''}
        onChangeText={(v) => setValues((s) => ({ ...s, [key]: v }))}
        keyboardType="decimal-pad"
        accessibilityLabel={label}
        testID={`food-${key}`}
        placeholderTextColor={c.ink3}
        style={{
          minHeight: 46, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
          paddingHorizontal: space.md, color: c.ink, backgroundColor: c.sunken,
        }}
      />
    </View>
  );

  return (
    <ScreenScaffold title="New food">
      <View style={{ gap: space.lg }}>
        <View>
          <Text variant="label" style={{ marginBottom: space.sm }}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            accessibilityLabel="Food name"
            testID="food-name"
            placeholderTextColor={c.ink3}
            style={{
              minHeight: 46, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
              paddingHorizontal: space.md, color: c.ink, backgroundColor: c.sunken,
            }}
          />
        </View>

        <Card>
          {/* Said here, and again on the fields. A per-serving figure typed into
              a per-100 g column is wrong in every meal that ever uses it. */}
          <Text variant="body">Nutrition per 100 g</Text>
          <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
            Copy the "per 100 g" column from the label, not the per-serving one.
            Portions are chosen when you log it.
          </Text>
        </Card>

        <View style={{ flexDirection: 'row', gap: space.md }}>
          {field('calories', 'Calories /100 g')}
          {field('protein_g', 'Protein /100 g')}
        </View>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          {field('carbs_g', 'Carbs /100 g')}
          {field('fat_g', 'Fat /100 g')}
        </View>

        <View style={{ flexDirection: 'row', gap: space.md }}>
          {field('serving_grams', 'One serving (g) — optional')}
        </View>

        <Button
          title={create.isPending ? 'Saving…' : 'Save food'}
          onPress={async () => {
            const food = await create.mutateAsync({
              name: name.trim() || 'Custom food',
              calories: num(values.calories ?? ''),
              protein_g: num(values.protein_g ?? ''),
              carbs_g: num(values.carbs_g ?? ''),
              fat_g: num(values.fat_g ?? ''),
              serving_grams: num(values.serving_grams ?? ''),
            });
            router.replace(`/nutrition/food/${food.id}`);
          }}
        />
      </View>
    </ScreenScaffold>
  );
}
