import { createHash } from 'node:crypto';

// Stable catalogue identities (CT-1). Every catalogue id is a version-5 UUID of a fixed namespace and the record's
// permanent slug, so a rebuild or a second seed run produces the same keys, and catalogue keys never share the
// development fixture's sequential key space (QA-1 F-6). A slug is permanent: renaming one creates a new record.

export const CATALOGUE_NAMESPACE = '0b6c3c8e-5d7a-4f1e-9a42-6f3d2c1b8e90';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** RFC 4122 §4.3 name-based UUID with SHA-1 (version 5). */
export function uuidv5(name, namespace = CATALOGUE_NAMESPACE) {
  if (typeof namespace !== 'string' || !UUID.test(namespace)) throw new Error(`uuidv5 namespace ${String(namespace)} is not a lower-case UUID`);
  if (typeof name !== 'string') throw new Error('uuidv5 name must be a string');
  const hash = createHash('sha1').update(Buffer.from(namespace.replaceAll('-', ''), 'hex')).update(name, 'utf8').digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const key = (label, value) => {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} slug must be a non-empty string`);
  return value;
};

export const exerciseId = (slug) => uuidv5(`fitlog:catalogue:exercise:${key('exercise', slug)}`);
export const programmeId = (slug) => uuidv5(`fitlog:catalogue:programme:${key('programme', slug)}`);
export const dayId = (programme, day) => uuidv5(`fitlog:catalogue:programme:${key('programme', programme)}:day:${key('day', day)}`);
export function prescriptionId(programme, day, position) {
  if (!Number.isInteger(position) || position < 1) throw new Error(`prescription position ${String(position)} must be a positive integer`);
  return uuidv5(`fitlog:catalogue:programme:${key('programme', programme)}:day:${key('day', day)}:item:${position}`);
}
