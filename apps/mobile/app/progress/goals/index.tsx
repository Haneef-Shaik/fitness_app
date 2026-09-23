/**
 * J-01 · Goals.
 *
 * The list and B-01's card render through the same `GoalRow`, and the progress
 * figure they show comes from the same server field — so they cannot disagree,
 * which two independent computations eventually would.
 */
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { GoalRow } from '../../home';
import { useGoals } from '@/lib/query/hooks';
import { space } from '@/theme';

export default function Goals() {
  const goals = useGoals();

  return (
    <ScreenScaffold
      title="Goals"
      action={{ label: '+ New', onPress: () => router.push('/progress/goals/new') }}
    >
      <DataBoundary
        query={goals}
        isEmpty={(rows) => rows.length === 0}
        empty={{
          title: 'No goals yet',
          body: 'A goal gives everything else something to aim at.',
          action: {
            label: 'Set a goal',
            onPress: () => router.push('/progress/goals/new'),
          },
        }}
      >
        {(rows) => (
          <View style={{ gap: space.sm }}>
            {rows.map((goal) => <GoalRow key={String(goal.id)} goal={goal} />)}
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
