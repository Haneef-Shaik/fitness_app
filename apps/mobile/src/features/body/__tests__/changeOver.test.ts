/**
 * "▼ 0.4 kg in 7 days" — and "No change in 7 days", never "No change (kg) in
 * 7 days", which is what composing `delta()` with a period produced on the
 * dashboard (seen on the emulator, 27 Sep).
 */
import { changeOver } from '../format';

describe('changeOver', () => {
  it('states the direction, the amount, the unit and the period', () => {
    expect(changeOver(-0.4, 'kg', '7 days')).toBe('▼ 0.4 kg in 7 days');
    expect(changeOver(1.25, 'lb', '30 days')).toBe('▲ 1.3 lb in 30 days');
  });

  it('says "No change" without a stray unit', () => {
    expect(changeOver(0.02, 'kg', '7 days')).toBe('No change in 7 days');
  });

  it('is null when nothing is known', () => {
    expect(changeOver(null, 'kg', '7 days')).toBeNull();
    expect(changeOver(undefined, 'kg', '7 days')).toBeNull();
  });
});
