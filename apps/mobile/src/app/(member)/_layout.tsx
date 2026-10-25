import { Tabs } from 'expo-router';
import { useTheme } from '@/theme';
import { t } from '@/lib/i18n';
import { MomentumAsset } from '@/ui/MomentumAsset';

export default function MemberTabs() {
  const { theme } = useTheme();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.colors.onSurface, tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
    tabBarStyle: { backgroundColor: theme.colors.surfaceContainer, borderTopWidth: 0, minHeight: theme.dimensions.tabBarHeight },
    tabBarLabelStyle: theme.typography.caption }}>
    <Tabs.Screen name="today" options={{ title: t('today'), tabBarIcon: () => <MomentumAsset name="imgIconHomeFill" /> }} />
    <Tabs.Screen name="train" options={{ title: t('train'), tabBarIcon: () => <MomentumAsset name="imgIconExercise" /> }} />
    <Tabs.Screen name="food" options={{ title: t('food'), tabBarIcon: () => <MomentumAsset name="imgIconRestaurant" /> }} />
    <Tabs.Screen name="progress" options={{ title: t('progress'), tabBarIcon: () => <MomentumAsset name="imgIconMonitoring" /> }} />
  </Tabs>;
}
