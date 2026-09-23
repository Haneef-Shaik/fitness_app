/**
 * B-03 · The quick-action sheet (BRD §14.7).
 *
 * The four things somebody opens the app to do, one tap from anywhere. Every
 * one of them is a route that already exists — a quick action that led
 * somewhere half-built would be worse than no quick action, because it is the
 * affordance people learn to trust first.
 */
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useDashboard } from '@/lib/query/hooks';
import { space } from '@/theme';

export default function QuickActions() {
  const board = useDashboard();
  const active = board.data?.training?.active_session_id ?? null;

  return (
    <ScreenScaffold title="What now">
      <View style={{ gap: space.md }}>
        {active ? (
          <Card>
            <Text variant="body">You have a workout open.</Text>
            <Button
              title="Resume it"
              style={{ marginTop: space.base }}
              testID="quick-resume"
              onPress={() => router.replace(`/session/${active}`)}
            />
          </Card>
        ) : (
          <Button
            title="Start a workout"
            testID="quick-workout"
            onPress={() => router.replace('/train/start')}
          />
        )}

        <Button
          title="Log food"
          kind="ghost"
          testID="quick-food"
          onPress={() => router.replace('/nutrition/add')}
        />
        <Button
          title="Describe a meal"
          kind="ghost"
          testID="quick-describe"
          onPress={() => router.replace('/nutrition/describe')}
        />
        <Button
          title="Log a measurement"
          kind="ghost"
          testID="quick-weigh"
          onPress={() => router.replace('/progress/log')}
        />
      </View>
    </ScreenScaffold>
  );
}
