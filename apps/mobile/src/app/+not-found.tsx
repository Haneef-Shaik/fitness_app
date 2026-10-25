import { useRouter } from 'expo-router';
import { t } from '@/lib/i18n';
import { AppButton, AppText, Screen } from '@/ui';

export default function NotFound() {
  const router = useRouter();
  return <Screen>
    <AppText variant="headline" accessibilityRole="header">{t('notFound')}</AppText>
    <AppText>{t('notFoundBody')}</AppText>
    <AppButton label={t('backToAppearance')} onPress={() => router.replace('/')} />
  </Screen>;
}
