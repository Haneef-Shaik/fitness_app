import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTheme } from '@/theme';
import { t } from '@/lib/i18n';

export default function MemberTabs() {
  const { theme } = useTheme();
  return <NativeTabs tintColor={theme.colors.primary} backgroundColor={theme.colors.surfaceContainer}>
    <NativeTabs.Trigger name="today"><NativeTabs.Trigger.Label>{t('today')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="house" md="home" /></NativeTabs.Trigger>
    <NativeTabs.Trigger name="train"><NativeTabs.Trigger.Label>{t('train')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="dumbbell" md="exercise" /></NativeTabs.Trigger>
    <NativeTabs.Trigger name="food"><NativeTabs.Trigger.Label>{t('food')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" /></NativeTabs.Trigger>
    <NativeTabs.Trigger name="progress"><NativeTabs.Trigger.Label>{t('progress')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="chart.xyaxis.line" md="monitoring" /></NativeTabs.Trigger>
  </NativeTabs>;
}
