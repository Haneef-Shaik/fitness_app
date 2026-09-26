/** D10: the refresh token lives in the device keychain, never in plain storage. */
import * as SecureStore from 'expo-secure-store';
import { clearRefreshToken, getRefreshToken, setRefreshToken } from '../storage';

beforeEach(async () => {
  jest.clearAllMocks();
  await clearRefreshToken();
});

describe('refresh token storage', () => {
  it('round-trips through SecureStore, not AsyncStorage', async () => {
    await setRefreshToken('tok');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('fitlog.refresh_token', 'tok');
    await expect(getRefreshToken()).resolves.toBe('tok');
  });

  it('returns null when nothing is stored', async () => {
    await expect(getRefreshToken()).resolves.toBeNull();
  });

  it('clears the token', async () => {
    await setRefreshToken('tok');
    await clearRefreshToken();
    await expect(getRefreshToken()).resolves.toBeNull();
  });

  it('survives storage being unavailable rather than crashing the app', async () => {
    // A locked keychain must cost the user their session, not the launch.
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('keychain locked'));
    await expect(setRefreshToken('tok')).resolves.toBeUndefined();

    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('keychain locked'));
    await expect(getRefreshToken()).resolves.toBeNull();

    (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error('keychain locked'));
    await expect(clearRefreshToken()).resolves.toBeUndefined();
  });
});
