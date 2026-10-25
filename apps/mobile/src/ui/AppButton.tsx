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
        borderColor: focused || pressed ? colors.primary : background,
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
