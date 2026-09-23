/** A-02 Welcome */
import { router } from 'expo-router';
import { View } from 'react-native';
import { ScreenSafeArea } from '@/ui/ScreenSafeArea';
import { Button, Card, Text } from '@/ui';
import { useTheme, space, radius } from '@/theme';

export default function Welcome() {
  const { c } = useTheme();
  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: c.page }}>
      <View style={{ flex: 1, padding: space.lg, justifyContent: 'space-between' }}>
        <View>
          <View style={{
            width: 52, height: 52, borderRadius: 17, backgroundColor: c.accent,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: c.accent, shadowOpacity: 0.6, shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 }, elevation: 8,
          }}>
            <Text variant="h1" tone="accentInk" style={{ fontSize: 28 }}>⚡</Text>
          </View>

          <Text variant="display" style={{ marginTop: space.xl }}>Train. Eat.{'\n'}See what{'\n'}changed.</Text>
          <Text variant="body" tone="ink2" style={{ marginTop: space.base, lineHeight: 23 }}>
            Log workouts in seconds. Track calories from a photo. Watch the numbers move.
          </Text>

          <Card hero style={{ marginTop: space.xl }}>
            <Text variant="label">A set takes one tap</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 16, marginTop: 10 }}>
              <View style={{ alignItems: 'center' }}>
                <Text variant="entry" style={{ fontSize: 44 }}>102.5</Text>
                <Text variant="label">kg</Text>
              </View>
              <Text variant="stat" tone="ink3" style={{ paddingBottom: 12 }}>×</Text>
              <View style={{ alignItems: 'center' }}>
                <Text variant="entry" style={{ fontSize: 44 }}>8</Text>
                <Text variant="label">reps</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.base }}>
              <View style={{ backgroundColor: c.accent, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text variant="caption" tone="accentInk" style={{ fontSize: 11 }}>NEW PR</Text>
              </View>
              <Text variant="caption" tone="good">▲ 2.5 kg</Text>
            </View>
          </Card>
        </View>

        <View style={{ gap: space.md }}>
          <Button title="Create account" onPress={() => router.push('/register')} />
          <Button title="I already have one" kind="ghost" size="sm" onPress={() => router.push('/login')} />
          <Text variant="caption" tone="ink3" style={{ textAlign: 'center', marginTop: 4 }}>
            By continuing you agree to the Terms and Privacy Policy.
          </Text>
        </View>
      </View>
    </ScreenSafeArea>
  );
}
