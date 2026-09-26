/**
 * D-02 · Exercise Detail — how to do it, PRs, e1RM trend, recent sessions,
 * never-performed.
 *
 * "How to do it" sits above the records because the person who needs it most
 * is the one who has never logged the exercise — and for them everything
 * below it is empty.
 */
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import type { ExerciseHistoryEntry } from '@fitlog/api-types';
import { Button, Card, Pill, Stat, StatRow, Text, Well } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useExercise, useExerciseHistory, useExerciseStats } from '@/lib/query/hooks';
import { muscleSummary, trackedFields } from '@/features/exercises/format';
import { formatServerDate } from '@/lib/datetime';
import { font, space, useTheme } from '@/theme';

function fmtKg(n: number | null | undefined): string {
  return n === null || n === undefined ? '—' : `${Math.round(n * 10) / 10} kg`;
}

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const exercise = useExercise(id);
  const stats = useExerciseStats(id);
  const history = useExerciseHistory(id);

  const ex = exercise.data;
  const tracks = ex ? trackedFields(ex) : null;
  const records = stats.data?.records ?? {};
  const neverPerformed = stats.isSuccess && (stats.data?.session_count ?? 0) === 0;
  const series = stats.data?.e1rm_series ?? [];

  return (
    <ScreenScaffold title={ex?.name ?? 'Exercise'} subtitle={ex ? ex.equipment : undefined}>
      <DataBoundary query={exercise} empty={{ title: 'That exercise no longer exists.' }}>
        {(e) => (
          <View style={{ gap: space.lg }}>
            {muscleSummary(e) ? (
              <Text variant="caption" tone="ink3">{muscleSummary(e)}</Text>
            ) : null}
            {e.status === 'archived' ? <Pill>archived</Pill> : null}

            {e.instructions ? (
              <View testID="exercise-instructions">
                <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>
                  How to do it
                </Text>
                <Card>
                  <Text variant="body" style={{ lineHeight: 22 }}>{e.instructions}</Text>
                </Card>
              </View>
            ) : null}

            {neverPerformed ? (
              /* The state a NEW USER sees for every exercise — the most viewed
                 state on this screen, and the easiest one to forget. */
              <Card testID="never-performed">
                <Text variant="body" style={{ fontFamily: font.uiSemi }}>
                  You haven't logged this yet
                </Text>
                <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                  Records and the trend appear once you've done it in a workout.
                </Text>
                <Button title="Add to a workout" kind="ghost" size="sm" style={{ marginTop: space.md }} />
              </Card>
            ) : (
              <>
                <Text variant="label">Personal records</Text>
                {/* PR tiles are driven by the tracked fields: an exercise with no
                    load shows rep/time records instead of a load record. */}
                <StatRow>
                  {tracks?.load ? (
                    <Stat value={fmtKg(records.max_load?.value)} label="Max load" />
                  ) : null}
                  {tracks?.reps ? (
                    <Stat
                      value={records.max_reps ? String(Math.round(records.max_reps.value)) : '—'}
                      label="Max reps"
                    />
                  ) : null}
                  <Stat value={fmtKg(records.volume?.value)} label="Best session" />
                  {tracks?.load && tracks?.reps ? (
                    <Stat value={fmtKg(records.estimated_1rm?.value)} label="e1RM" />
                  ) : null}
                </StatRow>

                <View>
                  <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>Estimated 1RM</Text>
                  {series.length === 0 ? (
                    <Well><Text variant="caption" tone="ink3">
                      No estimate yet — it needs a completed working set with load and reps.
                    </Text></Well>
                  ) : series.length === 1 ? (
                    <Well>
                      <Text variant="stat">{fmtKg(series[0]!.e1rm_kg)}</Text>
                      <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                        One session so far — a trend needs at least two.
                      </Text>
                    </Well>
                  ) : (
                    /* The table view is the mandatory non-visual alternative; the
                       chart kit itself belongs to G6 (H6.1). */
                    <Card testID="e1rm-table">
                      {series.slice(-8).map((p) => (
                        <View
                          key={`${p.local_date}-${p.e1rm_kg}`}
                          style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}
                        >
                          <Text variant="caption" tone="ink3">{formatServerDate(p.local_date)}</Text>
                          <Text variant="caption" style={{ fontFamily: font.dataSemi }}>
                            {fmtKg(p.e1rm_kg)}
                          </Text>
                        </View>
                      ))}
                      <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
                        Epley · from working sets only
                      </Text>
                    </Card>
                  )}
                </View>
              </>
            )}

            <View>
              <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>Recent sessions</Text>
              <DataBoundary
                query={history}
                empty={{ title: 'No sessions yet', body: "This will fill in once you've trained it." }}
              >
                {(rows: ExerciseHistoryEntry[]) => (
                  <>
                    {rows.slice(0, 8).map((r) => (
                      <Card key={r.session_id} style={{ marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text variant="body">{formatServerDate(r.local_date)}</Text>
                          <Text variant="body" style={{ fontFamily: font.dataSemi, color: c.ink2 }}>
                            {fmtKg(r.volume_kg)}
                          </Text>
                        </View>
                        <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                          {r.sets.length} {r.sets.length === 1 ? 'set' : 'sets'}
                          {r.best_e1rm_kg ? ` · best e1RM ${fmtKg(r.best_e1rm_kg)}` : ''}
                        </Text>
                      </Card>
                    ))}
                  </>
                )}
              </DataBoundary>
            </View>
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
