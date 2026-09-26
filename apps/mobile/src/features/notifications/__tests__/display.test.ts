/** Notifications show while the app is open — set once, for every notification. */
import { Platform } from 'react-native';

const mockSetHandler = jest.fn();
jest.mock('expo-notifications', () => ({ setNotificationHandler: (h: unknown) => mockSetHandler(h) }));

type Handler = { handleNotification: () => Promise<Record<string, boolean>> };

beforeEach(() => { jest.resetModules(); mockSetHandler.mockClear(); Platform.OS = 'android'; });

const load = () => (require('../display') as typeof import('../display')).showWhileOpen;

it('shows the banner and keeps it in the list, silently', async () => {
  load()();
  const handler = mockSetHandler.mock.calls[0]![0] as Handler;
  await expect(handler.handleNotification()).resolves.toEqual({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
  });
});

it('is set once, however often it is asked for', () => {
  const showWhileOpen = load();
  showWhileOpen();
  showWhileOpen();
  expect(mockSetHandler).toHaveBeenCalledTimes(1);
});

it('does nothing on the web', () => {
  Platform.OS = 'web';
  load()();
  expect(mockSetHandler).not.toHaveBeenCalled();
});
