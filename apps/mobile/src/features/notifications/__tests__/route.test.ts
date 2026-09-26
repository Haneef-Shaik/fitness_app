/**
 * Where a tapped notification goes. A reminder opens the screen that does what
 * it asked for; only kinds the app itself wrote navigate anywhere.
 */
import { reminderData, routeFor } from '../route';

it('a finished meal estimate opens its review', () => {
  expect(routeFor({ type: 'analysis', analysis_id: '0b6f3c8e-1f2a-4c3d-9e8f-123456789abc' }))
    .toBe('/nutrition/analysis/0b6f3c8e-1f2a-4c3d-9e8f-123456789abc');
  expect(routeFor({ type: 'analysis', analysis_id: '../../etc' })).toBeNull();
});

it('each reminder opens the screen for what it reminds you to do', () => {
  expect(routeFor(reminderData('weigh_in'))).toBe('/progress/log');
  expect(routeFor(reminderData('checkin'))).toBe('/progress/checkin');
  expect(routeFor(reminderData('meal_log'))).toBe('/nutrition');
  expect(routeFor(reminderData('workout'))).toBe('/train');
});

it('anything it does not recognise goes nowhere', () => {
  expect(routeFor({ type: 'reminder', kind: 'toString' })).toBeNull();
  expect(routeFor({ type: 'reminder', kind: '/settings' })).toBeNull();
  expect(routeFor({ type: 'other' })).toBeNull();
  expect(routeFor(null)).toBeNull();
  expect(routeFor(undefined)).toBeNull();
});
