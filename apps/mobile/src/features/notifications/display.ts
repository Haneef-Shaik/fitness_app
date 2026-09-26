/**
 * Show a notification even while the app is open. By default one that arrives
 * in the foreground is dropped silently — the one time the user is already
 * looking at the phone.
 *
 * Set once at start-up, for every notification. It used to be set only when
 * reminders were scheduled, so an app run that scheduled none — reminders
 * off, or started offline — silently dropped every reminder and "your meal
 * estimate is ready" that arrived while it was open (found on the emulator).
 */
import { Platform } from 'react-native';

type Notifications = typeof import('expo-notifications');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const notifications = () => require('expo-notifications') as Notifications;

let configured = false;

export function showWhileOpen(): void {
  if (configured || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return;
  configured = true;
  notifications().setNotificationHandler({
    // SDK 53 split the old `shouldShowAlert` into these two; both on is what it meant.
    handleNotification: async () => ({
      shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
    }),
  });
}
