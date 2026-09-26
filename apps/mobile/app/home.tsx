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
 * **Each domain renders its own empty state.** A brand-new user has three empty
 * ones, and that is the *first* dashboard anybody sees. One empty domain never
 * blanks the other two.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Pressable } from '@/ui/Pressable';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import type { BodyCard, GoalCard, NutritionCard, TrainingCard } from '@fitlog/api-types';
import { Button, Card, Meter, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { useTheme, space, font } from '@/theme';
import { useDashboard } from '@/lib/query/hooks';
import { grams, kcal, macroLabel, count } from '@/features/nutrition/format';
import {
  DEFAULT_LAYOUT, loadDashboardLayout, type DashboardLayout,
} from '@/features/dashboard/layout';
import { friendlyDate } from '@/features/dashboard/date';
import { journeyLine, weightGoalOf } from '@/features/body/JourneyCard';

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
      title={date ?? 'Today'}
      // Only once the server has answered: flows wait on this id as "the
      // dashboard is up".
      titleTestID={date ? 'dashboard-date' : undefined}
      onRefresh={() => { void board.refetch(); }}
    >
      <DataBoundary
        query={board}
        isEmpty={() => false}
        empty={{ title: 'Nothing to show yet' }}
      >
        {(data) => (
          <View style={{ gap: space.xl }}>
            {layout.filter((s) => s.visible).map((section) => {
              switch (section.key) {
                case 'training':
                  return <TrainingSection key="training" card={data.training} />;
                case 'nutrition':
                  return <NutritionSection key="nutrition" card={data.nutrition} />;
                case 'body':
                  return (
                    <BodySection key="body" card={data.body} goal={weightGoalOf(data.goals)} today={data.local_date} />
                  );
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
              kind="ghost"
              size="sm"
              testID="go-customize"
              style={{ alignSelf: 'center' }}
              onPress={() => router.push('/home/customize')}
            />
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}

/* ------------------------------------------------------------- training */

function TrainingSection({ card }: { card: TrainingCard }) {
  const empty = card.sessions_today === 0 && !card.last_session;

  return (
    <View>
      <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>
        Training
      </Text>
      <Card hero>
        {card.active_session_id ? (
          <>
            <Pill kind="accent">In progress</Pill>
            <Button
              title="Resume workout"
              style={{ marginTop: space.base }}
              testID="resume-session"
              onPress={() => router.push(`/session/${card.active_session_id}`)}
            />
          </>
        ) : empty ? (
          <>
            {/* Not a zeroed chart. A first-run checklist (BRD §14). */}
            <Text variant="body" testID="training-empty">Nothing logged yet</Text>
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
              Start a workout and this fills in as you go.
            </Text>
            <Button
              title="Start workout"
              style={{ marginTop: space.base }}
              testID="start-workout"
              onPress={() => router.push('/train/start')}
            />
          </>
        ) : (
          <>
            {/* One stop, not "0" then "kg today" (G10 TalkBack session). */}
            <View
              accessible
              accessibilityLabel={`${kcal(card.volume_today_kg)} kilograms lifted today`}
              style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}
            >
              <Text variant="display" style={{ fontSize: 30 }} testID="training-volume">
                {kcal(card.volume_today_kg)}
              </Text>
              <Text variant="caption" tone="ink3">kg today</Text>
            </View>
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
              {card.sessions_this_week} session{card.sessions_this_week === 1 ? '' : 's'} this
              week · {kcal(card.volume_this_week_kg)} kg
              {card.streak_days > 0 ? ` · ${card.streak_days}-day streak` : ''}
            </Text>
            {card.last_session ? (
              <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                Last: {card.last_session.local_date} ·{' '}
                {count(card.last_session.set_count, 'set')}
              </Text>
            ) : null}
            <Button
              title="Start workout"
              style={{ marginTop: space.base }}
              testID="start-workout"
              onPress={() => router.push('/train/start')}
            />
          </>
        )}
      </Card>
    </View>
  );
}

/* ------------------------------------------------------------ nutrition */

function NutritionSection({ card }: { card: NutritionCard }) {
  const target = card.targets?.calories ?? null;
  const remaining = target === null ? null : target - card.calories;

  return (
    <View>
      <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>
        Nutrition
      </Text>
      <Card hero>
        {target !== null ? (
          <>
            <View
              accessible
              accessibilityLabel={`${kcal(remaining)} kilocalories left, ${kcal(card.calories)} of ${kcal(target)} eaten`}
              style={{ alignItems: 'center' }}
            >
              <Text variant="hero" style={{ fontSize: 48 }} testID="kcal-remaining">
                {kcal(remaining)}
              </Text>
              <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                kcal left · {kcal(card.calories)} of {kcal(target)}
              </Text>
            </View>
            <View style={{ marginTop: space.md }}>
              <Meter value={card.calories} max={target} over={card.calories > target} />
            </View>
          </>
        ) : (
          <>
            {/* No invented target, and no meter drawn against nothing. */}
            <Text variant="body" tone="ink2" testID="no-target">No targets set yet.</Text>
            <Button
              title="Set a target"
              kind="ghost"
              size="sm"
              style={{ marginTop: space.md }}
              testID="go-targets"
              onPress={() => router.push('/nutrition/targets')}
            />
          </>
        )}

        <View style={{ flexDirection: 'row', gap: space.lg, marginTop: space.base }}>
          <Macro label="Protein" value={card.protein_g} target={card.targets?.protein_g} />
          <Macro label="Carbs" value={card.carbs_g} target={card.targets?.carbs_g} />
          <Macro label="Fat" value={card.fat_g} target={card.targets?.fat_g} />
        </View>

        {card.pending_count > 0 ? (
          // Visible, and in no total. I12 — the preview IS the bug.
          <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }} testID="pending">
            {card.pending_count} item{card.pending_count === 1 ? '' : 's'} waiting to be
            confirmed — not counted yet.
          </Text>
        ) : null}
        {card.incomplete ? (
          <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
            Some items are missing macros, so this total is a floor.
          </Text>
        ) : null}
        {card.meals_logged === 0 ? (
          <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }} testID="nutrition-empty">
            Nothing logged today.
          </Text>
        ) : null}

        <Button
          title="Log food"
          kind="ghost"
          size="sm"
          style={{ marginTop: space.base }}
          testID="go-nutrition"
          onPress={() => router.push('/nutrition')}
        />
      </Card>
    </View>
  );
}

function Macro({
  label, value, target,
}: { label: string; value: number; target?: number | null }) {
  // Each macro is one stop. Three name-over-value columns were read across —
  // "Protein", "Carbs", "Fat", then three bare figures (G10 TalkBack session).
  return (
    <View accessible accessibilityLabel={macroLabel(label, value, target)}>
      <Text variant="label" tone="ink3">{label}</Text>
      <Text variant="body">
        {grams(value)}{target ? ` / ${target} g` : ''}
      </Text>
    </View>
  );
}

/* ----------------------------------------------------------------- body */

function BodySection({ card, goal, today }: { card: BodyCard; goal?: GoalCard; today: string }) {
  // Where the goal stands, on the page people open every day (G10) — the full
  // journey is one tap away on Progress.
  const line = goal ? journeyLine(goal, today) : null;
  return (
    <View>
      <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>
        Body
      </Text>
      <Card>
        {card.latest ? (
          <>
            <View
              accessible
              accessibilityLabel={`${card.latest.value.toFixed(1)} ${card.unit}`}
              style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}
            >
              <Text variant="display" style={{ fontSize: 28 }} testID="body-latest">
                {card.latest.value.toFixed(1)}
              </Text>
              <Text variant="caption" tone="ink3">{card.unit}</Text>
            </View>
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
              {card.today === null || card.today === undefined
                // An old figure is shown WITH its date, never as if it were fresh.
                ? `Last logged ${card.latest.local_date}`
                : 'Logged today'}
              {card.change_7d !== null && card.change_7d !== undefined
                ? ` · ${card.change_7d > 0 ? '+' : ''}${card.change_7d.toFixed(1)} ${card.unit} in 7 days`
                : ''}
            </Text>
          </>
        ) : (
          <>
            <Text variant="body" testID="body-empty">Track your weight to see the trend</Text>
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
              One entry a week is enough to see where you are going.
            </Text>
          </>
        )}
        {line ? (
          <Text variant="caption" tone="accent" style={{ marginTop: space.sm }} testID="body-goal">{line}</Text>
        ) : null}
        <Button
          title={card.today === null || card.today === undefined ? 'Log today' : 'Progress'}
          kind="ghost"
          size="sm"
          style={{ marginTop: space.base }}
          testID="go-body"
          onPress={() => router.push('/progress')}
        />
      </Card>
    </View>
  );
}

