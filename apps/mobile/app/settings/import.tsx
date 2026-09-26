/**
 * Import history from another app — workouts from Strong or Hevy, nutrition
 * from MyFitnessPal (launch plan, phase 6).
 *
 * Two steps, because it writes years of someone's history: pick the export and
 * see exactly what will happen — which exercises matched which, what will be
 * created as a custom exercise, what was skipped and why — then import. The
 * server does both; the phone only reads the file.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { Chips, Labelled } from '@/features/onboarding/ui';
import { ApiError, api } from '@/lib/api';
import { count } from '@/features/nutrition/format';
import { space } from '@/theme';

type DocumentPicker = typeof import('expo-document-picker');
type FileSystem = typeof import('expo-file-system/legacy');
// Native modules, required lazily as elsewhere, so importing this screen in a
// test does not need them.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const picker = () => require('expo-document-picker') as DocumentPicker;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const files = () => require('expo-file-system/legacy') as FileSystem;

export interface ImportReport {
  format: 'strong' | 'hevy';
  sessions_found: number;
  sessions_new: number;
  sessions_already_imported: number;
  sets: number;
  exercises_matched: Record<string, string>;
  exercises_to_create: string[];
  skipped_rows: Record<string, number>;
  dry_run: boolean;
}

export interface NutritionReport {
  format: 'myfitnesspal';
  meals_found: number;
  meals_new: number;
  meals_already_imported: number;
  first_day: string | null;
  last_day: string | null;
  skipped_rows: Record<string, number>;
  dry_run: boolean;
}

type Kind = 'workouts' | 'nutrition';

export default function ImportHistory() {
  const [kind, setKind] = useState<Kind>('workouts');
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [food, setFood] = useState<NutritionReport | null>(null);
  const [foodDone, setFoodDone] = useState<NutritionReport | null>(null);
  const [csv, setCsv] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [done, setDone] = useState<ImportReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (text: string, dryRun: boolean) => {
    setError(null);
    setBusy(true);
    try {
      if (kind === 'nutrition') {
        const out = await api.post<NutritionReport>('/imports/nutrition', { csv: text, dry_run: dryRun });
        if (dryRun) setFood(out); else setFoodDone(out);
        return;
      }
      const out = await api.post<ImportReport>('/imports/workouts', {
        csv: text, format: 'auto', weight_unit: unit, dry_run: dryRun,
      });
      if (dryRun) setReport(out); else setDone(out);
    } catch (e) {
      setError(e instanceof ApiError && e.status < 500
        ? e.message
        : "That didn't work. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const choose = async () => {
    setError(null);
    const picked = await picker().getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/vnd.ms-excel'],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const file = picked.assets[0];
    const text = await files().readAsStringAsync(file.uri);
    setName(file.name);
    setCsv(text);
    setReport(null);
    setFood(null);
    await run(text, true);
  };

  if (foodDone) {
    return (
      <ScreenScaffold title="Imported">
        <View style={{ gap: space.md }} testID="import-done">
          <Text variant="body">
            {count(foodDone.meals_new, 'meal')} from MyFitnessPal are now in your diary.
          </Text>
          <Button title="See the diary" onPress={() => router.replace('/nutrition')} />
        </View>
      </ScreenScaffold>
    );
  }

  if (done) {
    return (
      <ScreenScaffold title="Imported">
        <View style={{ gap: space.md }} testID="import-done">
          <Text variant="body">
            {count(done.sessions_new, 'workout')} and {count(done.sets, 'set')} are now in your history.
          </Text>
          <Button title="See history" onPress={() => router.replace('/train/history')} />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title="Import history" subtitle="From Strong, Hevy or MyFitnessPal">
      <View style={{ gap: space.lg }}>
        <Labelled label="What are you bringing over?">
          <Chips testID="import-kind" value={kind}
            onChange={(k) => { setKind(k); setReport(null); setFood(null); setCsv(null); setName(null); }}
            options={[
              { value: 'workouts', label: 'Workouts', a11y: 'Workouts, from Strong or Hevy' },
              { value: 'nutrition', label: 'Nutrition', a11y: 'Nutrition, from MyFitnessPal' },
            ]} />
        </Labelled>
        {kind === 'workouts' ? (
          <>
            <Text variant="body" tone="ink2">
              In Strong: Settings → Export data. In Hevy: Settings → Export & import data → Export workouts.
              Save the CSV to your phone, then choose it here.
            </Text>
            <Labelled label="Weights in the file are in">
              <Chips testID="import-unit" value={unit} onChange={setUnit}
                options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} />
            </Labelled>
          </>
        ) : (
          <Text variant="body" tone="ink2">
            In MyFitnessPal (web): Settings → Export data, then save the Nutrition Summary CSV to your
            phone. It holds each meal's totals, not the foods, so each meal comes in as one entry.
          </Text>
        )}
        <Button title={name ? 'Choose a different file' : 'Choose the export file'} kind="ghost"
          loading={busy && !report} testID="import-choose" onPress={() => { void choose(); }} />

        {report ? <Preview report={report} /> : null}
        {food ? (
          <Card testID="import-preview">
            <Text variant="title">MyFitnessPal export · {count(food.meals_found, 'meal')}</Text>
            <Text variant="body" style={{ marginTop: space.sm }}>
              {count(food.meals_new, 'new meal')}
              {food.first_day ? ` from ${food.first_day} to ${food.last_day}` : ''}
              {food.meals_already_imported > 0 ? ` · ${food.meals_already_imported} already imported` : ''}
            </Text>
            {Object.entries(food.skipped_rows).map(([why, n]) => (
              <Text key={why} variant="caption" tone="ink3">{n} {why}</Text>
            ))}
          </Card>
        ) : null}

        {error ? <Text variant="caption" tone="crit" testID="import-error">{error}</Text> : null}

        {food && csv ? (
          <Button
            title={food.meals_new > 0 ? `Import ${count(food.meals_new, 'meal')}` : 'Nothing new to import'}
            disabled={food.meals_new === 0}
            loading={busy}
            testID="import-confirm"
            onPress={() => { void run(csv, false); }}
          />
        ) : null}

        {report && csv ? (
          <Button
            title={report.sessions_new > 0 ? `Import ${count(report.sessions_new, 'workout')}` : 'Nothing new to import'}
            disabled={report.sessions_new === 0}
            loading={busy}
            testID="import-confirm"
            onPress={() => { void run(csv, false); }}
          />
        ) : null}
      </View>
    </ScreenScaffold>
  );
}

function Preview({ report }: { report: ImportReport }) {
  const matched = Object.entries(report.exercises_matched);
  const skipped = Object.entries(report.skipped_rows);
  return (
    <Card testID="import-preview">
      <Text variant="title">
        {report.format === 'strong' ? 'Strong' : 'Hevy'} export · {count(report.sessions_found, 'workout')}
      </Text>
      <Text variant="body" style={{ marginTop: space.sm }}>
        {count(report.sessions_new, 'new workout')} with {count(report.sets, 'set')}
        {report.sessions_already_imported > 0 ? ` · ${report.sessions_already_imported} already imported` : ''}
      </Text>
      {matched.length > 0 ? (
        <View style={{ marginTop: space.md, gap: 2 }}>
          <Text variant="label">Matched to FitLog exercises</Text>
          {matched.map(([from, to]) => (
            <Text key={from} variant="caption" tone="ink2">{from} → {to}</Text>
          ))}
        </View>
      ) : null}
      {report.exercises_to_create.length > 0 ? (
        <View style={{ marginTop: space.md, gap: 2 }}>
          <Text variant="label">New custom exercises</Text>
          <Text variant="caption" tone="ink2">{report.exercises_to_create.join(', ')}</Text>
        </View>
      ) : null}
      {skipped.length > 0 ? (
        <View style={{ marginTop: space.md, gap: 2 }}>
          <Text variant="label">Skipped</Text>
          {skipped.map(([why, n]) => (
            <Text key={why} variant="caption" tone="ink3">{n} {why}</Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
