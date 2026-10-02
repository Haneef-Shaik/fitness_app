/**
 * A macro tile never cuts its target off.
 *
 * On Home the three tiles sit inside a card inside the page, and "120.4" next
 * to "/ 176 g" is wider than a tile: the target was clipped to "/ 176 ç" (found
 * taking the screenshots, 2 Oct). The target wraps under the figure instead.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { MacroTrio } from '../MacroTrio';

it('lets the target wrap under the figure rather than clipping it', () => {
  render(<MacroTrio protein={120.4} carbs={189.2} fat={37.9} targets={{ protein_g: 176, carbs_g: 234, fat_g: 78 }} />);
  const target = screen.getByText('/ 176 g');
  const style = StyleSheet.flatten(screen.getByTestId('macro-protein_g-figures').props.style) as Record<string, unknown>;
  expect(style.flexWrap).toBe('wrap');
  expect(target.props.numberOfLines).toBe(1);
});
