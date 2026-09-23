/**
 * H-12 · Copy a meal, or a whole day.
 *
 * **A copy is a manual entry, not a new estimate.** The server lands every item
 * `confirmed`, `manual`, with the AI provenance stripped (**I12**) — this
 * screen says so, because someone copying a day of AI estimates would otherwise
 * be surprised to find them counted.
 *
 * Copying is the one nutrition write that does **not** ride the outbox: it
 * reads a day the client may not hold, so there is nothing to queue.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import { Button, Card, Text } from '@/ui';
import { Choice } from '@/ui/Choice';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useCategoryOptions } from '@/features/nutrition/useCategoryOptions';
import { useCopyDay, useCopyMeal } from '@/lib/query/hooks';
import { radius, space, useTheme } from '@/theme';

const addDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export default function Copy() {
  const { meal, date } = useLocalSearchParams<{ meal?: string; date?: string }>();
  const { c } = useTheme();
  const { options } = useCategoryOptions();
  const copyMeal = useCopyMeal();
  const copyDay = useCopyDay();

  const sourceDate = date ?? new Date().toISOString().slice(0, 10);
  const [toDate, setToDate] = useState(addDays(sourceDate, 1));
  const [mealType, setMealType] = useState(options[0]?.value ?? 'lunch');
  const [error, setError] = useState<string | null>(null);

  const copyingOneMeal = Boolean(meal);

  return (
    <ScreenScaffold title={copyingOneMeal ? 'Copy meal' : 'Copy day'}>
      <View style={{ gap: space.lg }}>
        <Card>
          <Text variant="body">
            {copyingOneMeal
              ? 'This meal is copied with its amounts unchanged.'
              : `Every meal logged on ${sourceDate} is copied, at the same times.`}
          </Text>
          <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
            Copies are recorded as your own entries — anything that was an unreviewed
            estimate arrives confirmed, and counts.
          </Text>
        </Card>

        <View>
          <Text variant="label" style={{ marginBottom: space.sm }}>Copy to</Text>
          <TextInput
            value={toDate}
            onChangeText={setToDate}
            placeholder="2026-09-24"
            placeholderTextColor={c.ink3}
            autoCapitalize="none"
            accessibilityLabel="Date to copy to"
            testID="copy-to-date"
            style={{
              minHeight: 46, borderRadius: radius.btn, borderWidth: 1,
              borderColor: c.line2, paddingHorizontal: space.md,
              color: c.ink, backgroundColor: c.sunken,
            }}
          />
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
            <Button
              title="Tomorrow"
              kind="ghost"
              size="sm"
              testID="copy-tomorrow"
              onPress={() => setToDate(addDays(sourceDate, 1))}
            />
            <Button
              title="Next week"
              kind="ghost"
              size="sm"
              testID="copy-next-week"
              onPress={() => setToDate(addDays(sourceDate, 7))}
            />
          </View>
        </View>

        {copyingOneMeal ? (
          <View>
            <Text variant="label" style={{ marginBottom: space.sm }}>Add to</Text>
            <Choice
              testID="copy-meal-type"
              value={mealType}
              onChange={setMealType}
              options={options}
            />
          </View>
        ) : null}

        {error ? (
          <Text variant="caption" tone="crit" testID="copy-error">{error}</Text>
        ) : null}

        <Button
          title={copyMeal.isPending || copyDay.isPending ? 'Copying…' : 'Copy'}
          testID="copy-confirm"
          onPress={async () => {
            setError(null);
            try {
              if (copyingOneMeal) {
                await copyMeal.mutateAsync({
                  id: meal!,
                  body: { to_date: toDate, meal_type: mealType, client_id: null },
                });
              } else {
                await copyDay.mutateAsync({ from_date: sourceDate, to_date: toDate });
              }
              router.back();
            } catch (e) {
              setError(e instanceof Error && e.message ? e.message : 'That copy did not go through.');
            }
          }}
        />
      </View>
    </ScreenScaffold>
  );
}
