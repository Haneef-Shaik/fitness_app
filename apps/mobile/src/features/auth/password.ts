/**
 * The password rule every "choose a password" field shares — A-03 sign up,
 * A-05 reset and K-02 change — so the three can never disagree.
 *
 * The SERVER is the authority (`password_problem` in services/api, which also
 * refuses a short list of common passwords). This mirrors only the length, so a
 * too-short password is caught before a round trip; anything the server
 * refuses still arrives as a field error and is shown the same way.
 */

/** Mirrors `password_problem` in services/api/app/core/security.py. */
export const MIN_PASSWORD_LENGTH = 10;

export interface Strength {
  /** How many of the four bars are lit — A-03's meter, unchanged. */
  bars: number;
  /** The same fact in words, so the meter never relies on colour alone. */
  label: string;
}

/**
 * Advisory only, and never flattering below the minimum: a nine-character
 * password lights three bars but reads "Too short", because that is what the
 * server will say about it.
 */
export function passwordStrength(password: string): Strength {
  const bars = Math.min(4, Math.floor(password.length / 3));
  if (password.length === 0) return { bars, label: '' };
  if (password.length < MIN_PASSWORD_LENGTH) return { bars, label: 'Too short' };
  return { bars, label: bars >= 4 ? 'Strong' : 'Good' };
}

/**
 * What is wrong with a new password and its confirmation, field by field —
 * the keys are the server's (`new_password`), so both kinds of error land in
 * the same place on screen.
 */
export function newPasswordProblems(password: string, confirm: string): Record<string, string> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { new_password: `Use at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirm) return { confirm: "The passwords don't match." };
  return {};
}
