/**
 * F-04 · Edit Past Session.
 *
 * A deliberate, separate destination — F-03 shows no affordance that suggests
 * editing until someone arrives here on purpose. Changing history should take
 * an act of intent, because the alternative is a stray tap silently rewriting
 * what a user did three weeks ago.
 *
 * Scope note: this goal (G5) is retrieval. The editing surface itself belongs
 * with the session-mutation work, so this screen is the entry point and the
 * honest statement of what it does not yet do — not a half-built form that
 * looks like it saves.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useSession } from '@/features/workout-session/useSession';
import { space } from '@/theme';

export default function EditPastSession() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useSession(id);

  return (
    <ScreenScaffold title="Edit session">
      <DataBoundary
        query={query}
        empty={{ title: 'That session no longer exists.' }}
        isEmpty={(s) => !s}
      >
        {(session) => (
          <View style={{ gap: space.lg }}>
            <Card>
              <Text variant="body">Editing {session.local_date}</Text>
              <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                Correcting a past session is coming with the session-editing work.
                Until then your record stays exactly as you logged it.
              </Text>
            </Card>
            <Button
              title="Back to the session"
              kind="ghost"
              onPress={() => router.back()}
            />
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
