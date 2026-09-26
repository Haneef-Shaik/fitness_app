import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a) },
  Stack: { Screen: () => null },
}));

import NotFound from '../+not-found';

it('L-04 · explains itself and offers the way home', () => {
  render(<NotFound />);
  expect(screen.getByText("That page isn't here")).toBeTruthy();
  fireEvent.press(screen.getByTestId('not-found-home'));
  expect(mockReplace).toHaveBeenCalledWith('/home');
});
