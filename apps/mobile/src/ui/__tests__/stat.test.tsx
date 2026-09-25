/**
 * A stat is one screen-reader stop, name first. TalkBack read the finish
 * summary as "15:50", "Duration", "3", "Sets" — figures before the names that
 * give them meaning, each its own swipe (G10 TalkBack session).
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Stat } from '../index';

describe('Stat', () => {
  it('reads its name and figure as one stop', () => {
    render(<Stat value="3" label="Sets" />);
    const stat = screen.getByLabelText('Sets, 3');
    expect(stat.props.accessible).toBe(true);
  });

  it('speaks a figure that reads badly aloud in words', () => {
    render(<Stat value="15:50" label="Duration" spoken="15 minutes 50 seconds" />);
    expect(screen.getByLabelText('Duration, 15 minutes 50 seconds')).toBeTruthy();
    expect(screen.getByText('15:50')).toBeTruthy();
  });
});
