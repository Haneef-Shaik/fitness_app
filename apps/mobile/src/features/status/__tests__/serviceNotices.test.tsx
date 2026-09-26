import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AiDegradedNotice, MaintenanceOverlay } from '../ServiceNotices';

const mockStatus = { data: undefined as unknown, refetch: jest.fn() };
jest.mock('../useServiceStatus', () => ({ useServiceStatus: () => mockStatus }));

beforeEach(() => { mockStatus.data = undefined; jest.clearAllMocks(); });

describe('L-08 · maintenance', () => {
  it('says nothing when there is nothing to say — including when the ask failed', () => {
    render(<MaintenanceOverlay />);
    expect(screen.queryByTestId('maintenance')).toBeNull();
  });

  it('shows the operator\'s message and what still works', () => {
    mockStatus.data = { maintenance: true, message: 'Back by 14:00 UTC.', ai: 'ok' };
    render(<MaintenanceOverlay />);
    expect(screen.getByText('Back by 14:00 UTC.')).toBeTruthy();
    expect(screen.getByText(/You can still log a workout/)).toBeTruthy();
  });

  it('can be set aside, because logging never needed the server', () => {
    mockStatus.data = { maintenance: true, message: null, ai: 'ok' };
    render(<MaintenanceOverlay />);
    fireEvent.press(screen.getByTestId('maintenance-dismiss'));
    expect(screen.queryByTestId('maintenance')).toBeNull();
  });
});

describe('L-08 · AI degraded', () => {
  it('appears only when the service reports it', () => {
    mockStatus.data = { maintenance: false, message: null, ai: 'ok' };
    const { rerender } = render(<AiDegradedNotice />);
    expect(screen.queryByTestId('ai-degraded')).toBeNull();

    mockStatus.data = { maintenance: false, message: null, ai: 'degraded' };
    rerender(<AiDegradedNotice />);
    expect(screen.getByTestId('ai-degraded')).toBeTruthy();
  });
});
