/**
 * F-03 · Session Detail — a finished session, read-only.
 *
 * Not `app/session/[id]`, which is the live logger. A past session is a record,
 * and the wireframe is explicit that it must offer **no affordance suggesting
 * editing** until F-04 is entered deliberately: a screen that looks editable
 * invites a change to history that the user did not mean to make.
 *
 * Every number shown is the server's. It computed them inside the finish
 * transaction, and AC-06 requires this screen, E-08 and G-02 to agree.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import type { SessionExercise, WorkoutSet } from '@fitlog/api-types';
import { Button, Card, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { formatDuration, formatVolume, relativeDay } from '@/features/history/format';
import { useSession } from '@/features/workout-session/useSession';
import { space } from '@/theme';
import { count } from '@/features/nutrition/format';

export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useSession(id);

  return (
    <ScreenScaffold
      title="Session"
      action={{ label: 'Edit', onPress: () => router.push(`/train/history/${id}/edit`) }}
    >
      <DataBoundary
        query={query}
        empty={{ title: 'That session no longer exists.' }}
        isEmpty={(s) => !s}
      >
        {(session) => (
          <View style={{ gap: space.lg }}>
            <Card hero>
              <Pill>{relativeDay(session.local_date, new Date().toISOString().slice(0, 10))}</Pill>
              <Text variant="display" style={{ fontSize: 26, marginTop: 10 }}>
                {session.local_date}
              </Text>
              <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                {[
                  formatDuration(session.duration_seconds),
                  formatVolume(session.total_volume_kg),
                ].filter(Boolean).join(' · ') || 'No sets recorded'}
              </Text>
              <Button
                title="Compare with previous"
                kind="ghost"
                size="sm"
                style={{ marginTop: space.base }}
                onPress={() => router.push(`/train/history/compare?sessions=${id}`)}
              />
            </Card>

            {session.notes ? (
              <Card testID="session-notes">
                <Text variant="label" accessibilityRole="header">Notes</Text>
                <Text variant="body" style={{ marginTop: 4 }}>{session.notes}</Text>
              </Card>
            ) : null}

            {(session.exercises ?? []).map((se) => (
              <ExerciseBlock key={se.id} se={se} />
            ))}
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}

function ExerciseBlock({ se }: { se: SessionExercise }) {
  const sets = se.sets ?? [];
  return (
    <View>
      <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>
        {se.exercise_name ?? 'Exercise'}
      </Text>
      <Card>
        {sets.length === 0 ? (
          <Text variant="caption" tone="ink3">Skipped</Text>
        ) : (
          sets.map((s, i) => <SetRow key={s.id} set={s} index={i} />)
        )}
        {se.notes ? (
          <Text variant="caption" tone="ink2" style={{ marginTop: space.sm }}>✎ {se.notes}</Text>
        ) : null}
      </Card>
    </View>
  );
}

const TYPE_PILL: Partial<Record<WorkoutSet['set_type'], string>> = {
  warmup: 'warm-up', drop: 'drop', failure: 'failure',
};

function SetRow({ set, index }: { set: WorkoutSet; index: number }) {
  const load = set.load_kg === null || set.load_kg === undefined ? null : `${set.load_kg} kg`;
  const reps = set.reps === null || set.reps === undefined ? null : count(set.reps, 'rep');
  const detail = [load, reps].filter(Boolean).join(' × ') || '—';
  const effort = [
    set.rpe != null ? `RPE ${set.rpe}` : null,
    set.rir != null ? `RIR ${set.rir}` : null,
  ].filter(Boolean).join(' · ');
  const kind = TYPE_PILL[set.set_type];
  return (
    <View
      style={{ paddingVertical: 6 }}
      accessible
      accessibilityLabel={`Set ${index + 1}, ${detail}${kind ? `, ${kind}` : ''}`
        + `${effort ? `, ${effort}` : ''}${set.note ? `. Note: ${set.note}` : ''}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Text variant="caption" tone="ink3" style={{ width: 20 }}>{index + 1}</Text>
        <Text variant="body" style={{ flex: 1 }}>{detail}</Text>
        {effort ? <Text variant="caption" tone="ink3">{effort}</Text> : null}
        {/* Warm-ups are marked because they are excluded from volume (I3) — an
            unexplained gap between the sets shown and the total reads as a bug.
            Drop sets likewise, because they never set a record. */}
        {kind ? <Pill kind="mute">{kind}</Pill> : null}
        {set.is_pr ? <Pill kind="good">PR</Pill> : null}
      </View>
      {set.note ? (
        <Text variant="caption" tone="ink2" style={{ marginLeft: 28, marginTop: 2 }}>{set.note}</Text>
      ) : null}
    </View>
  );
}
