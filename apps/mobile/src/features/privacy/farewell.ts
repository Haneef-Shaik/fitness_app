/**
 * One sentence for the welcome screen after an account is deleted (K-07).
 *
 * Signing out is what takes a person to the welcome screen — AuthGate sees the
 * session end and resets there, from wherever they were. A route parameter
 * would lose that race half the time; a sentence left here is read once by
 * whichever welcome screen mounts next, and then it is gone.
 */
let pending: string | null = null;

export function leaveFarewell(message: string): void {
  pending = message;
}

/** The sentence, once. A second read returns null. */
export function takeFarewell(): string | null {
  const message = pending;
  pending = null;
  return message;
}
