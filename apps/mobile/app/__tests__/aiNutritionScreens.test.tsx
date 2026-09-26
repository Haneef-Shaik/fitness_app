/**
 * H-06, H-07, H-08, H-09 and H-18 — the AI surface.
 *
 * The assertions here are mostly about **sentences and defaults**, because that
 * is where this feature is honest or is not:
 *
 *   H-06 says nothing is saved yet, BEFORE the button.
 *   H-08 says confidence is detection, not nutritional accuracy — on the
 *        screen, not in a tooltip. It is the single most important piece of
 *        copy in the product for keeping the AI honest (BRD §13, Risk R1).
 *   H-08 starts a low-confidence item UNCHECKED and never saves anything on a
 *        confidence threshold (**Q7 → no**).
 *   H-07's failure state says the meal has not changed, and offers manual
 *        entry rather than an error code.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: (...a: unknown[]) => mockPush(...a),
    replace: (...a: unknown[]) => mockReplace(...a),
    back: jest.fn(),
  },
  useLocalSearchParams: () => mockParams,
}));

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: (...a: unknown[]) => mockCamera(...a),
  launchImageLibraryAsync: (...a: unknown[]) => mockLibrary(...a),
  // L-06 asks these first; granted unless a test says otherwise.
  getCameraPermissionsAsync: async () => mockCameraPermission,
  requestCameraPermissionsAsync: async () => mockCameraPermission,
  getMediaLibraryPermissionsAsync: async () => ({ granted: true, status: 'granted', canAskAgain: true }),
  requestMediaLibraryPermissionsAsync: async () => ({ granted: true, status: 'granted', canAskAgain: true }),
}));

let mockCameraPermission: { granted: boolean; status: string; canAskAgain: boolean } =
  { granted: true, status: 'granted', canAskAgain: true };

const mockRegister = jest.fn(async () => 'registered');
jest.mock('@/features/push/push', () => ({ registerForPush: () => mockRegister() }));
jest.mock('@/features/permissions/primer', () => {
  const actual = jest.requireActual('@/features/permissions/primer');
  // Notifications granted here; the camera keeps the real check, which the
  // picker mock above answers.
  return {
    ...actual,
    checkPermission: (kind: string) => (kind === 'notifications'
      ? Promise.resolve({ status: 'granted', canAskAgain: true })
      : actual.checkPermission(kind)),
  };
});

jest.mock('@/features/status/useServiceStatus', () => ({
  useServiceStatus: () => ({ data: { maintenance: false, message: null, ai: 'ok' }, refetch: jest.fn() }),
}));

jest.mock('@/features/nutrition/uploadPhoto', () => ({
  uploadPhoto: (...a: unknown[]) => mockUpload(...a),
}));

let mockParams: Record<string, string> = {};
const mockCamera = jest.fn();
const mockLibrary = jest.fn();
const mockUpload = jest.fn();

const q = (data: unknown, over: Record<string, unknown> = {}) => ({
  data, isPending: false, isError: false, error: null, refetch: jest.fn(), ...over,
});

const mutation = () => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn((_body?: unknown) => Promise.resolve({ id: 'a1' })),
  isPending: false,
});

const HIGH = {
  id: 'i1', detected_name: 'Chicken biryani', estimated_quantity: 350,
  estimated_unit: 'g', confidence: 0.82, proposed_calories: 620,
  proposed_protein_g: 31, proposed_carbs_g: 70, proposed_fat_g: 23,
  resolved_food_id: 'f1', resolved_food_name: 'Chicken biryani', low_confidence: false,
};
const LOW = {
  id: 'i2', detected_name: 'Raita', estimated_quantity: 100,
  estimated_unit: 'g', confidence: 0.41, proposed_calories: 74,
  proposed_protein_g: 3, proposed_carbs_g: 5, proposed_fat_g: 4,
  resolved_food_id: null, resolved_food_name: null, low_confidence: true,
};

const COMPLETED = {
  id: 'a1', input_type: 'image', status: 'completed', source_text: null,
  image_key: 'uploads/u/1.jpg', error_code: null, model_name: 'stub/deterministic@1',
  schema_version: 'food_analysis.v1', notes: null, confirmed_meal_id: null,
  created_at: '2026-09-23T13:20:00Z', items: [HIGH, LOW],
};

const mocks = {
  analysis: q(COMPLETED),
  analyses: q([COMPLETED]),
  quota: q({ used: 1, limit: 25, remaining: 24, resets_at: '2026-09-24T00:00:00Z' }),
  categories: q([
    { id: 'c1', slug: 'breakfast', name: 'Breakfast', sort_order: 0, default_time: null, hidden: false, is_default: true },
    { id: 'c2', slug: 'lunch', name: 'Lunch', sort_order: 1, default_time: null, hidden: false, is_default: true },
  ]),
  analyseText: mutation(),
  analyseImage: mutation(),
  confirm: mutation(),
  deleteImages: mutation(),
};

jest.mock('@/lib/query/hooks', () => ({
  useAnalysis: () => mocks.analysis,
  useAnalyses: () => mocks.analyses,
  useAnalysisQuota: () => mocks.quota,
  useMealCategories: () => mocks.categories,
  useAnalyseText: () => mocks.analyseText,
  useAnalyseImage: () => mocks.analyseImage,
  useConfirmAnalysis: () => mocks.confirm,
  useDeleteAnalysisImages: () => mocks.deleteImages,
}));

import Describe from '../nutrition/describe';
import Photo from '../nutrition/photo';
import Review from '../nutrition/analysis/[id]';
import Analyses from '../nutrition/analyses';

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { id: 'a1' };
  mocks.analysis = q(COMPLETED);
  mocks.analyses = q([COMPLETED]);
  mocks.quota = q({ used: 1, limit: 25, remaining: 24, resets_at: '2026-09-24T00:00:00Z' });
  mocks.analyseText = mutation();
  mocks.analyseImage = mutation();
  mocks.confirm = mutation();
  mocks.deleteImages = mutation();
  mockUpload.mockResolvedValue('uploads/u/1.jpg');
  mockCamera.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///a.jpg' }] });
  mockLibrary.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///b.jpg' }] });
});

describe('H-06 · describing a meal', () => {
  it('promises that nothing is saved yet, before the button', () => {
    render(<Describe />);
    expect(
      screen.getByText(/show it to you before anything is saved/),
    ).toBeTruthy();
  });

  it('will not submit two characters', () => {
    render(<Describe />);
    fireEvent.changeText(screen.getByTestId('describe-text'), 'ab');

    expect(screen.getByLabelText('Estimate nutrition').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('describe-too-short')).toBeTruthy();
  });

  it('submits what was typed and goes to the review screen', async () => {
    render(<Describe />);
    fireEvent.changeText(screen.getByTestId('describe-text'), '2 eggs, 3 rotis');

    fireEvent.press(screen.getByLabelText('Estimate nutrition'));

    await waitFor(() => expect(mocks.analyseText.mutateAsync).toHaveBeenCalled());
    expect(mocks.analyseText.mutateAsync).toHaveBeenCalledWith({
      text: '2 eggs, 3 rotis', client_id: null,
    });
    expect(mockReplace).toHaveBeenCalledWith('/nutrition/analysis/a1');
  });

  it('an example chip fills the box rather than submitting', () => {
    render(<Describe />);
    fireEvent.press(screen.getByTestId('describe-example-0'));

    expect(screen.getByTestId('describe-text').props.value).toBe('a bowl of dal and 2 rotis');
    expect(mocks.analyseText.mutateAsync).not.toHaveBeenCalled();
  });

  it('states the quota before the button, and blocks when it is gone', () => {
    const first = render(<Describe />);
    expect(screen.getByTestId('describe-quota')).toBeTruthy();
    first.unmount();

    mocks.quota = q({ used: 25, limit: 25, remaining: 0, resets_at: '2026-09-24T00:00:00Z' });
    render(<Describe />);
    // Stated BEFORE anything is typed, with manual entry offered (02 §5.4).
    expect(screen.getByTestId('describe-quota-exhausted')).toBeTruthy();
    expect(screen.getByLabelText('Estimate nutrition').props.accessibilityState.disabled)
      .toBe(true);
  });

  it('keeps what was typed when submitting fails', async () => {
    mocks.analyseText.mutateAsync = jest.fn(() => Promise.reject(new Error('offline')));
    render(<Describe />);
    fireEvent.changeText(screen.getByTestId('describe-text'), '2 eggs');

    fireEvent.press(screen.getByLabelText('Estimate nutrition'));

    await waitFor(() => expect(screen.getByTestId('describe-error')).toBeTruthy());
    // Nobody is made to retype their meal.
    expect(screen.getByTestId('describe-text').props.value).toBe('2 eggs');
  });
});

describe('H-08 · reviewing', () => {
  it('requires the confidence sentence on the screen', () => {
    render(<Review />);
    expect(
      screen.getByText(/spotted the food — not how accurate\s+the calories are/),
    ).toBeTruthy();
  });

  it('starts a low-confidence item UNCHECKED and a confident one checked', () => {
    render(<Review />);
    expect(screen.getByTestId('analysis-item-i1-include').props.accessibilityState.checked)
      .toBe(true);
    // N04.3. Confidence chooses the DEFAULT, and nothing more.
    expect(screen.getByTestId('analysis-item-i2-include').props.accessibilityState.checked)
      .toBe(false);
    expect(screen.getByTestId('analysis-item-i2-please-check')).toBeTruthy();
  });

  it('never saves on its own, whatever the confidence', () => {
    render(<Review />);
    // Q7 → no. Rendering the screen has confirmed nothing.
    expect(mocks.confirm.mutateAsync).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Save 1 item')).toBeTruthy();
  });

  it('says which items matched a food and which are the model’s own estimate', () => {
    render(<Review />);
    expect(screen.getByTestId('analysis-item-i1-matched')).toBeTruthy();
    expect(screen.getByTestId('analysis-item-i2-unmatched')).toBeTruthy();
  });

  it('names an item as estimated for a screen reader, not only with a border', () => {
    render(<Review />);
    const label = screen.getByTestId('analysis-item-i1').props.accessibilityLabel;
    expect(label).toContain('estimated, not yet confirmed');
    expect(label).toContain('82 percent confidence');
  });

  it('totals only the checked items', () => {
    render(<Review />);
    // Only the biryani is checked: 620, not 694.
    expect(screen.getByText('620 kcal')).toBeTruthy();

    fireEvent.press(screen.getByTestId('analysis-item-i2-include'));
    expect(screen.getByText('694 kcal')).toBeTruthy();
  });

  it('rescales an item when the amount is corrected', () => {
    render(<Review />);
    fireEvent.changeText(screen.getByTestId('analysis-item-i1-quantityGrams'), '175');

    // Half the amount, half the calories.
    expect(screen.getByText('310 kcal')).toBeTruthy();
  });

  it('sends only the fields the user actually typed', async () => {
    render(<Review />);
    fireEvent.changeText(screen.getByTestId('analysis-item-i1-quantityGrams'), '425');

    fireEvent.press(screen.getByLabelText('Save 1 item'));

    await waitFor(() => expect(mocks.confirm.mutateAsync).toHaveBeenCalled());
    const body = (mocks.confirm.mutateAsync.mock.calls[0]![0] as {
      body: { items: Array<Record<string, unknown>> };
    }).body;

    expect(body.items[0]).toMatchObject({
      analysis_item_id: 'i1', include: true, quantity_grams: 425,
    });
    // Untouched macros go as null, so the server does not read them as a
    // correction the user never made.
    expect(body.items[0]!.calories).toBeNull();
    expect(body.items[1]).toMatchObject({ analysis_item_id: 'i2', include: false });
  });

  it('cannot be saved with nothing checked', () => {
    render(<Review />);
    fireEvent.press(screen.getByTestId('analysis-item-i1-include'));

    const button = screen.getByLabelText('Check at least one item');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('offers manual entry when no food was identified', () => {
    mocks.analysis = q({ ...COMPLETED, items: [], source_text: 'food' });
    render(<Review />);

    expect(screen.getByTestId('analysis-no-items')).toBeTruthy();
    // The user's own words are still on the screen.
    expect(screen.getByText('food')).toBeTruthy();
    expect(screen.getByTestId('analysis-manual')).toBeTruthy();
  });

  it('shows a plain sentence on failure and says the meal is unchanged', () => {
    mocks.analysis = q({ ...COMPLETED, status: 'failed', error_code: 'ai_unavailable', items: [] });
    render(<Review />);

    expect(screen.getByTestId('analysis-failure').props.children)
      .toContain('The service did not respond');
    expect(screen.getByText('Nothing has been logged.')).toBeTruthy();
    // No raw code anywhere on the screen.
    expect(screen.queryByText(/ai_unavailable/)).toBeNull();
  });

  it('is dismissible while it is still working', () => {
    mocks.analysis = q({ ...COMPLETED, status: 'processing', items: [] });
    render(<Review />);

    fireEvent.press(screen.getByTestId('analysis-dismiss'));
    // The job keeps running server-side.
    expect(mockReplace).toHaveBeenCalledWith('/nutrition');
  });

  it('offers to notify when a photo is ready — and says when it will', async () => {
    mocks.analysis = q({ ...COMPLETED, status: 'processing', items: [] });
    render(<Review />);

    fireEvent.press(screen.getByTestId('analysis-notify'));

    await waitFor(() => expect(screen.getByTestId('analysis-notify-on')).toBeTruthy());
    expect(mockRegister).toHaveBeenCalled();
  });

  it('does not offer it for text, which is back before anyone leaves', () => {
    mocks.analysis = q({ ...COMPLETED, input_type: 'text', status: 'processing', items: [] });
    render(<Review />);
    expect(screen.queryByTestId('analysis-notify')).toBeNull();
  });
});

describe('H-09 · photographing', () => {
  it('says the location data is removed before the photo leaves the phone', () => {
    render(<Photo />);
    expect(screen.getByText(/location data\s+removed before they leave your phone/)).toBeTruthy();
  });

  it('uploads and submits the photo', async () => {
    render(<Photo />);
    fireEvent.press(screen.getByTestId('photo-camera'));
    await waitFor(() => expect(screen.getByTestId('photo-remove-0')).toBeTruthy());

    fireEvent.press(screen.getByTestId('photo-analyse'));

    await waitFor(() => expect(mocks.analyseImage.mutateAsync).toHaveBeenCalled());
    expect(mockUpload).toHaveBeenCalledWith('file:///a.jpg');
    expect(mocks.analyseImage.mutateAsync).toHaveBeenCalledWith({
      image_key: 'uploads/u/1.jpg', client_id: null,
    });
  });

  it('keeps the photo when the upload fails', async () => {
    mockUpload.mockRejectedValue(new Error('Upload failed with 500'));
    render(<Photo />);
    fireEvent.press(screen.getByTestId('photo-camera'));
    await waitFor(() => expect(screen.getByTestId('photo-remove-0')).toBeTruthy());

    fireEvent.press(screen.getByTestId('photo-analyse'));

    await waitFor(() => expect(screen.getByTestId('photo-error')).toBeTruthy());
    // Still there. Nobody retakes their dinner.
    expect(screen.getByTestId('photo-remove-0')).toBeTruthy();
  });

  it('L-06 · explains the camera before the phone asks, and only then asks', async () => {
    mockCameraPermission = { granted: false, status: 'undetermined', canAskAgain: true };
    render(<Photo />);

    fireEvent.press(screen.getByTestId('photo-camera'));

    await waitFor(() => expect(screen.getByTestId('permission-continue')).toBeTruthy());
    expect(mockCamera).not.toHaveBeenCalled();
    mockCameraPermission = { granted: true, status: 'granted', canAskAgain: true };
    fireEvent.press(screen.getByTestId('permission-continue'));
    await waitFor(() => expect(mockCamera).toHaveBeenCalled());
  });

  it('L-06 · a camera the phone will not ask about again points to Settings', async () => {
    mockCameraPermission = { granted: false, status: 'denied', canAskAgain: false };
    render(<Photo />);

    fireEvent.press(screen.getByTestId('photo-camera'));

    await waitFor(() => expect(screen.getByTestId('permission-settings')).toBeTruthy());
    expect(mockCamera).not.toHaveBeenCalled();
    mockCameraPermission = { granted: true, status: 'granted', canAskAgain: true };
  });

  it('does not become a dead screen when the picker is refused', async () => {
    mockCamera.mockRejectedValue(new Error('permission denied'));
    render(<Photo />);

    fireEvent.press(screen.getByTestId('photo-camera'));

    await waitFor(() => expect(screen.getByTestId('photo-error')).toBeTruthy());
    expect(screen.getByTestId('photo-library')).toBeTruthy();
  });

  it('states an exhausted quota on entry, before a photo is taken', () => {
    mocks.quota = q({ used: 25, limit: 25, remaining: 0, resets_at: '2026-09-24T00:00:00Z' });
    render(<Photo />);

    expect(screen.getByTestId('photo-quota-exhausted')).toBeTruthy();
    expect(screen.getByTestId('photo-camera').props.accessibilityState.disabled).toBe(true);
  });
});

describe('H-18 · the audit trail', () => {
  it('shows whether an analysis was saved', () => {
    const first = render(<Analyses />);
    expect(screen.getByText('Not saved')).toBeTruthy();
    first.unmount();

    mocks.analyses = q([{ ...COMPLETED, confirmed_meal_id: 'm1' }]);
    render(<Analyses />);
    expect(screen.getByText('Saved')).toBeTruthy();
  });

  it('says the records stay when the photos go', () => {
    render(<Analyses />);
    fireEvent.press(screen.getByTestId('analyses-delete-photos'));

    expect(screen.getByText(/record of what was analysed stays/)).toBeTruthy();
  });

  it('asks before deleting the photos', async () => {
    render(<Analyses />);
    fireEvent.press(screen.getByTestId('analyses-delete-photos'));
    expect(mocks.deleteImages.mutateAsync).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('analyses-confirm-delete'));
    await waitFor(() => expect(mocks.deleteImages.mutateAsync).toHaveBeenCalled());
  });

  it('offers no delete when there are no photos to delete', () => {
    mocks.analyses = q([{ ...COMPLETED, image_key: null }]);
    render(<Analyses />);
    expect(screen.queryByTestId('analyses-delete-photos')).toBeNull();
  });
});
