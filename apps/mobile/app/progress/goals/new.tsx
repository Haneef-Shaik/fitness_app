/**
 * J-02 · Set a goal.
 *
 * **The starting value is offered, not assumed.** It defaults to the latest
 * weigh-in because that is almost always what somebody means, but it stays
 * editable: progress is measured from where they say they started (P02.6), and
 * a goal created a month after the effort began should say so.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import { Button, Card, Text } from '@/ui';
import { Choice } from '@/ui/Choice';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useCreateGoal, useDashboard } from '@/lib/query/hooks';
import { radius, space, useTheme } from '@/theme';

const TYPES = [
  { value: 'fat_loss', label: 'Lose fat' },
  { value: 'muscle_gain', label: 'Gain muscle' },
  { value: 'maintenance', label: 'Maintain' },
  { value: 'strength', label: 'Get stronger' },
] as const;

/** Which way "better" runs for each kind of goal. */
const DIRECTION: Record<string, 'up' | 'down' | 'hold'> = {
  fat_loss: 'down', muscle_gain: 'up', maintenance: 'hold', strength: 'up',
};

export default function NewGoal() {
  const { c } = useTheme();
  const board = useDashboard();
  const create = useCreateGoal();

  const [goalType, setGoalType] = useState<string>('fat_loss');
  const [start, setStart] = useState('');
  const [target, setTarget] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Offered from the latest weigh-in, and still editable.
  useEffect(() => {
    const latest = board.data?.body?.latest?.value;
    if (latest !== undefined && latest !== null && start === '') {
      setStart(String(latest));
    }
  }, [board.data, start]);

  const num = (v: string) => {
    const n = Number(v.replace(',', '.'));
    return v.trim() !== '' && Number.isFinite(n) ? n : null;
  };
  const targetValue = num(target);

  const field = (label: string, value: string, onChange: (v: string) => void, testID: string) => (
    <View>
      <Text variant="label" accessibilityElementsHidden importantForAccessibility="no" style={{ marginBottom: space.sm }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        accessibilityLabel={label}
        testID={testID}
        placeholderTextColor={c.ink3}
        style={{
          minHeight: 46, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
          paddingHorizontal: space.md, color: c.ink, backgroundColor: c.sunken,
        }}
      />
    </View>
  );

  return (
    <ScreenScaffold title="Set a goal">
      <View style={{ gap: space.lg }}>
        <View>
          <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>What are you after</Text>
          <Choice testID="goal-type" value={goalType} onChange={setGoalType} options={TYPES} />
        </View>

        {field('Starting weight (kg)', start, setStart, 'goal-start')}
        {field('Target weight (kg)', target, setTarget, 'goal-target')}

        <Card>
          <Text variant="caption" tone="ink3">
            Progress is measured from the starting value, so editing the target later
            keeps the distance you have already covered.
          </Text>
        </Card>

        {error ? (
          <Text variant="caption" tone="crit" testID="goal-error">{error}</Text>
        ) : null}

        <Button
          title={create.isPending ? 'Saving…' : 'Set it'}
          disabled={targetValue === null || create.isPending}
          testID="goal-save"
          onPress={async () => {
            setError(null);
            try {
              await create.mutateAsync({
                goal_type: goalType as 'fat_loss',
                metric_key: 'body_weight',
                direction: DIRECTION[goalType] ?? 'down',
                start_value: num(start),
                target_value: targetValue!,
                target_unit: 'kg',
                start_date: board.data?.local_date ?? new Date().toISOString().slice(0, 10),
                target_date: null,
              });
              router.replace('/progress/goals');
            } catch (e) {
              setError(
                e instanceof Error && e.message ? e.message : 'That goal did not save.',
              );
            }
          }}
        />
      </View>
    </ScreenScaffold>
  );
}
