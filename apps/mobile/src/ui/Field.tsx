import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const { theme: { colors, spacing, radius, typography, dimensions } } = useTheme();
  return <View style={{ gap: spacing.sm }}>
    <AppText variant="label">{label}</AppText>
    <TextInput {...props} accessibilityLabel={label} placeholderTextColor={colors.onSurfaceVariant} selectionColor={colors.primary}
      style={[typography.body, { color: colors.onSurface, backgroundColor: colors.surfaceHigh, borderColor: error ? colors.error : colors.outline, borderWidth: dimensions.border,
        borderRadius: radius.lg, minHeight: dimensions.buttonHeight, padding: spacing.lg }, props.style]} />
    {!!error && <AppText tone="error" accessibilityLiveRegion="polite">{error}</AppText>}
  </View>;
}
