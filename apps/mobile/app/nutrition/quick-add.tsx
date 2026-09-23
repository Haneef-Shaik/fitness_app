/**
 * H-13 · Quick Add — raw calories, no food record.
 *
 * Someone ate a canteen curry. There is no label, no catalog entry, and forcing
 * them to create a food first is how a day goes unlogged. `food_id` stays NULL
 * and the item carries its own macros and its own name.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import { Button, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { FilterChips } from '@/ui/FilterChips';
import { useCategoryOptions } from '@/features/nutrition/useCategoryOptions';
import { useLogMeal } from '@/lib/query/hooks';
import { radius, space, useTheme } from '@/theme';

export default function QuickAdd() {
  const { c } = useTheme();
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [mealType, setMealType] = useState<string>('snack');
  const { options } = useCategoryOptions();
  const log = useLogMeal();

  const num = (v: string) => {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) && v.trim() !== '' ? n : null;
  };

  const field = (
    label: string, value: string, onChange: (v: string) => void, numeric = false,
  ) => (
    <View style={{ flex: 1 }}>
      <Text variant="label" style={{ marginBottom: space.sm }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        accessibilityLabel={label}
        testID={`quick-${label.toLowerCase()}`}
        placeholderTextColor={c.ink3}
        style={{
          minHeight: 46, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
          paddingHorizontal: space.md, color: c.ink, backgroundColor: c.sunken,
        }}
      />
    </View>
  );

  return (
    <ScreenScaffold title="Quick add">
      <View style={{ gap: space.lg }}>
        {field('Name', name, setName)}
        <View style={{ flexDirection: 'row', gap: space.md }}>
          {field('Calories', calories, setCalories, true)}
          {field('Protein', protein, setProtein, true)}
        </View>

        <View>
          <Text variant="label" style={{ marginBottom: space.sm }}>Meal</Text>
          <FilterChips
            options={options}
            selected={[mealType]}
            onChange={(ids) => setMealType(ids[0] ?? 'snack')}
            multi={false}
            testID="quick-meal-type"
          />
        </View>

        <Button
          title={log.isPending ? 'Adding…' : 'Add to diary'}
          onPress={async () => {
            await log.mutateAsync({
              meal_type: mealType as 'snack',
              items: [{
                display_name: name.trim() || 'Quick add',
                calories: num(calories),
                protein_g: num(protein),
                confirmed: true,
                source: 'manual',
              }],
            });
            router.replace('/nutrition');
          }}
        />
        <Text variant="caption" tone="ink3">
          This does not create a food — it records what you ate, once.
        </Text>
      </View>
    </ScreenScaffold>
  );
}