/* ---------------------------------------------------------------- goals */

function GoalsSection({ goals }: { goals: readonly GoalCard[] }) {
  return (
    <View>
      <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>
        Goals
      </Text>
      {goals.length === 0 ? (
        <Card>
          <Text variant="body" testID="goals-empty">No goals yet</Text>
          <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
            Set one and everything above gets something to aim at.
          </Text>
          <Button
            title="Set a goal"
            kind="ghost"
            size="sm"
            style={{ marginTop: space.base }}
            testID="go-new-goal"
            onPress={() => router.push('/progress/goals/new')}
          />
        </Card>
      ) : (
        goals.map((goal) => <GoalRow key={String(goal.id)} goal={goal} />)
      )}
    </View>
  );
}

export function GoalRow({ goal }: { goal: GoalCard }) {
  const progress = goal.progress;

  return (
    <Pressable
      onPress={() => router.push(`/progress/goals/${goal.id}`)}
      accessibilityRole="button"
      accessibilityLabel={
        `${goal.goal_type.replace('_', ' ')}, ${goal.target_value} ${goal.target_unit}, `
        + (progress === null || progress === undefined
          ? 'not measured yet'
          : `${Math.round(progress * 100)} percent`)
      }
      testID={`goal-${goal.id}`}
    >
      <Card style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="label">{goal.goal_type.replace('_', ' ')}</Text>
          <Pill kind={progress !== null && progress !== undefined && progress >= 1 ? 'good' : 'accent'}>
            {goal.status}
          </Pill>
        </View>
        <Text variant="stat" style={{ marginTop: 8 }}>
          {goal.current_value?.toFixed(1) ?? goal.start_value?.toFixed(1) ?? '—'} →{' '}
          {goal.target_value} <Text variant="caption" tone="ink3">{goal.target_unit}</Text>
        </Text>

        {progress === null || progress === undefined ? (
          // Null is not zero. A meter at 0% would read as "no progress" when
          // the truth is "we have not weighed you yet".
          <Text variant="caption" tone="ink3" style={{ marginTop: space.md }} testID={`goal-${goal.id}-unmeasured`}>
            Log a measurement and this starts tracking.
          </Text>
        ) : (
          <View style={{ marginTop: space.md }}>
            <Meter value={Math.max(0, progress)} max={1} over={progress < 0} />
            <Text variant="caption" tone={progress < 0 ? 'serious' : 'ink3'} style={{ marginTop: 4 }}>
              {progress < 0
                // Shown, not hidden behind an empty meter.
                ? 'Moving away from it at the moment'
                : `${Math.round(progress * 100)}% of the way`}
            </Text>
          </View>
        )}
      </Card>
    </Pressable>
  );
}
