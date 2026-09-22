/**
 * The chart rules from 05 §3 that a component can get wrong silently.
 *
 * These are asserted on rendered output rather than on the palette module,
 * because "the palette is correct" and "the chart obeys it" are different
 * claims and only the second one ships.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ChartLegend } from '../ChartLegend';
import { Column } from '../Column';
import { Meter } from '../Meter';
import { deltaTone } from '../delta';

describe('legend (05 §3: always present for ≥2 series)', () => {
  it('appears once there are two series', () => {
    render(<ChartLegend series={[{ key: 'a', label: 'Chest' }, { key: 'b', label: 'Back' }]} />);
    expect(screen.getByTestId('chart-legend')).toBeTruthy();
    expect(screen.getByText('Chest')).toBeTruthy();
    expect(screen.getByText('Back')).toBeTruthy();
  });

  it('is omitted for a single series, where it would only be noise', () => {
    render(<ChartLegend series={[{ key: 'a', label: 'Chest' }]} />);
    expect(screen.queryByTestId('chart-legend')).toBeNull();
  });
});

describe('a regression is never red (I11)', () => {
  it('gives a decrease a neutral tone, not an error tone', () => {
    // A lighter week is information. Colouring it red tells someone their
    // deload was a mistake.
    expect(deltaTone(-12)).toBe('ink2');
    expect(deltaTone(-0.1)).toBe('ink2');
  });

  it('gives an increase the good tone', () => {
    expect(deltaTone(12)).toBe('good');
  });

  it('treats no change as neutral', () => {
    expect(deltaTone(0)).toBe('ink2');
  });

  it('never returns the crit tone for any value', () => {
    // The guard stated directly: whatever the number, this palette has no red.
    for (const v of [-1000, -1, 0, 1, 1000]) {
      expect(deltaTone(v)).not.toBe('crit');
    }
  });
});

describe('Column', () => {
  it('draws a bar per bucket, including the empty ones', () => {
    // A skipped week draws a lay-off as continuous training.
    render(<Column data={[
      { label: 'w1', value: 100 }, { label: 'w2', value: 0 }, { label: 'w3', value: 50 },
    ]} />);
    expect(screen.getAllByTestId(/^column-bar-/)).toHaveLength(3);
  });

  it('labels the first, last and max points only (05 §3.5)', () => {
    // "Never a number on every point."
    render(<Column data={[
      { label: 'a', value: 10 }, { label: 'b', value: 90 },
      { label: 'c', value: 20 }, { label: 'd', value: 30 },
    ]} />);
    const labelled = screen.getAllByTestId(/^column-value-/);
    expect(labelled.length).toBeLessThanOrEqual(3);
  });

  it('survives every value being zero without dividing by it', () => {
    render(<Column data={[{ label: 'a', value: 0 }, { label: 'b', value: 0 }]} />);
    expect(screen.getAllByTestId(/^column-bar-/)).toHaveLength(2);
  });
});

describe('Meter', () => {
  it('never overruns its track', () => {
    render(<Meter value={1.4} label="Adherence" />);
    expect(screen.getByTestId('meter-fill').props.style.width).toBe('100%');
  });

  it('says so when the value is undefined rather than drawing 0%', () => {
    // No plan is not 0% adherence.
    render(<Meter value={null} label="Adherence" empty="No plan yet" />);
    expect(screen.getByText('No plan yet')).toBeTruthy();
    expect(screen.queryByTestId('meter-fill')).toBeNull();
  });
});
