/**
 * B-03 · Quick actions (BRD §14.7).
 *
 * The few things somebody opens the app to do, one tap from anywhere, as
 * big obvious rows with the suggested one marked. Every one of them is a
 * route that already exists — a quick action that led somewhere half-built
 * would be worse than no quick action, because it is the affordance people
 * learn to trust first.
 */
import { router } from 'expo-router';
import { Text } from '@/ui';
import { MenuList, type MenuItem } from '@/ui/MenuList';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useDashboard } from '@/lib/query/hooks';
import { space } from '@/theme';

export default function QuickActions() {
  const board = useDashboard();
  const active = board.data?.training?.active_session_id ?? null;
  // Replace, not push: the destination takes this sheet's place in the history.
  const go = (href: string) => () => router.replace(href as never);

  const items: MenuItem[] = [
    active
      ? { key: 'resume', icon: 'play', label: 'Resume your workout', hint: 'A session is still open', tone: 'accent', testID: 'quick-resume', onPress: go(`/session/${active}`) }
      : { key: 'workout', icon: 'barbell-outline', label: 'Start a workout', hint: 'From a program, or empty', tone: 'accent', testID: 'quick-workout', onPress: go('/train/start') },
    { key: 'food', icon: 'search-outline', label: 'Log food', hint: 'Search the catalog or a recipe', testID: 'quick-food', onPress: go('/nutrition/add') },
    { key: 'describe', icon: 'sparkles-outline', label: 'Describe a meal', hint: 'Type what you ate and check the estimate', badge: 'AI', testID: 'quick-describe', onPress: go('/nutrition/describe') },
    { key: 'photo', icon: 'camera-outline', label: 'Photograph a meal', hint: 'Snap the plate and check the estimate', badge: 'AI', testID: 'quick-photo', onPress: go('/nutrition/photo') },
    { key: 'weigh', icon: 'scale-outline', label: 'Log your weight', hint: 'Or any measurement', testID: 'quick-weigh', onPress: go('/progress/log') },
  ];

  return (
    <ScreenScaffold eyebrow="Quick actions" title="What now?">
      <MenuList items={items} testID="quick-actions" />
      <Text variant="caption" tone="ink3" style={{ textAlign: 'center', marginTop: space.lg }}>
        Everything here is one tap from any tab.
      </Text>
    </ScreenScaffold>
  );
}
