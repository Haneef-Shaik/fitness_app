import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

export function Screen({ children, fill = false, inset = 'lg' }: PropsWithChildren<{ fill?: boolean; inset?: 'lg' | 'xl' }>) {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top', 'right', 'bottom', 'left']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{
          width: '100%',
          maxWidth: theme.dimensions.contentMaxWidth,
          alignSelf: 'center',
          flexGrow: fill ? 1 : 0,
          padding: theme.spacing[inset],
          paddingBottom: theme.spacing.section,
          gap: theme.spacing.xl,
        }}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
