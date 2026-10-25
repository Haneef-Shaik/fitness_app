import { useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Screen } from '@/ui';

export function ComponentGalleryScreen() {
  const { theme } = useTheme();
  const [completed, setCompleted] = useState(false);
  return (
    <Screen>
      <AppText variant="headline" accessibilityRole="header">{t('componentGallery')}</AppText>
      <AppText tone="muted">{t('galleryIntro')}</AppText>
      <View style={{ gap: theme.spacing.lg }}>
        <AppText variant="display">{t('previewTitle')}</AppText>
        <AppText>{t('bodySample')}</AppText>
        <AppText tone="error">{t('errorSample')}</AppText>
        <AppButton label={t('primaryButton')} onPress={() => setCompleted(true)} />
        <AppButton label={t('secondaryButton')} variant="secondary" onPress={() => setCompleted(false)} />
        <AppButton label={t('disabledButton')} disabled onPress={() => setCompleted(true)} />
        <AppButton label={t('loadingButton')} loading onPress={() => setCompleted(true)} />
        {completed && <AppText accessibilityLiveRegion="polite">{t('exampleComplete')}</AppText>}
      </View>
      <Link href="/" asChild>
        <Pressable accessibilityRole="link" style={{ minHeight: theme.dimensions.touchTarget, justifyContent: 'center' }}>
          <AppText tone="accent">{t('backToAppearance')}</AppText>
        </Pressable>
      </Link>
    </Screen>
  );
}
