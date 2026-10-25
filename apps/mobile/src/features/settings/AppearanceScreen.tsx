import { useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { t } from '@/lib/i18n';
import { useTheme, type ThemePreference } from '@/theme';
import { AppButton, AppText, Screen } from '@/ui';

const choices = [
  { value: 'system', label: 'system', detail: 'systemDetail' },
  { value: 'light', label: 'light', detail: 'lightDetail' },
  { value: 'dark', label: 'dark', detail: 'darkDetail' },
] as const;

function AppearanceOption({ value, label, detail }: { value: ThemePreference; label: string; detail: string }) {
  const { theme, preference, setPreference } = useTheme();
  const [focused, setFocused] = useState(false);
  const selected = preference === value;
  const { colors, dimensions, spacing, radius } = theme;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityHint={detail}
      accessibilityState={{ checked: selected }}
      onPress={() => { void setPreference(value); }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => ({
        minHeight: dimensions.touchTarget,
        backgroundColor: pressed ? colors.surfaceHighest : selected ? colors.secondaryContainer : colors.surfaceContainer,
        padding: spacing.lg,
        borderRadius: radius.list,
        borderWidth: dimensions.focusRing,
        borderColor: focused ? colors.primary : selected ? colors.outline : colors.surfaceContainer,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
      })}
    >
      <View style={{ flex: 1, gap: spacing.xs }}>
        <AppText variant="label" style={selected ? { color: colors.onSecondaryContainer } : undefined}>{label}</AppText>
        <AppText style={selected ? { color: colors.onSecondaryContainer } : undefined} tone="muted">{detail}</AppText>
      </View>
      <View accessible={false} style={{
        width: dimensions.icon,
        height: dimensions.icon,
        borderRadius: radius.full,
        borderWidth: dimensions.focusRing,
        borderColor: selected ? colors.onSecondaryContainer : colors.outline,
        padding: spacing.xs,
      }}>
        {selected && <View style={{ flex: 1, borderRadius: radius.full, backgroundColor: colors.onSecondaryContainer }} />}
      </View>
    </Pressable>
  );
}

export function AppearanceScreen() {
  const { theme, preference, storageError, setPreference } = useTheme();
  const { colors, spacing, radius, dimensions } = theme;
  return (
    <Screen>
      <View style={{ gap: spacing.md }}>
        <AppText variant="headline" accessibilityRole="header">{t('appearance')}</AppText>
        <AppText tone="muted">{t('appearanceIntro')}</AppText>
      </View>

      <View style={{ gap: spacing.md }} accessibilityRole="radiogroup" accessibilityLabel={t('colorScheme')}>
        <AppText variant="title" accessibilityRole="header">{t('colorScheme')}</AppText>
        {choices.map((choice) => <AppearanceOption key={choice.value} value={choice.value} label={t(choice.label)} detail={t(choice.detail)} />)}
      </View>

      <View style={{ gap: spacing.md }}>
        <AppText variant="title" accessibilityRole="header">{t('preview')}</AppText>
        <View style={{
          backgroundColor: colors.surfaceContainer,
          padding: spacing.xl,
          borderRadius: radius.card,
          minHeight: dimensions.previewMinHeight,
          gap: spacing.lg,
        }}>
          <AppText variant="display">{t('previewTitle')}</AppText>
          <AppText tone="muted">{t('previewBody')}</AppText>
          <View style={{ backgroundColor: colors.primaryContainer, borderRadius: radius.full, padding: spacing.lg, minHeight: dimensions.buttonHeight, justifyContent: 'center' }}>
            <AppText variant="label" style={{ color: colors.onPrimaryContainer, textAlign: 'center' }}>{t('sampleAction')}</AppText>
          </View>
          <AppText variant="caption" tone="muted">{t('previewHint')}</AppText>
        </View>
      </View>

      {storageError ? <View accessibilityLiveRegion="polite" style={{ gap: spacing.md }}>
        <AppText tone="error">{t(storageError === 'read' ? 'storageReadError' : 'storageWriteError')}</AppText>
        <AppButton label={t('retrySave')} variant="secondary" onPress={() => { void setPreference(preference); }} />
      </View> : <AppText variant="caption" tone="muted">{t('savedLocally')}</AppText>}

      {__DEV__ && <Link href="/design-system" asChild>
        <Pressable accessibilityRole="link" style={{ minHeight: dimensions.touchTarget, justifyContent: 'center' }}>
          <AppText tone="accent" variant="label">{t('componentGallery')}</AppText>
        </Pressable>
      </Link>}
    </Screen>
  );
}
