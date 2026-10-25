import { Tabs } from 'expo-router';
import { useTheme } from '@/theme';
import { t } from '@/lib/i18n';
import { MomentumAsset } from '@/ui/MomentumAsset';
export default function GymTabs() {
  const { theme } = useTheme();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.colors.primary, tabBarInactiveTintColor: theme.colors.onSurfaceVariant, tabBarStyle: { backgroundColor: theme.colors.surfaceContainer, minHeight: theme.dimensions.tabBarHeight, borderTopWidth: 0 }, tabBarLabelStyle: theme.typography.label }}>
    <Tabs.Screen name="today" options={{ title: t('today'), tabBarIcon: ({ color }) => <MomentumAsset name="imgIconHomeFill" tint={color} /> }} /><Tabs.Screen name="members" options={{ title: t('members'), tabBarIcon: ({ color }) => <MomentumAsset name="imgGymGroups" tint={color} /> }} /><Tabs.Screen name="money" options={{ title: t('money'), tabBarIcon: ({ color }) => <MomentumAsset name="imgGymRupee" tint={color} /> }} /><Tabs.Screen name="visits" options={{ title: t('visits'), tabBarIcon: ({ color }) => <MomentumAsset name="imgGymVisits" tint={color} /> }} /><Tabs.Screen name="more" options={{ title: t('more'), tabBarIcon: ({ color }) => <MomentumAsset name="imgGymMore" tint={color} /> }} />
  </Tabs>;
}
