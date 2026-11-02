import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  large?: boolean;
}

export function AppButton({ label, onPress, variant = 'primary', disabled = false, loading = false, large = false }: AppButtonProps) {
  const { theme: { colors, radius, spacing, dimensions } } = useTheme();
  const [focused, setFocused] = useState(false);
  const unavailable = disabled || loading;
  const background = unavailable ? colors.surfaceHigh : variant === 'primary' ? colors.primaryContainer : colors.secondaryContainer;
  const foreground = unavailable ? colors.onSurfaceVariant : variant === 'primary' ? colors.onPrimaryContainer : colors.onSecondaryContainer;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => ({
        backgroundColor: background,
        // Focus draws the inset border in the label colour, which holds contrast on the fill it sits on in
        // both schemes; `primary` cannot, because Dark draws it in the primary fill's own lime. The ring
        // follows the focus and blur events React Native reports, with no availability gate, so focus
        // reported while disabled or loading shows as onSurfaceVariant on surfaceHigh. RN's JS layer keeps
        // the button focusable and forwards focus there, but RN Android disables the native view, so whether
        // a device gives or keeps focus on an unavailable button is unverified.
        borderColor: focused ? foreground : pressed ? colors.primary : background,
        borderWidth: dimensions.focusRing,
        minHeight: large ? dimensions.loggerButtonHeight : dimensions.buttonHeight,
        borderRadius: radius.full,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        justifyContent: 'center',
      })}
    >
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' }}>
        {loading && <ActivityIndicator accessible={false} color={foreground} />}
        <AppText variant="label" style={{ color: foreground, flexShrink: 1, textAlign: 'center' }}>{label}</AppText>
      </View>
    </Pressable>
  );
}
