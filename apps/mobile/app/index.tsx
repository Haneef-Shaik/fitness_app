/** A-01 Splash / Session Bootstrap — decides where the user belongs before showing anything. */
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/theme';
import { useSession } from '@/lib/session';

export default function Index() {
  const { status } = useSession();
  const { c } = useTheme();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: c.page, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }
  if (status === 'signed-out') return <Redirect href="/welcome" />;
  if (status === 'onboarding') return <Redirect href="/onboarding" />;
  return <Redirect href="/home" />;
}
