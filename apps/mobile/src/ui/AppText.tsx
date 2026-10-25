import { Text, type TextProps } from 'react-native';
import { useTheme, type AppTheme } from '@/theme';
import { getCurrentLocale } from '@/lib/i18n';
import { hindiFonts } from '@/theme/tokens';

interface AppTextProps extends TextProps {
  variant?: keyof AppTheme['typography'];
  tone?: 'default' | 'muted' | 'accent' | 'error';
}

export function AppText({ variant = 'body', tone = 'default', style, ...props }: AppTextProps) {
  const { theme } = useTheme();
  const color = {
    default: theme.colors.onSurface,
    muted: theme.colors.onSurfaceVariant,
    accent: theme.colors.primary,
    error: theme.colors.error,
  }[tone];
  const hindi = getCurrentLocale() === 'hi' && variant !== 'number';
  return <Text {...props} style={[theme.typography[variant], { color }, hindi && {
    fontFamily: theme.typography[variant].fontWeight === '400' ? hindiFonts.regular : hindiFonts.bold,
    lineHeight: Math.ceil(theme.typography[variant].lineHeight * 1.2),
  }, style]} />;
}
