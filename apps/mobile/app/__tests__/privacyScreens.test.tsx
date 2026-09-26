/**
 * K-07 Data & privacy, K-08 AI preferences, K-10 About — the launch screens.
 *
 * What the stores check, asserted as behaviour:
 *
 *   Apple 5.1.1(v) and Google Play — deleting the account is IN the app,
 *   reachable in three taps from settings, and it asks for a typed DELETE and
 *   the password before anything happens.
 *   A refusal (wrong password, offline) deletes nothing and signs nobody out.
 *   K-08 says who receives a photo, from the server's own configuration.
 *   K-10 and A-02 lead to the Terms and the Privacy Policy.
 */
import React from 'react';
import { Linking } from 'react-native';
import Constants from 'expo-constants';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ApiError } from '@/lib/api';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), back: jest.fn(), replace: jest.fn() },
  usePathname: () => '/settings',
}));

const mockSignOut = jest.fn(async () => {});
jest.mock('@/lib/session', () => ({
  useSession: () => ({
    email: 'haneef@example.com',
    profile: { display_name: 'Haneef A', timezone: 'Asia/Kolkata' },
    signOut: mockSignOut,
  }),
}));

const mockExport = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/lib/api-account', () => ({
  accountApi: {
    export: (...a: unknown[]) => mockExport(...a),
    delete: (...a: unknown[]) => mockDelete(...a),
    deletePhotos: jest.fn(),
  },
}));

const mockSave = jest.fn();
const mockRemoveExports = jest.fn(async () => 0);
jest.mock('@/features/privacy/saveExport', () => ({
  saveExport: (...a: unknown[]) => mockSave(...a),
  removeExportCopies: () => mockRemoveExports(),
}));

const mockStore = {
  clearDraft: jest.fn(async () => {}),
  allEntries: jest.fn(async () => [{ id: 7, state: 'pending' }]),
  discard: jest.fn(async () => {}),
  loadDraft: jest.fn(async () => null),
};
// A getter: the screens are imported (hoisted) before `mockStore` exists.
jest.mock('@/lib/db', () => ({ get store() { return mockStore; } }));

const mockApplyReminders = jest.fn(async (_list: unknown[]) => 0);
jest.mock('@/features/reminders/schedule', () => ({
  applyReminders: (list: unknown[]) => mockApplyReminders(list),
}));

let mockLinks = {
  terms: 'https://api.test/legal/terms',
  privacy: 'https://api.test/legal/privacy',
  deleteAccount: 'https://api.test/account/delete',
  supportEmail: null as string | null,
};
jest.mock('@/lib/legal', () => ({
  ...jest.requireActual('@/lib/legal'),
  legalLinks: () => mockLinks,
}));

const q = (data: unknown, over: Record<string, unknown> = {}) => ({
  data, isPending: false, isError: false, error: null, refetch: jest.fn(), ...over,
});

const SETTINGS = {
  provider: 'anthropic', provider_name: 'Anthropic', model: 'claude-sonnet-5',
  sends_to_provider: true, low_confidence_threshold: 0.5,
  quota: { used: 6, limit: 25, remaining: 19, resets_at: '2099-01-02T00:00:00+05:30' },
};

const mocks = {
  settings: q(SETTINGS),
  deletePhotos: {
    mutateAsync: jest.fn(async () => ({ files_deleted: 3, progress_photos_deleted: 1, analyses_kept: 1 })),
    isPending: false,
  },
};
jest.mock('@/lib/query/hooks', () => ({
  useAnalysisSettings: () => mocks.settings,
  useDeleteAllPhotos: () => mocks.deletePhotos,
}));

import Settings from '../settings/index';
import Privacy from '../settings/privacy';
import AiPreferences from '../settings/ai';
import About from '../settings/about';
import Licences from '../settings/licences';
import Welcome from '../welcome';
import { leaveFarewell, takeFarewell } from '@/features/privacy/farewell';

