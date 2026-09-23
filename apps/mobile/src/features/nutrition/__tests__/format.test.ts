/**
 * A count read aloud. The diary's meal rows were announced by TalkBack as
 * "Lunch, 389 kcal, 1 items" — found in G10's keyboard pass on a phone.
 */
import { count } from '../format';

describe('count', () => {
  it('is singular for one', () => {
    expect(count(1, 'item')).toBe('1 item');
  });

  it('is plural for none and for many', () => {
    expect(count(0, 'item')).toBe('0 items');
    expect(count(3, 'item')).toBe('3 items');
  });
});
