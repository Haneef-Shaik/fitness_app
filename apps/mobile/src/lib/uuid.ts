/**
 * Client-generated ids.
 *
 * **These must be real UUIDs.** The server types `Idempotency-Key` as a UUID and
 * rejects anything else with a 422 — which surfaces as a set that logs fine on
 * the phone and never uploads. That is the worst possible shape of bug here, so
 * the format is part of the contract (**I8**) and is tested.
 */

/** RFC 4122 v4. Uses the platform generator when there is one. */
export function uuid(): string {
  const c = globalThis.crypto as (Crypto & { randomUUID?: () => string }) | undefined;
  if (typeof c?.randomUUID === 'function') return c.randomUUID();

  // Hermes does not always expose crypto.randomUUID, and a set that cannot be
  // uploaded is worse than a less-random id: the values only have to be unique
  // to one device's outbox.
  const bytes = new Uint8Array(16);
  if (typeof c?.getRandomValues === 'function') {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant 10

  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-`
    + `${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (v: string): boolean => UUID_PATTERN.test(v);
