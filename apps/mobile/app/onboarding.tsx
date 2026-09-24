/**
 * A-07 … A-10 · Onboarding — rebuilt in G10 from the owner's review.
 *
 * The old version asked for units and an activity level, then showed a calorie
 * target computed from a HARD-CODED BMR of 1,680 — the same number for everyone
 * — under the words "Mifflin–St Jeor", with every macro bar drawn at 70%. This
 * one asks what a target and a program depend on — who you are, your goal and
 * pace, how you can train — records your first check-in, shows the working
 * behind the target (A-08), and recommends a program (A-09).
 *
 * Units come first, not second as in the wireframe: height and weight cannot
 * be typed before we know whether they are kg or lb.
 *
 * Saving: the profile is PATCHed as each step is completed (A-07), so leaving
 * half way keeps what was answered. The goal, the baseline check-in and the
 * targets are written once, on "Looks good". Onboarding is only marked
 * complete at the very end.
 */
import { useMemo, useState } from 'react';
import { Text } from '@/ui';
import { resetTo } from '@/lib/navigation';
import { ApiError, goalsApi, profileApi } from '@/lib/api';
import { programsApi } from '@/lib/api-catalog';
import { useSession } from '@/lib/session';
import { queueMetric } from '@/features/body/logMetric';
import { StepFrame } from '@/features/onboarding/ui';
import {
  ageOn, answersFrom, baselineMetrics, goalFrom, planFrom, plausibility, profilePatch,
  type Answers,
} from '@/features/onboarding/answers';
import {
  AboutYouStep, ActivityStep, GoalStep, MeasurementsStep, TrainingStep, UnitsStep,
} from '@/features/onboarding/stepsAboutYou';
import { DoneStep, ProgramStep, TargetsStep } from '@/features/onboarding/stepsPlan';

const STEPS: readonly { key: string; title: string; subtitle?: string; skippable: boolean }[] = [
  { key: 'units', title: 'How should we show your numbers?', skippable: false },
  { key: 'about', title: 'About you', subtitle: 'So your targets are yours, not an average.', skippable: true },
  { key: 'activity', title: 'How active are you, outside training?', skippable: true },
  { key: 'goal', title: "What's your goal?", skippable: true },
  { key: 'training', title: 'How do you train?', subtitle: 'We use this to recommend a program.', skippable: true },
  { key: 'measure', title: 'Your first check-in', subtitle: 'Your starting point. Later check-ins are measured against it.', skippable: true },
  { key: 'targets', title: 'Your starting targets', subtitle: 'From your body, your activity and the pace you picked.', skippable: true },
  { key: 'program', title: 'Pick a program', subtitle: 'Ranked for your experience, schedule and equipment.', skippable: true },
  { key: 'done', title: "You're all set", skippable: false },
];

/** A-07: under 13, stop and explain. `[ASSUMPTION — confirm legal position]` */
const MIN_AGE = 13;

function detectedTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}

