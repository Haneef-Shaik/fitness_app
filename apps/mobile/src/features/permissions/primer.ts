/**
 * L-06 · Permission Primer — what each permission is for, said BEFORE the OS asks.
 *
 * The OS dialog can be shown once. A "Don't allow" given without context is
 * permanent until the user finds the setting themselves, so every prompt is
 * preceded by FitLog's own explanation, and a refusal the OS will not ask
 * about again is met with a way to Settings rather than a dead button.
 *
 * Native modules are required lazily, as elsewhere: a static import breaks
 * every test that merely renders a screen that mentions a camera.
 */
import { Platform } from 'react-native';

export type PermissionKind = 'camera' | 'photos' | 'notifications';

export interface PermissionState {
  status: 'granted' | 'denied' | 'undetermined';
  /** False once the OS will no longer show its prompt. */
  canAskAgain: boolean;
}

export const PRIMER_COPY: Record<PermissionKind, { title: string; body: string }> = {
  camera: {
    title: 'Use the camera for meal photos',
    body: 'FitLog photographs a plate so it can estimate what is on it. Photos are only taken when '
      + 'you press the button, their location data is removed, and you review every estimate.',
  },
  photos: {
    title: 'Choose photos from your library',
    body: 'Pick meal or progress photos you have already taken. FitLog only sees the photos you '
      + 'select, never the rest of your library.',
  },
  notifications: {
    title: 'Allow reminders',
    body: 'FitLog can remind you about workouts, meals and check-ins you have switched on. '
      + 'Reminders are set on this phone; nothing is sent anywhere.',
  },
};

type Picker = typeof import('expo-image-picker');
type Notifications = typeof import('expo-notifications');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const picker = () => require('expo-image-picker') as Picker;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const notifications = () => require('expo-notifications') as Notifications;

interface Raw { granted: boolean; canAskAgain?: boolean; status?: string }

const toState = (r: Raw): PermissionState => ({
  status: r.granted ? 'granted' : r.status === 'undetermined' ? 'undetermined' : 'denied',
  canAskAgain: r.granted || r.canAskAgain !== false,
});

/**
 * Choosing from the library needs no permission on either platform: it opens
 * the system photo picker (PHPicker on iOS, the Android photo picker), which
 * hands over only what the user picks. Asking for library access anyway would
 * be a broader prompt than the feature needs — and on Android 13+ a request
 * for a permission the app does not declare comes back refused.
 */
const NO_PERMISSION_NEEDED: readonly PermissionKind[] = ['photos'];

export async function checkPermission(kind: PermissionKind): Promise<PermissionState> {
  if (Platform.OS === 'web' || NO_PERMISSION_NEEDED.includes(kind)) {
    return { status: 'granted', canAskAgain: true };
  }
  if (kind === 'camera') return toState(await picker().getCameraPermissionsAsync());
  if (kind === 'photos') return toState(await picker().getMediaLibraryPermissionsAsync());
  return toState(await notifications().getPermissionsAsync());
}

export async function requestPermission(kind: PermissionKind): Promise<PermissionState> {
  if (Platform.OS === 'web' || NO_PERMISSION_NEEDED.includes(kind)) {
    return { status: 'granted', canAskAgain: true };
  }
  if (kind === 'camera') return toState(await picker().requestCameraPermissionsAsync());
  if (kind === 'photos') return toState(await picker().requestMediaLibraryPermissionsAsync());
  return toState(await notifications().requestPermissionsAsync());
}
