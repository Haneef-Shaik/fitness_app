/**
 * H-15 · Calorie & macro targets.
 *
 * Two things this screen must get right, both of them stated on it:
 *
 * **Changing a target never rewrites history** (PRD P02.6). A target is the line
 * today is measured against, not a property of a meal already eaten. Without the
 * note, someone who lowers their target and sees yesterday's meter unchanged
 * concludes the app is broken.
 *
 * **The calculator is an estimate and says so.** Mifflin–St Jeor needs a birth
 * date and a sex; when they are missing the screen names what it is missing and
 * falls back to a rougher weight-and-activity figure rather than inventing one.
 *
 * All the arithmetic lives in `@fitlog/domain` — the interlock that keeps three
 * percentages summing to exactly 100 is the one place in G7 where a rounding
 * slip is invisible, so it is tested there rather than eyeballed here.
 */
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import {
  type ActivityLevel, type MacroKey, type MacroSplit,
  PRESET_SPLITS, bmrMifflinStJeor, caloriesNotice, fallbackMaintenance,
  macroGrams, proteinNotice, rebalanceSplit, splitFromGrams, splitTotal,
  targetCalories, tdee, ACTIVITY_MULTIPLIER,
} from '@fitlog/domain';
import { Button, Card, Pill, Text, Well } from '@/ui';
import { Choice } from '@/ui/Choice';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { MacroRow } from '@/features/nutrition/MacroRow';
import { useProfile, useUpdateProfile } from '@/lib/query/hooks';
import { radius, space, useTheme } from '@/theme';

const ACTIVITIES: readonly { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'very', label: 'Very active' },
  { value: 'extra', label: 'Extra active' },
];

const GOALS = [
  { value: '-20', label: 'Lose faster' },
  { value: '-10', label: 'Lose fat' },
  { value: '0', label: 'Maintain' },
  { value: '10', label: 'Gain' },
] as const;

const MACROS: readonly { key: MacroKey; label: string }[] = [
  { key: 'proteinG', label: 'Protein' },
  { key: 'carbsG', label: 'Carbs' },
  { key: 'fatG', label: 'Fat' },
];

const yearsSince = (iso: string): number | null => {
  const born = new Date(iso);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth()
    || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  return beforeBirthday ? age - 1 : age;
};