let openURL: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  takeFarewell();
  mocks.settings = q(SETTINGS);
  mockLinks = { ...mockLinks, supportEmail: null };
  mockExport.mockResolvedValue({ format: 'fitlog.export.v1' });
  mockSave.mockResolvedValue({ kind: 'saved', fileName: 'fitlog-export-2026-09-26.json' });
  mockDelete.mockResolvedValue({ deleted: true, photos_deleted: 0 });
  openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
});

/* ------------------------------------------------------------ K-01 → K-* */

describe('settings', () => {
  it('links to data and privacy, AI preferences and About', () => {
    render(<Settings />);
    fireEvent.press(screen.getByLabelText('Data and privacy'));
    expect(mockPush).toHaveBeenLastCalledWith('/settings/privacy');
    fireEvent.press(screen.getByLabelText('AI preferences'));
    expect(mockPush).toHaveBeenLastCalledWith('/settings/ai');
    fireEvent.press(screen.getByLabelText('About'));
    expect(mockPush).toHaveBeenLastCalledWith('/settings/about');
  });
});

/* -------------------------------------------------------------------- K-07 */

describe('K-07 · download my data', () => {
  it('saves the export and says where it went', async () => {
    render(<Privacy />);
    fireEvent.press(screen.getByLabelText('Download my data'));

    await waitFor(() => expect(mockSave).toHaveBeenCalledWith({ format: 'fitlog.export.v1' }));
    expect(await screen.findByText(/Saved fitlog-export-2026-09-26\.json to the folder you chose/))
      .toBeTruthy();
  });

  it('is honest about a copy that stayed inside the app', async () => {
    mockSave.mockResolvedValue({ kind: 'kept', fileName: 'f.json', path: 'file:///docs/f.json' });
    render(<Privacy />);
    fireEvent.press(screen.getByLabelText('Download my data'));
    expect(await screen.findByText(/kept inside FitLog on this phone/)).toBeTruthy();
  });

  it('says so when the export fails', async () => {
    mockExport.mockRejectedValue(new ApiError('NETWORK', 'Could not reach the server.', 0));
    render(<Privacy />);
    fireEvent.press(screen.getByLabelText('Download my data'));
    expect(await screen.findByText(/Could not reach the server/)).toBeTruthy();
    expect(mockSave).not.toHaveBeenCalled();
  });
});

describe('K-07 · delete my uploaded photos', () => {
  it('asks first, then reports what went', async () => {
    render(<Privacy />);
    fireEvent.press(screen.getByLabelText('Delete my uploaded photos'));
    expect(mocks.deletePhotos.mutateAsync).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('Delete photos'));
    await waitFor(() => expect(mocks.deletePhotos.mutateAsync).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Deleted 3 photos/)).toBeTruthy();
  });

  it('can be called off', () => {
    render(<Privacy />);
    fireEvent.press(screen.getByLabelText('Delete my uploaded photos'));
    fireEvent.press(screen.getByLabelText('Keep them'));
    expect(screen.queryByLabelText('Delete photos')).toBeNull();
    expect(mocks.deletePhotos.mutateAsync).not.toHaveBeenCalled();
  });

  it('says what stays: the meals and the analysis records', () => {
    render(<Privacy />);
    expect(screen.getByText(/keep their nutrition/)).toBeTruthy();
  });
});

