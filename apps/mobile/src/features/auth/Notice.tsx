/**
 * A form's banner — an error, a confirmation or a plain note.
 *
 * Never colour alone: each tone has its own icon and the words carry the whole
 * meaning. An error is an `alert` and every tone is a polite live region, so a
 * screen reader hears the result of a submit without hunting for it.
 */
import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/ui';
import { radius, space, useTheme } from '@/theme';

type Tone = 'crit' | 'good' | 'info';

const ICON: Record<Tone, string> = {
  crit: 'alert-circle-outline',
  good: 'checkmark-circle-outline',
  info: 'information-circle-outline',
};

export function Notice({ tone, children, testID }: {
  tone: Tone; children: React.ReactNode; testID?: string;
}) {
  const { c } = useTheme();
  const edge = tone === 'crit' ? c.crit : tone === 'good' ? c.good : c.line2;
  const icon = tone === 'crit' ? c.crit : tone === 'good' ? c.good : c.ink3;
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole={tone === 'crit' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row', gap: space.sm, alignItems: 'flex-start',
        borderWidth: 1, borderColor: edge, borderRadius: radius.card, padding: 12,
      }}
    >
      <Ionicons name={ICON[tone] as never} size={18} color={icon} />
      <Text variant="caption" tone={tone === 'info' ? 'ink2' : tone} style={{ flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}
