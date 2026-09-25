/**
 * F-05 · Previous Occurrence ★
 *
 * **This screen exists solely to satisfy AC-05**: "retrieve the previous
 * chest-focused session without knowing its date."
 *
 * The widening notice is not decoration. PRD §7.2 makes it part of the
 * normative rule — *"the query widens to `role IN ('primary','secondary')` and
 * the UI states that it widened"* — because a silently widened answer is a
 * wrong answer presented as a right one. The user asked for their last chest
 * day; if nothing had chest as a primary muscle they are owed that fact, not a
 * shrug.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Button, Card, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { formatDuration, formatVolume, relativeDay } from '@/features/history/format';
import { usePreviousOccurrence } from '@/lib/query/hooks';
import { space } from '@/theme';

export default function PreviousOccurrence() {
  const { muscle } = useLocalSearchParams<{ muscle: string }>();
  const query = usePreviousOccurrence(muscle ?? '');
  const label = (muscle ?? '').replace(/-/g, ' ');

  return (
    <ScreenScaffold title={`Your previous ${label} day`}>
      <DataBoundary
        query={query}
        // `data: null` is "never trained", which is a prompt and not an error.
        isEmpty={(d) => d === null || d === undefined}
        empty={{
          title: `You haven't trained ${label} yet`,
          body: 'Once you finish a session with it, this is where it turns up.',
          action: {
            label: 'Find exercises',
            onPress: () => router.push(`/train/exercises?muscle=${muscle}`),
          },
        }}
      >
        {(found) => !found ? null : (
          <View style={{ gap: space.lg }} testID="previous-occurrence">
            {found.widened ? (
              <Card testID="widened-notice">
                <Text variant="body">
                  No session had {label} as a primary muscle.
                </Text>
                <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                  Showing the most recent one that trained {label} at all.
                </Text>
              </Card>
            ) : null}

            <Card hero>
              <Pill>
                {relativeDay(found.local_date, new Date().toISOString().slice(0, 10))}
              </Pill>
              <Text variant="display" style={{ fontSize: 26, marginTop: 10 }}>
                {found.local_date}
              </Text>
              <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                {[
                  formatDuration(found.duration_seconds),
                  formatVolume(found.total_volume_kg),
                ].filter(Boolean).join(' · ') || 'No sets recorded'}
              </Text>
              <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
                Found by: exercises with {found.muscle_name.toLowerCase()} as a{' '}
                {found.role_matched} muscle
              </Text>
            </Card>

            <View>
              <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>In that session</Text>
              <Card>
                {found.exercise_names.length === 0 ? (
                  <Text variant="caption" tone="ink3">No exercises recorded</Text>
                ) : (
                  found.exercise_names.map((name, i) => (
                    <Text key={`${name}-${i}`} variant="body" style={{ paddingVertical: 4 }}>
                      {name}
                    </Text>
                  ))
                )}
              </Card>
            </View>

            <Button
              title="Full session"
              onPress={() => router.push(`/train/history/${found.session_id}`)}
            />
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
