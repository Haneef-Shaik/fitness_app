/**
 * L-04 · Not Found — an address the app does not have.
 *
 * Reached from an old deep link, a notification for something since deleted,
 * or a typo in a shared link. It says what happened and offers the way home;
 * a blank screen here reads as the app having broken. A record that existed
 * and was deleted is handled by the screen that owns it (DataBoundary's empty
 * state), because that screen can say which record it was.
 */
import { Stack, router } from 'expo-router';
import { View } from 'react-native';
import { Button, Text } from '@/ui';
import { ScreenSafeArea } from '@/ui/ScreenSafeArea';
import { space, useTheme } from '@/theme';

export default function NotFound() {
  const { c } = useTheme();
  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: c.page }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, justifyContent: 'center', padding: space.lg, gap: space.md }} testID="not-found">
        <Text variant="title" accessibilityRole="header">That page isn't here</Text>
        <Text variant="body" tone="ink2">
          The link may be old, or what it pointed to has been deleted. Nothing you logged is affected.
        </Text>
        <Button title="Go to Today" testID="not-found-home" onPress={() => router.replace('/home')} />
      </View>
    </ScreenSafeArea>
  );
}