export default function Targets() {
  const { c } = useTheme();
  const profile = useProfile();
  const save = useUpdateProfile();

  const [mode, setMode] = useState<'calculated' | 'manual'>('calculated');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<string>('-10');
  const [weight, setWeight] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [split, setSplit] = useState<MacroSplit>(PRESET_SPLITS.balanced!);

  // Seed from the saved profile once it lands. If targets are already stored,
  // the screen opens on "Set my own" — re-deriving over someone's own numbers
  // would silently discard them.
  useEffect(() => {
    const p = profile.data;
    if (!p) return;
    setActivity(p.activity_level as ActivityLevel);
    if (p.daily_calorie_target) {
      setMode('manual');
      setManualCalories(String(p.daily_calorie_target));
      const grams = {
        proteinG: p.protein_g_target ?? 0,
        carbsG: p.carbs_g_target ?? 0,
        fatG: p.fat_g_target ?? 0,
      };
      if (grams.proteinG || grams.carbsG || grams.fatG) {
        setSplit(splitFromGrams(p.daily_calorie_target, grams));
      }
    }
  }, [profile.data]);

  const weightKg = useMemo(() => {
    const n = Number(weight.replace(',', '.'));
    return Number.isFinite(n) && weight.trim() !== '' ? n : null;
  }, [weight]);

  const ageYears = profile.data?.birth_date ? yearsSince(profile.data.birth_date) : null;
  const sex = profile.data?.sex ?? null;
  const heightCm = profile.data?.height_cm ?? null;

  const bmr = bmrMifflinStJeor({ weightKg, heightCm, ageYears, sex });
  const maintenance = bmr !== null ? tdee(bmr, activity) : fallbackMaintenance(weightKg, activity);
  const calculated = maintenance !== null ? targetCalories(maintenance, Number(goal)) : null;

  const calories = mode === 'calculated'
    ? calculated
    : (Number.isFinite(Number(manualCalories)) && manualCalories.trim() !== ''
        ? Math.round(Number(manualCalories)) : null);

  const grams = calories !== null ? macroGrams(calories, split) : null;
  const total = splitTotal(split);
  const calNotice = calories !== null ? caloriesNotice(calories) : null;
  const protNotice = grams ? proteinNotice(grams.proteinG, weightKg) : null;

  // What the calculator is missing, named rather than silently absorbed.
  const missing = [
    weightKg === null ? 'your weight' : null,
    heightCm === null ? 'your height' : null,
    ageYears === null ? 'your birth date' : null,
    sex !== 'male' && sex !== 'female' ? 'your sex' : null,
  ].filter(Boolean) as string[];

  const blocked = calories === null || total !== 100 || calNotice?.level === 'error';

  return (
    <ScreenScaffold title="Targets">
      <DataBoundary query={profile} isEmpty={() => false} empty={{ title: 'No profile yet' }}>
        {() => (
          <View style={{ gap: space.lg }}>
            <Choice
              testID="target-mode"
              scroll={false}
              value={mode}
              onChange={setMode}
              options={[
                { value: 'calculated', label: 'Calculate for me' },
                { value: 'manual', label: 'Set my own' },
              ]}
            />

            {mode === 'calculated' ? (
              <View style={{ gap: space.md }}>
                <Text variant="label">Calculated</Text>

                <View>
                  <Text variant="caption" tone="ink3" style={{ marginBottom: space.sm }}>Activity</Text>
                  <Choice testID="target-activity" value={activity} onChange={setActivity} options={ACTIVITIES} />
                </View>

                <View>
                  <Text variant="caption" tone="ink3" style={{ marginBottom: space.sm }}>Goal</Text>
                  <Choice testID="target-goal" value={goal} onChange={setGoal} options={GOALS} />
                </View>

                <View>
                  <Text variant="caption" tone="ink3" style={{ marginBottom: space.sm }}>
                    Your weight (kg)
                  </Text>
                  <TextInput
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                    accessibilityLabel="Your weight in kilograms"
                    testID="target-weight"
                    placeholder="e.g. 78"
                    placeholderTextColor={c.ink3}
                    style={{
                      minHeight: 46, borderRadius: radius.btn, borderWidth: 1,
                      borderColor: c.line2, paddingHorizontal: space.md,
                      color: c.ink, backgroundColor: c.sunken,
                    }}
                  />
                  {/* FitLog does not track bodyweight yet, so the calculator asks
                      rather than pretending to know. */}
                  <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                    Used for this calculation only — FitLog does not log your weight yet.
                  </Text>
                </View>

                <Well>
                  {calculated !== null ? (
                    <View style={{ gap: 4 }} testID="target-calculated">
                      <Text variant="display">{calculated.toLocaleString()} kcal / day</Text>
                      {bmr !== null ? (
                        <Text variant="caption" tone="ink3">
                          BMR {Math.round(bmr).toLocaleString()} × {ACTIVITY_MULTIPLIER[activity]}
                          {' '}= {Math.round(tdee(bmr, activity)).toLocaleString()}
                          {Number(goal) !== 0 ? ` → ${Number(goal) > 0 ? '+' : ''}${goal}%` : ''}
                        </Text>
                      ) : null}
                      <Text variant="caption" tone="ink3">
                        {bmr !== null
                          ? 'Mifflin–St Jeor. An estimate.'
                          : 'A rough weight-and-activity estimate — less accurate than the full formula.'}
                      </Text>
                    </View>
                  ) : (
                    <Text variant="body" tone="ink3" testID="target-cannot-calculate">
                      To calculate a target I still need {missing.join(', ')}.
                    </Text>
                  )}
                </Well>

                {missing.length > 0 && calculated !== null ? (
                  <Card>
                    {/* No link: nothing in the app sets a birth date, sex or
                        height yet (the API does — the screen does not exist).
                        Pointing at a route that is not there is worse than
                        saying plainly what is missing. */}
                    <Text variant="caption" tone="ink3" testID="target-missing">
                      Without {missing.join(', ')} this is the rougher estimate.
                      Set your own target instead if you already know it.
                    </Text>
                  </Card>
                ) : null}
              </View>
            ) : (
              <View>
                <Text variant="caption" tone="ink3" style={{ marginBottom: space.sm }}>
                  Daily calories
                </Text>
                <TextInput
                  value={manualCalories}
                  onChangeText={setManualCalories}
                  keyboardType="number-pad"
                  accessibilityLabel="Daily calories"
                  testID="target-calories"
                  placeholderTextColor={c.ink3}
                  style={{
                    minHeight: 46, borderRadius: radius.btn, borderWidth: 1,
                    borderColor: c.line2, paddingHorizontal: space.md,
                    color: c.ink, backgroundColor: c.sunken,
                  }}
                />
              </View>
            )}

            {calNotice ? (
              <Text
                variant="caption"
                tone={calNotice.level === 'error' ? 'crit' : 'ink2'}
                testID="target-calorie-notice"
              >
                {calNotice.message}
              </Text>
            ) : null}

            <View style={{ gap: space.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Text variant="label" style={{ flex: 1 }}>Macros</Text>
                <Pill kind={total === 100 ? 'good' : 'mute'}>
                  {total === 100 ? 'total 100% ✓' : `total ${total}%`}
                </Pill>
              </View>

              {MACROS.map(({ key, label }) => (
                <MacroRow
                  key={key}
                  testID={`macro-${key}`}
                  label={label}
                  pct={split[key]}
                  grams={grams?.[key] ?? 0}
                  onPct={(next) => setSplit((s) => rebalanceSplit(s, key, next))}
                  onGrams={(nextGrams) => {
                    // Editing grams back-computes the percentages, which may then
                    // NOT total 100 — deliberately. The badge above shows the gap
                    // rather than the screen quietly repairing it.
                    if (calories === null) return;
                    setSplit((s) => splitFromGrams(calories, { ...(grams ?? s), [key]: nextGrams }));
                  }}
                />
              ))}

              <Choice
                testID="target-preset"
                value=""
                onChange={(name) => setSplit(PRESET_SPLITS[name] ?? split)}
                options={[
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'highProtein', label: 'High protein' },
                  { value: 'lowCarb', label: 'Low carb' },
                ]}
              />

              {protNotice ? (
                <Text variant="caption" tone="ink2" testID="target-protein-notice">
                  {protNotice.message}
                </Text>
              ) : null}
            </View>

            <Card>
              {/* Deliberately narrower than the wireframe's wording. Targets are
                  not versioned (charter Q1's neighbour, **Q8**, still open), so
                  FitLog cannot honestly claim a past day keeps the target it had
                  — it has no record of what that was. What it CAN say, and what
                  is true, is that nothing about what you ate is rewritten. */}
              <Text variant="caption" tone="ink3">
                Changing a target changes what you are measured against from here on.
                Nothing you have already logged is rewritten — the meals, and their
                totals, stay exactly as they were.
              </Text>
            </Card>

            <Button
              title={save.isPending ? 'Saving…' : 'Save targets'}
              disabled={blocked}
              onPress={async () => {
                if (calories === null || grams === null) return;
                await save.mutateAsync({
                  daily_calorie_target: calories,
                  protein_g_target: grams.proteinG,
                  carbs_g_target: grams.carbsG,
                  fat_g_target: grams.fatG,
                });
                router.back();
              }}
            />
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
