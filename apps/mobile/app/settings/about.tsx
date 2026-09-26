/**
 * K-10 · About (launch).
 *
 * The version, the legal documents both stores ask to be reachable in the app,
 * the open-source licences, a way to reach support, and the PRD's guardrail
 * said once, plainly: FitLog shows **estimates, not medical advice**.
 *
 * Terms and Privacy open in the browser (`src/lib/legal.ts` says where they
 * point). A support address that has not been configured is said to be
 * missing rather than hidden, so a build without one is noticed before it is
 * submitted.
 */
import { router } from 'expo-router';
import { Linking, Platform, View } from 'react-native';
import Constants from 'expo-constants';
import { Card, Text } from '@/ui';
import { NavGroup, NavRow } from '@/ui/NavRow';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { legalLinks, supportMailto } from '@/lib/legal';
import { space } from '@/theme';

function appVersion(): string {
  return Constants.expoConfig?.version ?? 'unknown';
}

export default function About() {
  const links = legalLinks();
  const version = appVersion();
  const open = (url: string) => { void Linking.openURL(url); };

  return (
    <ScreenScaffold title="About">
      <View style={{ gap: space.lg }}>
        <View>
          <Text variant="h2">FitLog</Text>
          <Text variant="caption" tone="ink3">Version {version} · {Platform.OS}</Text>
        </View>

        <Card testID="about-estimates">
          <Text variant="title">Estimates, not medical advice</Text>
          <Text variant="body" tone="ink2" style={{ marginTop: 4 }}>
            AI food analyses, calorie and macro targets and estimated one-rep maxes are
            estimates, for your information. FitLog isn't a medical device. Talk to a doctor or
            another qualified professional before changing how you train or eat — especially if
            you have a health condition, are pregnant, or have a history of disordered eating.
          </Text>
        </Card>

        <NavGroup>
          <NavRow icon="document-text-outline" label="Terms of Service"
            onPress={() => open(links.terms)} />
          <NavRow icon="shield-checkmark-outline" label="Privacy Policy"
            onPress={() => open(links.privacy)} />
          <NavRow icon="code-slash-outline" label="Open-source licences"
            onPress={() => router.push('/settings/licences')} />
          {links.supportEmail ? (
            <NavRow icon="mail-outline" label="Contact support" detail={links.supportEmail}
              onPress={() => open(supportMailto(links.supportEmail!, { version, platform: Platform.OS }))} />
          ) : null}
        </NavGroup>

        {links.supportEmail ? null : (
          <Text variant="caption" tone="ink3">
            A support address hasn't been set for this build (EXPO_PUBLIC_SUPPORT_EMAIL).
          </Text>
        )}

        <Text variant="caption" tone="ink3">
          Nutrition data: FitLog's own food catalogue. Food photos and descriptions are analysed
          by the AI provider named in AI preferences.
        </Text>
      </View>
    </ScreenScaffold>
  );
}
