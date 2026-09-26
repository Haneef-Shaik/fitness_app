import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('expo-constants', () => ({ expoConfig: { version: '1.0.0', android: { versionCode: 12 }, ios: { buildNumber: '12' } } }));

const mockPost = jest.fn(async (_p: string, _b: unknown) => ({}));
let mockLast: string | null = 'req_last';
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  api: { post: (p: string, b: unknown) => mockPost(p, b) },
  lastFailedRequestId: () => mockLast,
}));

import Feedback from '../settings/feedback';

beforeEach(() => { jest.clearAllMocks(); mockLast = 'req_last'; });

it('sends a problem with the version and the last error\'s reference', async () => {
  render(<Feedback />);
  fireEvent.changeText(screen.getByTestId('feedback-message'), '  The meal did not save.  ');
  fireEvent.press(screen.getByTestId('feedback-send'));

  await waitFor(() => expect(screen.getByTestId('feedback-sent')).toBeTruthy());
  expect(mockPost).toHaveBeenCalledWith('/feedback', expect.objectContaining({
    category: 'problem', message: 'The meal did not save.', app_version: '1.0.0 (12)', request_id: 'req_last',
  }));
});

it('an idea is not tied to an error', async () => {
  render(<Feedback />);
  fireEvent.press(screen.getByTestId('feedback-category-idea'));
  fireEvent.changeText(screen.getByTestId('feedback-message'), 'Supersets please');
  fireEvent.press(screen.getByTestId('feedback-send'));

  await waitFor(() => expect(mockPost).toHaveBeenCalled());
  expect((mockPost.mock.calls[0]![1] as { request_id: unknown }).request_id).toBeNull();
});

it('keeps the message when sending fails', async () => {
  mockPost.mockRejectedValueOnce(new TypeError('Network request failed'));
  render(<Feedback />);
  fireEvent.changeText(screen.getByTestId('feedback-message'), 'Hello');
  fireEvent.press(screen.getByTestId('feedback-send'));

  await waitFor(() => expect(screen.getByTestId('feedback-error')).toBeTruthy());
  expect(screen.getByTestId('feedback-message').props.value).toBe('Hello');
});
