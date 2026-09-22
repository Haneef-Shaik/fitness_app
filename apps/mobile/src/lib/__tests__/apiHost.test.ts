/**
 * API_BASE is resolved once at module load, so each case re-imports the module
 * with a different environment. This is the code that decides whether a physical
 * phone can reach the API at all (DR4) — localhost on a device means the laptop,
 * not the dev machine, so the LAN IP from Metro's hostUri is the only thing that
 * works over Expo Go.
 */
const ORIGINAL_ENV = process.env.EXPO_PUBLIC_API_URL;

function loadApi(opts: { platform: string; hostUri?: string }) {
  let base = '';
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({ Platform: { OS: opts.platform } }));
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { expoConfig: opts.hostUri ? { hostUri: opts.hostUri } : {} },
    }));
    base = (require('../api') as typeof import('../api')).API_BASE;
  });
  return base;
}

afterEach(() => {
  if (ORIGINAL_ENV === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = ORIGINAL_ENV;
  jest.dontMock('react-native');
  jest.dontMock('expo-constants');
});

describe('API base URL', () => {
  // NOT TESTED, deliberately: EXPO_PUBLIC_API_URL is inlined by babel-preset-expo
  // at transform time, so `process.env.EXPO_PUBLIC_API_URL` in api.ts compiles to a
  // literal `undefined` under Jest and no runtime assignment can reach it. Verified
  // by inspecting the babel output, not assumed. It is documented in api.ts instead.

  it('uses localhost on web, where the browser and the API share a host', () => {
    expect(loadApi({ platform: 'web' })).toBe('http://localhost:8000');
  });

  it("uses Metro's LAN IP on a device, because localhost there is the phone", () => {
    expect(loadApi({ platform: 'ios', hostUri: '192.168.1.50:8081' })).toBe('http://192.168.1.50:8000');
  });

  it('strips the Metro port and applies the API port', () => {
    expect(loadApi({ platform: 'android', hostUri: '10.0.0.7:19000' })).toBe('http://10.0.0.7:8000');
  });

  it('falls back to localhost when Metro gives no host', () => {
    // Better a wrong-but-obvious default than a crash at first request.
    expect(loadApi({ platform: 'ios' })).toBe('http://localhost:8000');
  });
});
