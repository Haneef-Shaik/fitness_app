/**
 * A-03's strength meter, shared with A-05 and K-02.
 *
 * Advisory, never blocking above the minimum (A-03). The bars were colour and
 * length only; the word beside them — and the one name a screen reader hears —
 * say the same thing, so nothing depends on seeing green.
 */
import React from 'react';
import { View } from 'react-native';
import { Text } from '@/ui';
import { useTheme } from '@/theme';
import { passwordStrength } from './password';

export function PasswordStrength({ password }: { password: string }) {
  const { c } = useTheme();
  const { bars, label } = passwordStrength(password);
  return (
    <View
      accessible
      accessibilityLabel={label ? `Password strength: ${label}` : 'Password strength'}
      testID="password-strength"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}
    >
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ flex: 1, height: 4, borderRadius: 2,
          backgroundColor: i < bars ? c.good : c.line2 }} />
      ))}
      <Text variant="caption" tone="ink3" style={{ minWidth: 64, textAlign: 'right' }}>{label}</Text>
    </View>
  );
}
