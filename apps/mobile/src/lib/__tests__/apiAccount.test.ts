/**
 * The account API surface — the URLs and the bodies (K-07).
 *
 * Every screen test mocks this module, so nothing else exercises what goes on
 * the wire; a body the server stopped accepting would pass every screen test
 * and fail every real deletion. Recovery and security are Supabase Auth's now
 * (supabaseAuth.test.ts).
 */
import { REAUTH_REQUIRED, accountApi, needsFreshSignIn } from '../api-account';
import { ApiError, api } from '../api';

jest.mock('../api', () => ({
  ...jest.requireActual('../api'),
  api: { get: jest.fn(() => Promise.resolve({})), post: jest.fn(() => Promise.resolve({})), del: jest.fn(() => Promise.resolve({})) },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

it('addresses every action with the server’s paths and fields', async () => {
  await accountApi.export();
  await accountApi.deletePhotos();
  await accountApi.delete();

  expect(mockApi.get).toHaveBeenCalledWith('/account/export');
  expect(mockApi.del).toHaveBeenCalledWith('/account/photos');
  // The typed DELETE travels too: the server checks it as well as the screen.
  expect(mockApi.post).toHaveBeenCalledWith('/account/delete', { confirmation: 'DELETE' });
});

describe('needsFreshSignIn (docs/14 S5)', () => {
  it('recognises the server’s code and nothing else', () => {
    expect(needsFreshSignIn(new ApiError(REAUTH_REQUIRED, 'x', 403))).toBe(true);
    expect(needsFreshSignIn(new ApiError('FORBIDDEN', 'x', 403))).toBe(false);
    expect(needsFreshSignIn(new TypeError('Network request failed'))).toBe(false);
  });
});
