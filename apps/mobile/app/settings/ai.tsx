/**
 * K-08 · AI preferences (launch).
 *
 * What a person should know about the AI before a photo leaves their phone:
 * how many analyses are left today and when that resets, **who receives the
 * photo** and with which model, and what "low confidence" does and does not
 * mean. All of it comes from the server's configuration
 * (`GET /food-analysis/settings`), so the disclosure is where photos actually
 * go, not a sentence here that drifts when the provider changes.
 *
 * "Always show me the result before saving" is shown LOCKED ON, not as a
 * switch (Q7, BRD §12.7): auto-confirming an estimate would break the
 * confirmed-versus-estimated line the whole data model is built on, so it is
 * a guarantee rather than a preference.
 *
 * Not yet: the threshold and retention pickers the wireframe sketches. The
 * threshold is the server's (0.5 today) and there is no retention job.
 */
import { router } from 'expo-router';
import { Linking, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { AnalysisSettings } from '@fitlog/api-types';
import { Button, Card, Meter, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { NavGroup, NavRow } from '@/ui/NavRow';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { legalLinks } from '@/lib/legal';
import { useAnalysisSettings } from '@/lib/query/hooks';
import { untilReset } from '@/features/nutrition/format';
import { space, useTheme } from '@/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="label" accessibilityRole="header">{title}</Text>
      {children}
    </View>
  );
}

function Usage({ quota }: { quota: AnalysisSettings['quota'] }) {
  const countdown = untilReset(quota.resets_at);
  return (
    <Card>
      <View
        accessible
        accessibilityLabel={`Today's usage, ${quota.used} of ${quota.limit} food analyses`}
      >
        <Text variant="label">Today's usage</Text>
        <Text variant="title" style={{ marginVertical: space.sm }}>
          {quota.used} of {quota.limit} used today
        </Text>
        <Meter value={quota.used} max={quota.limit} over={quota.remaining === 0} />
      </View>
      <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
        Resets at midnight, your time{countdown ? ` — ${countdown}` : ''}. You can always add
        meals by hand.
      </Text>
    </Card>
  );
}

function WhereItGoes({ s }: { s: AnalysisSettings }) {
  if (!s.sends_to_provider) {
    return (
      <Text variant="body" tone="ink2">
        No AI provider is set up on this server. Analyses use a built-in test stub, and
        nothing leaves the server.
      </Text>
    );
  }
  return (
    <Text variant="body" tone="ink2">
      Photos and descriptions you submit are sent to {s.provider_name} ({s.model}) to identify
      the foods and estimate portions. Only when you tap to analyse — nothing is sent in the
      background, and nothing is saved until you confirm it.
    </Text>
  );
}

export default function AiPreferences() {
  const { c } = useTheme();
  const query = useAnalysisSettings();

  return (
    <ScreenScaffold title="AI preferences">
      <DataBoundary
        query={query}
        isEmpty={() => false}
        empty={{ title: 'Nothing to show' }}
      >
        {(s) => (
          <View style={{ gap: space.xl }}>
            <Section title="Food analysis">
              <Usage quota={s.quota} />

              <Card>
                <Text variant="title">Low-confidence items</Text>
                <Text variant="body" tone="ink2" style={{ marginTop: 4 }}>
                  Items the model is less than {Math.round(s.low_confidence_threshold * 100)}% sure
                  about start unticked, so you check them before saving. Confidence is how sure
                  the model is that it spotted the food — not how accurate the calories are.
                </Text>
              </Card>

              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  <Ionicons name="lock-closed" size={18} color={c.ink2} />
                  <Text variant="title" style={{ flex: 1 }}>Always show me the result before saving</Text>
                  <Text variant="caption" tone="accent">Always on</Text>
                </View>
                <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                  This can't be turned off. Estimates are never saved without you seeing them.
                </Text>
              </Card>

              <NavGroup>
                <NavRow icon="time-outline" label="View past analyses"
                  onPress={() => router.push('/nutrition/analyses')} />
              </NavGroup>
            </Section>

            <Section title="Where your photos go">
              <WhereItGoes s={s} />
              <Text variant="caption" tone="ink3">Model: {s.model}</Text>
              <Button title="Read the Privacy Policy" kind="ghost" size="sm"
                onPress={() => { void Linking.openURL(legalLinks().privacy); }} />
            </Section>
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
