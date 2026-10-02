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
import { Button, Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { IconTile } from '@/ui/IconTile';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { SectionHeader } from '@/ui/SectionHeader';
import { formatDuration, formatVolume, relativeDay } from '@/features/history/format';
import { humanDate } from '@/lib/datetime/humanDate';
import { usePreviousOccurrence } from '@/lib/query/hooks';
import { space, useTheme } from '@/theme';
import { useToday } from '@/lib/datetime/useToday';

export default function PreviousOccurrence() {
  const { c } = useTheme();
  const { muscle } = useLocalSearchParams<{ muscle: string }>();
  const query = usePreviousOccurrence(muscle ?? '');
  const label = (muscle ?? '').replace(/-/g, ' ');
  // A label, not a decision (I7): which day it is only matters for the words.
  const today = useToday();

  return (
    <ScreenScaffold eyebrow="Your previous" title={`${label} day`}>
      <DataBoundary
        query={query}
        // `data: null` is "never trained", which is a prompt and not an error.
        isEmpty={(d) => d === null || d === undefined}
        empty={{
          icon: 'barbell-outline',
          title: `You haven't trained ${label} yet`,
          body: 'Once you finish a session with it, this is where it turns up.',
          action: {
            label: 'Find exercises',
            onPress: () => router.push(`/train/exercises?muscle=${muscle}`),
          },
        }}
      >
        {(found) => !found ? null : (
          <View style={{ gap: space.base }} testID="previous-occurrence">
            {found.widened ? (
              <Card testID="widened-notice">
                <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
                  <IconTile icon="information-circle-outline" size={36} tone="warn" />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="semi">No session had {label} as a primary muscle.</Text>
                    <Text variant="caption" tone="ink3" style={{ marginTop: 2 }}>
                      Showing the most recent one that trained {label} at all.
                    </Text>
                  </View>
                </View>
              </Card>
            ) : null}

            <Card hero label={relativeDay(found.local_date, today)} labelTone="accent">
              <Text variant="h1">{humanDate(found.local_date, today)}</Text>
              <Text variant="body" tone="ink2" style={{ marginTop: space.xs }}>
                {[
                  formatDuration(found.duration_seconds),
                  formatVolume(found.total_volume_kg),
                ].filter(Boolean).join(' · ') || 'No sets recorded'}
              </Text>
              <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
                Picked because it trained {found.muscle_name.toLowerCase()} as a {found.role_matched} muscle.
              </Text>
            </Card>

            <View>
              <SectionHeader title="In that session" detail={`${found.exercise_names.length} exercises`} />
              <Card pad="none">
                {found.exercise_names.length === 0 ? (
                  <Text variant="caption" tone="ink3" style={{ padding: space.base }}>No exercises recorded</Text>
                ) : (
                  found.exercise_names.map((name, i) => (
                    <View
                      key={`${name}-${i}`}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 52,
                        paddingHorizontal: space.md, borderBottomWidth: i === found.exercise_names.length - 1 ? 0 : 1, borderBottomColor: c.line,
                      }}
                    >
                      <IconTile icon="barbell-outline" size={32} tone="ink3" />
                      <Text variant="body" weight="medium" style={{ flex: 1 }} numberOfLines={1}>{name}</Text>
                    </View>
                  ))
                )}
              </Card>
            </View>

            <Button
              title="Open the full session"
              icon="open-outline"
              onPress={() => router.push(`/train/history/${found.session_id}`)}
            />
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
