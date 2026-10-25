import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

export function Header({ title, back = false, action, onAction }: { title: string; back?: boolean; action?: string; onAction?: () => void }) {
  const router = useRouter(); const { theme } = useTheme();
  return <View style={{ gap: theme.spacing.md }}>
    {back && <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} accessibilityRole="button" style={{ minHeight: theme.dimensions.touchTarget, justifyContent: 'center' }}><AppText tone="accent">{t('back')}</AppText></Pressable>}
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md }}>
      <AppText variant="headline" accessibilityRole="header" style={{ flex: 1 }}>{title}</AppText>
      {action && <Pressable onPress={onAction} accessibilityRole="button" style={{ minHeight: theme.dimensions.touchTarget, justifyContent: 'center' }}><AppText tone="accent" variant="label">{action}</AppText></Pressable>}
    </View>
  </View>;
}
