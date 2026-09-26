/**
 * One password rule for A-03, A-05 and K-02. The server is the authority; this
 * mirrors its length rule so the three screens agree with it and each other.
 */
import { MIN_PASSWORD_LENGTH, newPasswordProblems, passwordStrength } from '../password';

describe('passwordStrength', () => {
  it('says nothing about an empty field', () => {
    expect(passwordStrength('')).toEqual({ bars: 0, label: '' });
  });

  it('never calls a password the server will refuse anything but too short', () => {
    // Nine characters lit three bars on A-03 and looked fine; the server said no.
    expect(passwordStrength('a'.repeat(9))).toEqual({ bars: 3, label: 'Too short' });
  });

  it('reads Good at the minimum and Strong from twelve', () => {
    expect(passwordStrength('a'.repeat(MIN_PASSWORD_LENGTH)).label).toBe('Good');
    expect(passwordStrength('a'.repeat(12))).toEqual({ bars: 4, label: 'Strong' });
    expect(passwordStrength('a'.repeat(40)).bars).toBe(4);
  });
});

describe('newPasswordProblems', () => {
  it('matches the server rule and its words', () => {
    expect(newPasswordProblems('short', 'short')).toEqual({
      new_password: 'Use at least 10 characters.',
    });
  });

  it('asks for the confirmation to match', () => {
    expect(newPasswordProblems('a-long-passphrase', 'a-long-passphrasf')).toEqual({
      confirm: "The passwords don't match.",
    });
  });

  it('has nothing to say about a good pair', () => {
    expect(newPasswordProblems('a-long-passphrase', 'a-long-passphrase')).toEqual({});
  });
});
