import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { DataBoundary, type BoundaryQuery } from '../DataBoundary';

function q<T>(over: Partial<BoundaryQuery<T>> = {}): BoundaryQuery<T> {
  return { data: undefined, isPending: false, isError: false, error: null, refetch: jest.fn(), ...over };
}

const EMPTY = { title: 'No exercises yet', body: 'Add one to get started.' };
const children = (rows: string[]) => <Text>{rows.join(',')}</Text>;

describe('DataBoundary — state precedence (docs/03 §6.4)', () => {
  it('renders content when there is data', () => {
    render(<DataBoundary query={q({ data: ['squat'] })} empty={EMPTY}>{children}</DataBoundary>);
    expect(screen.getByText('squat')).toBeTruthy();
  });

  it('renders the skeleton while pending', () => {
    render(
      <DataBoundary query={q<string[]>({ isPending: true })} empty={EMPTY} skeleton={<Text>loading…</Text>}>
        {children}
      </DataBoundary>,
    );
    expect(screen.getByText('loading…')).toBeTruthy();
  });

  it('prefers error over loading', () => {
    render(
      <DataBoundary
        query={q<string[]>({ isPending: true, isError: true, error: new Error('boom') })}
        empty={EMPTY}
        skeleton={<Text>loading…</Text>}
      >
        {children}
      </DataBoundary>,
    );
    expect(screen.queryByText('loading…')).toBeNull();
    expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
  });

  it('prefers offline-with-no-cache over error', () => {
    render(
      <DataBoundary query={q<string[]>({ isError: true, error: new Error('boom') })} empty={EMPTY} isOffline>
        {children}
      </DataBoundary>,
    );
    expect(screen.getByText(/You're offline/i)).toBeTruthy();
  });

  it('shows cached data with an offline badge rather than an offline screen', () => {
    render(
      <DataBoundary query={q({ data: ['squat'] })} empty={EMPTY} isOffline>
        {children}
      </DataBoundary>,
    );
    expect(screen.getByText('squat')).toBeTruthy();
    expect(screen.getByText(/Offline/i)).toBeTruthy();
  });
});

describe('DataBoundary — I13: filtered-empty is not empty', () => {
  it('shows the empty copy when nothing is filtered', () => {
    render(<DataBoundary query={q({ data: [] })} empty={EMPTY}>{children}</DataBoundary>);
    expect(screen.getByText('No exercises yet')).toBeTruthy();
    expect(screen.getByText('Add one to get started.')).toBeTruthy();
  });

  it('never shows the empty copy when filters are active', () => {
    // The bug this component exists to prevent: telling someone with a chest+barbell
    // filter that they have not added any exercises yet.
    render(
      <DataBoundary
        query={q({ data: [] })}
        empty={EMPTY}
        filtered={{ isActive: true, onClear: jest.fn() }}
      >
        {children}
      </DataBoundary>,
    );
    expect(screen.queryByText('No exercises yet')).toBeNull();
    expect(screen.queryByText('Add one to get started.')).toBeNull();
  });

  it('offers a way out of the filter, not a way to create data', () => {
    const onClear = jest.fn();
    render(
      <DataBoundary
        query={q({ data: [] })}
        empty={EMPTY}
        filtered={{ isActive: true, onClear, describe: 'chest + barbell' }}
      >
        {children}
      </DataBoundary>,
    );
    expect(screen.getByText(/chest \+ barbell/)).toBeTruthy();
    fireEvent.press(screen.getByText('Clear filters'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('falls back to filter-shaped copy even when none was supplied', () => {
    render(
      <DataBoundary query={q({ data: [] })} empty={EMPTY} filtered={{ isActive: true, onClear: jest.fn() }}>
        {children}
      </DataBoundary>,
    );
    expect(screen.getByText(/No matches/i)).toBeTruthy();
    expect(screen.getByText('Clear filters')).toBeTruthy();
  });

  it('uses the plain empty copy again once filters are cleared', () => {
    render(
      <DataBoundary query={q({ data: [] })} empty={EMPTY} filtered={{ isActive: false, onClear: jest.fn() }}>
        {children}
      </DataBoundary>,
    );
    expect(screen.getByText('No exercises yet')).toBeTruthy();
  });
});

describe('DataBoundary — error surface', () => {
  it('offers retry and calls refetch', () => {
    const refetch = jest.fn();
    render(
      <DataBoundary query={q<string[]>({ isError: true, error: new Error('boom'), refetch })} empty={EMPTY}>
        {children}
      </DataBoundary>,
    );
    fireEvent.press(screen.getByText('Try again'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows the support reference when the server sent one', () => {
    const err = Object.assign(new Error('bad'), { requestId: 'req-42', code: 'oops', status: 500 });
    render(
      <DataBoundary query={q<string[]>({ isError: true, error: err })} empty={EMPTY}>{children}</DataBoundary>,
    );
    expect(screen.getByText(/req-42/)).toBeTruthy();
  });

  it('never shows a raw stack trace', () => {
    const err = new Error('TypeError: cannot read property x of undefined');
    render(
      <DataBoundary query={q<string[]>({ isError: true, error: err })} empty={EMPTY}>{children}</DataBoundary>,
    );
    expect(screen.queryByText(/cannot read property/)).toBeNull();
  });
});

describe('DataBoundary — emptiness', () => {
  it('treats an empty array as empty', () => {
    render(<DataBoundary query={q({ data: [] })} empty={EMPTY}>{children}</DataBoundary>);
    expect(screen.getByText('No exercises yet')).toBeTruthy();
  });

  it('treats null data as empty', () => {
    render(
      <DataBoundary query={q<string[] | null>({ data: null })} empty={EMPTY}>
        {(d) => <Text>{String(d)}</Text>}
      </DataBoundary>,
    );
    expect(screen.getByText('No exercises yet')).toBeTruthy();
  });

  it('accepts a custom emptiness test for non-list payloads', () => {
    render(
      <DataBoundary
        query={q({ data: { items: [] } })}
        empty={EMPTY}
        isEmpty={(d) => d.items.length === 0}
      >
        {(d) => <Text>{d.items.length} items</Text>}
      </DataBoundary>,
    );
    expect(screen.getByText('No exercises yet')).toBeTruthy();
  });

  it('does not treat zero as empty', () => {
    // A count of 0 is data, not absence — the dashboard shows "0 kcal", not an empty state.
    render(
      <DataBoundary query={q({ data: 0 })} empty={EMPTY}>{(d) => <Text>value {d}</Text>}</DataBoundary>,
    );
    expect(screen.getByText('value 0')).toBeTruthy();
  });
});
