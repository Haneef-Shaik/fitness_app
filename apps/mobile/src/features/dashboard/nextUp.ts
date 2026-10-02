/**
 * The one thing B-01 suggests doing now.
 *
 * Decided in a fixed order — open workout, first run, unchecked estimates,
 * training, food, weigh-in — because a suggestion the user can predict is
 * one they learn to trust. Pure, so the rule is tested without a screen.
 */
import { daysBetween } from '@/features/history/format';

export interface NextUpInput {
  local_date: string;
  training: {
    active_session_id?: string | null;
    sessions_today: number;
    last_session?: { local_date: string } | null;
  };
  nutrition: { meals_logged: number; pending_count: number };
  body: { latest?: { local_date: string } | null };
}

export type NextUpKind = 'resume' | 'first-run' | 'review' | 'workout' | 'meal' | 'weigh-in' | 'done';

export interface NextUp {
  kind: NextUpKind;
  title: string;
  body: string;
  /** Where the suggestion leads. The first-run checklist lives on the page itself. */
  href: string | null;
  /** Ionicons name. */
  icon: string;
}

/** A weigh-in older than this is due again. */
const WEIGH_IN_EVERY_DAYS = 7;

const BREAKFAST_UNTIL = 10;
const LUNCH_UNTIL = 15;
const DINNER_UNTIL = 21;

export function mealForHour(hour: number): string {
  if (hour >= BREAKFAST_UNTIL && hour < LUNCH_UNTIL) return 'lunch';
  if (hour >= LUNCH_UNTIL && hour < DINNER_UNTIL) return 'dinner';
  if (hour < BREAKFAST_UNTIL && hour >= 4) return 'breakfast';
  return 'a snack';
}

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

function isFirstRun(d: NextUpInput): boolean {
  return d.training.sessions_today === 0 && !d.training.last_session
    && d.nutrition.meals_logged === 0 && !d.body.latest;
}

function weighInDue(d: NextUpInput): { due: boolean; days: number | null } {
  if (!d.body.latest) return { due: true, days: null };
  const days = daysBetween(d.body.latest.local_date, d.local_date);
  return { due: days >= WEIGH_IN_EVERY_DAYS, days };
}

export function nextUp(d: NextUpInput, hour: number): NextUp {
  if (d.training.active_session_id) {
    return {
      kind: 'resume', title: 'Resume your workout', body: 'You have a session open.',
      href: `/session/${d.training.active_session_id}`, icon: 'play',
    };
  }
  if (isFirstRun(d)) {
    return {
      kind: 'first-run', title: "Let's get your first data in",
      body: 'Three quick things and this page fills in.', href: null, icon: 'flag-outline',
    };
  }
  if (d.nutrition.pending_count > 0) {
    return {
      kind: 'review', title: `Check ${plural(d.nutrition.pending_count, 'estimated item')}`,
      body: "Estimates don't count until you confirm them.", href: '/nutrition', icon: 'sparkles-outline',
    };
  }
  if (d.training.sessions_today === 0) {
    const last = d.training.last_session
      ? `Last session ${daysAgo(daysBetween(d.training.last_session.local_date, d.local_date))}.`
      : 'Nothing trained yet today.';
    return { kind: 'workout', title: "Start today's workout", body: last, href: '/train/start', icon: 'barbell-outline' };
  }
  if (d.nutrition.meals_logged === 0) {
    return {
      kind: 'meal', title: `Log ${mealForHour(hour)}`, body: 'Nothing logged yet today.',
      href: '/nutrition/add', icon: 'restaurant-outline',
    };
  }
  const weigh = weighInDue(d);
  if (weigh.due) {
    return {
      kind: 'weigh-in', title: 'Log your weight',
      body: weigh.days === null ? 'One entry a week is enough.' : `Last logged ${daysAgo(weigh.days)}.`,
      href: '/progress/log', icon: 'scale-outline',
    };
  }
  return {
    kind: 'done', title: "You're all caught up", body: 'Trained, logged and weighed in.',
    href: '/progress', icon: 'checkmark-circle-outline',
  };
}

function daysAgo(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}
