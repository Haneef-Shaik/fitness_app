/**
 * B-01's first-run state (BRD §14, wireframe 02): the checklist that replaces
 * three empty cards until there is something to show. Each row keeps the
 * testID its old card carried, because the acceptance flows wait on them.
 */
import React from 'react';
import { router } from 'expo-router';
import type { Dashboard } from '@fitlog/api-types';
import { Checklist } from '@/ui/Checklist';

export function isFirstRun(data: Pick<Dashboard, 'training' | 'nutrition' | 'body'>): boolean {
  return data.training.sessions_today === 0 && !data.training.last_session
    && data.nutrition.meals_logged === 0 && !data.body.latest;
}

export function FirstRunChecklist({ data }: { data: Dashboard }) {
  const hasTarget = Boolean(data.nutrition.targets?.calories);
  return (
    <Checklist
      testID="first-run"
      title="Let's get your first data in"
      body="Three quick things and this page fills in as you go."
      items={[
        {
          key: 'workout', label: 'Log your first workout', hint: 'Start empty, or from a program',
          done: data.training.sessions_today > 0 || Boolean(data.training.last_session),
          action: { label: 'Start', testID: 'start-workout', onPress: () => router.push('/train/start') },
          testID: 'training-empty',
        },
        {
          key: 'meal', label: 'Log a meal', hint: 'Search it, describe it or photograph it',
          done: data.nutrition.meals_logged > 0,
          action: { label: 'Log', testID: 'go-nutrition', onPress: () => router.push('/nutrition') },
          testID: 'nutrition-empty',
        },
        {
          key: 'weight', label: 'Record your weight', hint: 'One entry a week is enough',
          done: Boolean(data.body.latest),
          action: { label: 'Add', testID: 'go-body', onPress: () => router.push('/progress/log') },
          testID: 'body-empty',
        },
        {
          key: 'targets', label: 'Set a calorie target', hint: 'So the numbers have something to aim at',
          done: hasTarget,
          action: { label: 'Set', testID: 'go-targets', onPress: () => router.push('/nutrition/targets') },
          testID: hasTarget ? 'has-target' : 'no-target',
        },
      ]}
    />
  );
}
