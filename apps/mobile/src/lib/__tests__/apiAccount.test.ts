/**
 * The account-recovery and security API surface — the URLs and the bodies.
 *
 * Every screen test mocks this module, so nothing else exercises what goes on
 * the wire; a field renamed here (`new_password`, `current_password`) would
 * pass every screen test and fail every real reset.
 */
import { accountApi, isExpiredLink, recoveryApi } from '../api-account';
import { ApiError, api } from '../api';

jest.mock('../api', () => ({
  ...jest.requireActual('../api'),
  api: { post: jest.fn(() => Promise.resolve({})) },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

describe('recovery — reachable signed out (A-05, A-06)', () => {
  it('asks for a reset link', async () => {
    await recoveryApi.forgotPassword('a@b.com');
    expect(mockApi.post).toHaveBeenCalledWith('/auth/password/forgot', { email: 'a@b.com' });
  });

  it('resets with the token and the server’s field name', async () => {
    await recoveryApi.resetPassword('tok', 'a-long-passphrase');
    expect(mockApi.post).toHaveBeenCalledWith(
      '/auth/password/reset', { token: 'tok', new_password: 'a-long-passphrase' },
    );
  });

  it('verifies an address', async () => {
    await recoveryApi.verifyEmail('tok');
    expect(mockApi.post).toHaveBeenCalledWith('/auth/email/verify', { token: 'tok' });
  });
});

describe('security — the signed-in account (A-06, K-02)', () => {
  it('addresses every action with the server’s field names', async () => {
    await accountApi.resendVerification();
    await accountApi.changePassword('old-password', 'a-long-passphrase');
    await accountApi.changeEmail('new@b.com', 'pw');
    await accountApi.signOutOtherDevices();

    expect(mockApi.post.mock.calls).toEqual([
      ['/auth/email/resend'],
      ['/account/password', { current_password: 'old-password', new_password: 'a-long-passphrase' }],
      ['/account/email', { new_email: 'new@b.com', password: 'pw' }],
      ['/auth/sessions/revoke-others'],
    ]);
  });
});

describe('isExpiredLink', () => {
  it('recognises the server’s code and nothing else', () => {
    expect(isExpiredLink(new ApiError('LINK_EXPIRED', 'x', 400))).toBe(true);
    expect(isExpiredLink(new ApiError('VALIDATION_FAILED', 'x', 422))).toBe(false);
    expect(isExpiredLink(new TypeError('Network request failed'))).toBe(false);
  });
});