describe('K-07 · delete my account', () => {
  /** Settings → Data and privacy (1) → Delete my account (2) → Continue (3). */
  function reachTheForm() {
    render(<Privacy />);
    fireEvent.press(screen.getByLabelText('Delete my account'));
    fireEvent.press(screen.getByLabelText('Continue'));
  }

  it('is reachable in three taps from settings', () => {
    render(<Settings />);
    fireEvent.press(screen.getByLabelText('Data and privacy')); // 1
    expect(mockPush).toHaveBeenLastCalledWith('/settings/privacy');
    screen.unmount();

    reachTheForm(); // 2 and 3
    expect(screen.getByLabelText('Type DELETE to confirm')).toBeTruthy();
    expect(screen.getByLabelText('Your password')).toBeTruthy();
  });

  it('says what goes, and offers the export first', async () => {
    render(<Privacy />);
    fireEvent.press(screen.getByLabelText('Delete my account'));
    expect(screen.getByText(/permanently/)).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Download my data first'));
    await waitFor(() => expect(mockSave).toHaveBeenCalled());
  });

  it('stays disabled until DELETE is typed exactly and a password is given', () => {
    reachTheForm();
    const confirm = () => screen.getByLabelText('Delete my account permanently');
    expect(confirm().props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(screen.getByLabelText('Type DELETE to confirm'), 'delete');
    fireEvent.changeText(screen.getByLabelText('Your password'), 'correct-horse-battery');
    expect(confirm().props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(screen.getByLabelText('Type DELETE to confirm'), 'DELETE');
    expect(confirm().props.accessibilityState.disabled).toBe(false);
  });

  async function submit(password = 'correct-horse-battery') {
    reachTheForm();
    fireEvent.changeText(screen.getByLabelText('Type DELETE to confirm'), 'DELETE');
    fireEvent.changeText(screen.getByLabelText('Your password'), password);
    fireEvent.press(screen.getByLabelText('Delete my account permanently'));
  }

  it('deletes, forgets this phone and signs out', async () => {
    await submit();
    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
    expect(mockDelete).toHaveBeenCalledWith('correct-horse-battery');
    expect(mockStore.clearDraft).toHaveBeenCalled();
    expect(mockStore.discard).toHaveBeenCalledWith(7);
    expect(mockApplyReminders).toHaveBeenCalledWith([]);
    expect(mockRemoveExports).toHaveBeenCalled();
    expect(takeFarewell()).toMatch(/has been deleted/);
  });

  it('a wrong password shows on the field and changes nothing', async () => {
    mockDelete.mockRejectedValue(new ApiError(
      'VALIDATION_FAILED', 'That password is not right.', 422,
      { password: 'That password is not right.' },
    ));
    await submit('wrong');
    expect(await screen.findByText('That password is not right.')).toBeTruthy();
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockStore.clearDraft).not.toHaveBeenCalled();
  });

  it('offline, it does not pretend to know what happened', async () => {
    mockDelete.mockRejectedValue(new TypeError('Network request failed'));
    await submit();
    expect(await screen.findByText(/can't tell whether your account was deleted/)).toBeTruthy();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('a refusal says nothing was deleted', async () => {
    mockDelete.mockRejectedValue(new ApiError('RATE_LIMITED', 'Too many attempts.', 429));
    await submit();
    expect(await screen.findByText(/Nothing has been deleted/)).toBeTruthy();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('points to the web page for when the app is gone', () => {
    render(<Privacy />);
    fireEvent.press(screen.getByLabelText('Delete my account'));
    expect(screen.getByText(/https:\/\/api\.test\/account\/delete/)).toBeTruthy();
  });
});

/* -------------------------------------------------------------------- K-08 */

describe('K-08 · AI preferences', () => {
  it("shows today's usage against the limit", () => {
    render(<AiPreferences />);
    expect(screen.getByText('6 of 25 used today')).toBeTruthy();
    expect(screen.getByText(/Resets at midnight/)).toBeTruthy();
  });

  it('names who receives a photo, and the model', () => {
    render(<AiPreferences />);
    expect(screen.getByText(/sent to Anthropic \(claude-sonnet-5\)/)).toBeTruthy();
    expect(screen.getByText('Model: claude-sonnet-5')).toBeTruthy();
  });

  it('says nothing leaves the server when no provider is configured', () => {
    mocks.settings = q({
      ...SETTINGS, provider: 'stub', provider_name: 'None — built-in test stub',
      model: 'stub/deterministic@1', sends_to_provider: false,
    });
    render(<AiPreferences />);
    expect(screen.getByText(/nothing leaves the server/)).toBeTruthy();
    expect(screen.queryByText(/sent to Anthropic/)).toBeNull();
  });

  it('explains low confidence with the threshold the server uses', () => {
    render(<AiPreferences />);
    expect(screen.getByText(/less than 50% sure/)).toBeTruthy();
    expect(screen.getByText(/not how accurate the calories are/)).toBeTruthy();
  });

  it('shows review-before-saving as a guarantee, not a switch', () => {
    render(<AiPreferences />);
    expect(screen.getByText(/can't be turned off/)).toBeTruthy();
    expect(screen.queryByRole('switch')).toBeNull();
  });

  it('leads to the past analyses', () => {
    render(<AiPreferences />);
    fireEvent.press(screen.getByLabelText('View past analyses'));
    expect(mockPush).toHaveBeenCalledWith('/nutrition/analyses');
  });
});

/* -------------------------------------------------------------------- K-10 */

describe('K-10 · About', () => {
  it('shows the app version', () => {
    // jest.setup mocks expo-constants as a plain object; the manifest is ours to set.
    (Constants as unknown as { expoConfig: { version: string } }).expoConfig = { version: '1.2.3' };
    render(<About />);
    expect(screen.getByText(/Version 1\.2\.3/)).toBeTruthy();
  });

  it('opens the Terms and the Privacy Policy', () => {
    render(<About />);
    fireEvent.press(screen.getByLabelText('Terms of Service'));
    expect(openURL).toHaveBeenLastCalledWith('https://api.test/legal/terms');
    fireEvent.press(screen.getByLabelText('Privacy Policy'));
    expect(openURL).toHaveBeenLastCalledWith('https://api.test/legal/privacy');
  });

  it('leads to the open-source licences', () => {
    render(<About />);
    fireEvent.press(screen.getByLabelText('Open-source licences'));
    expect(mockPush).toHaveBeenCalledWith('/settings/licences');
  });

  it('says it shows estimates and is not medical advice', () => {
    render(<About />);
    expect(screen.getByText(/estimates, not medical advice/i)).toBeTruthy();
  });

  it('emails support when an address is configured', () => {
    mockLinks = { ...mockLinks, supportEmail: 'help@fitlog.example' };
    render(<About />);
    fireEvent.press(screen.getByLabelText('Contact support, help@fitlog.example'));
    expect(openURL.mock.calls.at(-1)![0]).toMatch(/^mailto:help@fitlog\.example\?/);
  });

  it('says so when no support address is configured', () => {
    render(<About />);
    expect(screen.getByText(/support address hasn't been set/)).toBeTruthy();
  });
});

describe('open-source licences', () => {
  it('lists what the app is built with, and under which licence', () => {
    render(<Licences />);
    expect(screen.getByLabelText(/^react-native, version .*, MIT licence$/)).toBeTruthy();
    expect(screen.getByLabelText(/^expo-router, version .*, MIT licence$/)).toBeTruthy();
  });
});

/* -------------------------------------------------------------------- A-02 */

describe('A-02 · welcome', () => {
  it('makes the Terms and the Privacy Policy tappable', () => {
    render(<Welcome />);
    fireEvent.press(screen.getByText('Terms'));
    expect(openURL).toHaveBeenLastCalledWith('https://api.test/legal/terms');
    fireEvent.press(screen.getByText('Privacy Policy'));
    expect(openURL).toHaveBeenLastCalledWith('https://api.test/legal/privacy');
  });

  it('says the account was deleted, once, after a deletion', () => {
    leaveFarewell('Your account and everything in it has been deleted.');
    render(<Welcome />);
    expect(screen.getByText(/has been deleted/)).toBeTruthy();
    screen.unmount();

    render(<Welcome />);
    expect(screen.queryByText(/has been deleted/)).toBeNull();
  });
});
