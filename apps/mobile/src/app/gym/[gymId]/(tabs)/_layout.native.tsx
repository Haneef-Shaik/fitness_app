import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTheme } from '@/theme';
import { t } from '@/lib/i18n';
export default function GymTabs() { const { theme } = useTheme(); return <NativeTabs tintColor={theme.colors.primary} backgroundColor={theme.colors.surfaceContainer}>
  <NativeTabs.Trigger name="today"><NativeTabs.Trigger.Label>{t('today')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="house" md="home" /></NativeTabs.Trigger>
  <NativeTabs.Trigger name="members"><NativeTabs.Trigger.Label>{t('members')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="person.2" md="groups" /></NativeTabs.Trigger>
  <NativeTabs.Trigger name="money"><NativeTabs.Trigger.Label>{t('money')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="indianrupeesign" md="currency_rupee" /></NativeTabs.Trigger>
  <NativeTabs.Trigger name="visits"><NativeTabs.Trigger.Label>{t('visits')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="qrcode.viewfinder" md="qr_code_scanner" /></NativeTabs.Trigger>
  <NativeTabs.Trigger name="more"><NativeTabs.Trigger.Label>{t('more')}</NativeTabs.Trigger.Label><NativeTabs.Trigger.Icon sf="ellipsis" md="more_horiz" /></NativeTabs.Trigger>
</NativeTabs>; }
