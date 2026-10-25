import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/theme';

export function Card({ tone = 'surface', style, ...props }: ViewProps & { tone?: 'surface' | 'accent' | 'tonal' }) {
  const { theme } = useTheme();
  return <View {...props} style={[{ padding: theme.spacing.lg, gap: theme.spacing.md, borderRadius: theme.radius.card,
    backgroundColor: tone === 'accent' ? theme.colors.primaryContainer : tone === 'tonal' ? theme.colors.secondaryContainer : theme.colors.surfaceContainer }, style]} />;
}
