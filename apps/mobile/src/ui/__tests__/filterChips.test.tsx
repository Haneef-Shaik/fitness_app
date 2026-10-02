/**
 * FilterChips keeps its height wherever it is placed.
 *
 * A horizontal ScrollView grows by default (flexGrow 1). In a full screen the
 * list below takes the space, but inside the exercise picker's sheet the row
 * grew to share it and every chip stretched into a tall oval (C-06 and E-05b,
 * found taking the screenshots, 2 Oct).
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { FilterChips } from '../FilterChips';

const flat = (style: unknown) => StyleSheet.flatten(style as never) as Record<string, unknown>;

it('does not grow to fill its parent', () => {
  render(
    <FilterChips
      testID="chips"
      options={[{ value: 'chest', label: 'Chest' }]}
      selected={[]}
      onChange={() => {}}
    />,
  );
  const row = screen.getByTestId('chips');
  expect(flat(row.props.style).flexGrow).toBe(0);
  // Chips sit at their own height rather than stretching to the row's.
  expect(flat(row.props.contentContainerStyle).alignItems).toBe('center');
});
