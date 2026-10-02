/**
 * B-01 · Home Dashboard — **AC-11**.
 *
 * **One request.** Training, nutrition, body and goals all come from
 * `GET /dashboard`, and `app/__tests__/dashboardRequests.test.tsx` asserts the
 * count so a future screen cannot quietly reintroduce a fan-out. This screen is
 * the one a user sees most often and judges the app by; every extra request was
 * latency on it.
 *
 * **The day is the server's.** Nothing here computes "today". The date shown is
 * the one the server resolved from the profile's timezone (**I7**) — a phone in
 * a different timezone from the profile is not a bug this screen gets to have
 * an opinion about.
 *
 * **It says what to do next.** An "up next" line at the top (`nextUp`), a
 * checklist instead of three empty cards on a brand-new account, and one
 * clear button on each card. The cards themselves render their own empty
 * states, so one empty domain never blanks the other two.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { Dashboard, GoalCard } from '@fitlog/api-types';
import { Button, Card } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { EmptyState } from '@/ui/EmptyState';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { SectionHeader } from '@/ui/SectionHeader';
import { SkeletonCard } from '@/ui/Skeleton';
import { useDashboard } from '@/lib/query/hooks';
import { DEFAULT_LAYOUT, loadDashboardLayout, type DashboardLayout } from '@/features/dashboard/layout';
import { friendlyDate } from '@/features/dashboard/date';
import { FirstRunChecklist, isFirstRun } from '@/features/dashboard/FirstRunChecklist';
import { NextUpBanner } from '@/features/dashboard/NextUpBanner';
import { TrainingCard } from '@/features/dashboard/TrainingCard';
import { NutritionCard } from '@/features/dashboard/NutritionCard';
import { BodyCard } from '@/features/dashboard/BodyCard';
import { GoalRow } from '@/features/body/GoalRow';
import { weightGoalOf } from '@/features/body/JourneyCard';
import { space } from '@/theme';

/** Once per process: the cold-start marker is about the first dashboard, not every visit. */
let reported = false;

export default function Home() {
  const board = useDashboard();

  // B-02's choice, applied. The request is unchanged either way — hiding a card
  // hides a card, it does not stop anything being tracked.
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
  useEffect(() => { void loadDashboardLayout().then(setLayout); }, []);

  const date = board.data ? friendlyDate(board.data.local_date) : null;

  // Cold-start measurement (TODO 2.2): one line in the platform log the moment
  // the dashboard has its data, so the span is read from logcat's own
  // timestamps — process start to this line — with no test driver in it.
  useEffect(() => {
    if (board.data && process.env.EXPO_PUBLIC_MEASURE === '1' && !reported) {
      reported = true;
      console.info('FITLOG_DASHBOARD_READY');
    }
  }, [board.data]);

  return (
    <ScreenScaffold
      root
      eyebrow="Today"
      title={date ?? 'Home'}
      // Only once the server has answered: flows wait on this id as "the
      // dashboard is up".
      titleTestID={date ? 'dashboard-date' : undefined}
      onRefresh={() => { void board.refetch(); }}
    >
      <DataBoundary
        query={board}
        isEmpty={() => false}
        empty={{ title: 'Nothing to show yet' }}
        skeleton={<View style={{ gap: space.md }}><SkeletonCard /><SkeletonCard /><SkeletonCard lines={2} /></View>}
      >
        {(data) => <Sections data={data} layout={layout} />}
      </DataBoundary>
    </ScreenScaffold>
  );
}

function Sections({ data, layout }: { data: Dashboard; layout: DashboardLayout }) {
  const firstRun = isFirstRun(data);
  const goal = weightGoalOf(data.goals);

  return (
    <View style={{ gap: space.base }}>
      {firstRun ? <FirstRunChecklist data={data} /> : <NextUpBanner data={data} />}

      {layout.filter((s) => s.visible).map((section) => {
        switch (section.key) {
          case 'training':
            return firstRun ? null : <TrainingCard key="training" card={data.training} today={data.local_date} />;
          case 'nutrition':
            return firstRun ? null : <NutritionCard key="nutrition" card={data.nutrition} />;
          case 'body':
            return firstRun ? null : <BodyCard key="body" card={data.body} goal={goal} today={data.local_date} />;
          case 'goals':
            return <GoalsSection key="goals" goals={data.goals ?? []} />;
          default:
            return null;
        }
      })}

      {/* B-01 ends with one way to shape the page. Everything else is a
          tab — the wall of buttons that stood here was the navigation. */}
      <Button
        title="Customize dashboard"
        icon="options-outline"
        kind="ghost"
        size="sm"
        testID="go-customize"
        style={{ alignSelf: 'center', marginTop: space.sm }}
        onPress={() => router.push('/home/customize')}
      />
    </View>
  );
}

function GoalsSection({ goals }: { goals: readonly GoalCard[] }) {
  return (
    <View>
      <SectionHeader
        title="Goals"
        action={goals.length > 0 ? { label: 'See all', onPress: () => router.push('/progress/goals') } : undefined}
      />
      {goals.length === 0 ? (
        <Card>
          <EmptyState
            compact
            icon="flag-outline"
            title="No goals yet"
            titleTestID="goals-empty"
            body="Set one and everything above gets something to aim at."
            action={{ label: 'Set a goal', testID: 'go-new-goal', onPress: () => router.push('/progress/goals/new') }}
          />
        </Card>
      ) : (
        <View style={{ gap: space.sm }}>
          {goals.map((goal) => <GoalRow key={String(goal.id)} goal={goal} />)}
        </View>
      )}
    </View>
  );
}
