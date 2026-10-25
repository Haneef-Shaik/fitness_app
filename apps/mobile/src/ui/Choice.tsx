import { Pressable } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

export function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { theme } = useTheme();
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={{ minHeight: theme.dimensions.touchTarget,
    justifyContent: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderRadius: theme.radius.full,
    backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surfaceHigh }}>
    <AppText variant="label" style={{ color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurface }}>{label}</AppText>
  </Pressable>;
}