/** Today in the chosen timezone — the calendar the server will use (I7). */
function todayIn(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const CONTINUE_LABEL: Record<string, string> = {
  targets: 'Looks good', done: 'Go to my dashboard',
};

export default function Onboarding() {
  const { refreshProfile, profile } = useSession();
  const [i, setI] = useState(0);
  // Answers saved on an earlier visit come back (each step is PATCHed as it is done).
  const [a, setA] = useState<Answers>(() => answersFrom(profile, detectedTimezone()));
  const [program, setProgram] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warned, setWarned] = useState(false);
  // Written once, however often the user goes back and forward.
  const [wrotePlan, setWrotePlan] = useState(false);
  const [wroteProgram, setWroteProgram] = useState(false);
  const [extra, setExtra] = useState<string[]>([]);

  const today = todayIn(a.timezone);
  const plan = useMemo(() => planFrom(a, today), [a, today]);
  const step = STEPS[i]!;
  const set = (patch: Partial<Answers>) => { setA((prev) => ({ ...prev, ...patch })); setWarned(false); };

  const age = a.birthDate ? ageOn(a.birthDate, today) : null;
  const tooYoung = step.key === 'about' && age != null && age < MIN_AGE;
  const warnings = step.key === 'about' || step.key === 'goal' ? plausibility(a, today) : [];

  const writePlan = async () => {
    if (wrotePlan) return;
    if (plan) {
      await profileApi.patch({
        daily_calorie_target: plan.calories, protein_g_target: plan.proteinG,
        carbs_g_target: plan.carbsG, fat_g_target: plan.fatG,
      } as never);
    }
    const goal = goalFrom(a, today);
    if (goal) {
      // Onboarding can be left after this step and started again; the goal it
      // wrote then is updated, not joined by a second active one.
      const earlier = (await goalsApi.list()).find((g) =>
        g.status === 'active' && g.goal_type === goal.goal_type && g.metric_key === goal.metric_key);
      if (earlier) {
        await goalsApi.patch(earlier.id, { target_value: goal.target_value, weekly_rate: goal.weekly_rate });
      } else {
        await goalsApi.create(goal as never);
      }
    }
    // The baseline rides the outbox like any weigh-in: it survives a dropped signal.
    for (const m of baselineMetrics(a)) {
      await queueMetric({ ...m, measured_at: null, notes: 'Starting check-in', client_id: null } as never);
    }
    setWrotePlan(true);
  };

  const summary = (): string[] => {
    const lines: string[] = [];
    if (plan && wrotePlan) {
      lines.push(`Daily target: ${plan.calories.toLocaleString('en-GB')} kcal · ${plan.proteinG} g protein`);
    }
    const goal = goalFrom(a, today);
    if (goal && goal.direction !== 'hold') {
      lines.push(`Goal: ${goal.target_value} kg, starting from ${goal.start_value} kg`);
    }
    if (wroteProgram) lines.push('Your program is ready in the Train tab.');
    const baseline = baselineMetrics(a);
    const hasWeight = baseline.some((m) => m.metric_key === 'body_weight');
    const tape = baseline.length - (hasWeight ? 1 : 0);
    const parts = [hasWeight ? 'weight' : null, tape ? `${tape} measurement${tape === 1 ? '' : 's'}` : null]
      .filter(Boolean).join(' and ');
    lines.push(baseline.length
      ? `Your first check-in is recorded (${parts}). The next is due in ${a.checkinDays} days.`
      : 'Log your weight in Progress to start tracking.');
    return [...lines, ...extra];
  };

  const next = async (skip: boolean) => {
    setError(null);
    if (!skip && warnings.length && !warned) { setWarned(true); return; }   // shown once, then allowed
    setBusy(true);
    try {
      if (step.key === 'done') {
        await profileApi.patch({ onboarding_completed: true } as never);
        await refreshProfile();
        resetTo('/home');
        return;
      }
      if (step.key === 'targets') {
        if (!skip) await writePlan();
      } else if (step.key === 'program') {
        if (!skip && program && !wroteProgram) {
          try {
            await programsApi.startTemplate(program);
            setWroteProgram(true);
          } catch {
            // A-09: onboarding must never dead-end on a non-essential step.
            setExtra(["We couldn't add that program — add it from Train → Starter programs."]);
          }
        }
      } else {
        await profileApi.patch(profilePatch(a) as never);
      }
      setWarned(false);
      setI(i + 1);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "That didn't save. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const props = { a, set, today };
  const label = step.key === 'program'
    ? (program ? 'Use this program' : 'Continue without one')
    : CONTINUE_LABEL[step.key] ?? 'Continue';

  return (
    <StepFrame
      step={i + 1}
      of={STEPS.length}
      title={step.title}
      subtitle={step.subtitle}
      onBack={i > 0 && step.key !== 'done' ? () => { setWarned(false); setI(i - 1); } : undefined}
      onSkip={step.skippable ? () => { void next(true); } : undefined}
      onContinue={() => { void next(false); }}
      continueLabel={label}
      canContinue={!tooYoung}
      busy={busy}
      notices={[
        ...(tooYoung ? [`Volt is for people aged ${MIN_AGE} and over.`] : []),
        ...(warned ? [...warnings, "If that's right, tap Continue again."] : []),
        ...(error ? [error] : []),
      ]}
    >
      {step.key === 'units' ? <UnitsStep {...props} /> : null}
      {step.key === 'about' ? <AboutYouStep {...props} /> : null}
      {step.key === 'activity' ? <ActivityStep {...props} /> : null}
      {step.key === 'goal' ? <GoalStep {...props} /> : null}
      {step.key === 'training' ? <TrainingStep {...props} /> : null}
      {step.key === 'measure' ? <MeasurementsStep {...props} /> : null}
      {step.key === 'targets' ? <TargetsStep plan={plan} /> : null}
      {step.key === 'program' ? <ProgramStep chosen={program} onChoose={setProgram} /> : null}
      {step.key === 'done' ? <DoneStep lines={summary()} /> : null}
      {tooYoung ? <Text variant="body" tone="ink2">If you entered the wrong date, change it above.</Text> : null}
    </StepFrame>
  );
}
