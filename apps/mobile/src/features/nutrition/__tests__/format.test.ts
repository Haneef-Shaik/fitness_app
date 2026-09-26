/**
 * A count read aloud. The diary's meal rows were announced by TalkBack as
 * "Lunch, 389 kcal, 1 items" — found in G10's keyboard pass on a phone.
 */
import { count, untilReset } from '../format';

describe('count', () => {
  it('is singular for one', () => {
    expect(count(1, 'item')).toBe('1 item');
  });

  it('is plural for none and for many', () => {
    expect(count(0, 'item')).toBe('0 items');
    expect(count(3, 'item')).toBe('3 items');
  });
});

/**
 * K-08's "resets in …". A countdown rather than a clock time, because the
 * quota's midnight is the PROFILE's (I7) and the phone may be somewhere else:
 * "in 5 h 12 min" is true in every time zone at once.
 */
describe('untilReset', () => {
  const now = new Date('2026-09-26T13:18:00Z');

  it('counts hours and minutes to the reset', () => {
    expect(untilReset('2026-09-27T00:00:00+05:30', now)).toBe('in 5 h 12 min');
  });

  it('drops the hours in the last hour', () => {
    expect(untilReset('2026-09-26T13:30:00Z', now)).toBe('in 12 min');
  });

  it('says nothing when the time has passed or makes no sense', () => {
    expect(untilReset('2026-09-26T13:00:00Z', now)).toBeNull();
    expect(untilReset('2026-09-29T00:00:00Z', now)).toBeNull();
    expect(untilReset('not a date', now)).toBeNull();
  });
});
