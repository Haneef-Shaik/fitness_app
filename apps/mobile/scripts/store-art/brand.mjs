// Brand configuration guard for the DS-6 store-art generator (DEC-01).
// The working name stays provisional until a dated trademark clearance is on record. This guard
// refuses to let the generator call a name cleared unless the config cites an evidence file under
// docs/evidence/ that carries the structured line
//   DEC-01 clearance: <exact name> · cleared YYYY-MM-DD · <qualified reviewer>
// It records that such evidence exists. It does not and cannot decide that a name is legally clear;
// a verifier still reads the record.

export const BRAND_NAME_MAX_LENGTH = 30; // Google Play title and App Store name limits

const ALLOWED_KEYS = Object.freeze(['appName', 'nameStatus', 'decision', 'clearanceEvidence']);
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} .&'+-]*$/u;
const EVIDENCE_PATTERN = /^docs\/evidence\/[A-Za-z0-9._/-]+\.md$/;

function assertName(appName) {
  const valid =
    typeof appName === 'string' &&
    appName.length > 0 &&
    appName.length <= BRAND_NAME_MAX_LENGTH &&
    appName.trim() === appName &&
    NAME_PATTERN.test(appName);
  if (!valid) {
    throw new Error(
      `appName must be 1–${BRAND_NAME_MAX_LENGTH} characters of letters, digits, spaces and . & ' + -, with no leading or trailing space`,
    );
  }
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function clearanceLine(appName) {
  return new RegExp(`^DEC-01 clearance: ${escapeRegExp(appName)} · cleared \\d{4}-\\d{2}-\\d{2} · \\S.*$`, 'm');
}

function assertEvidencePath(path) {
  const valid = typeof path === 'string' && EVIDENCE_PATTERN.test(path) && !path.split('/').includes('..');
  if (!valid) {
    throw new Error('A cleared name needs clearanceEvidence: a docs/evidence/**/*.md record of the trademark clearance');
  }
}

/**
 * Validate the brand config and return a frozen, normalised copy.
 * @param {unknown} raw parsed brand.config.json
 * @param {{ readEvidence: (path: string) => string | null }} io reads a repo-relative file, or null if absent
 */
export function validateBrand(raw, { readEvidence }) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Brand config must be a JSON object');
  }
  const unknown = Object.keys(raw).filter((key) => !ALLOWED_KEYS.includes(key));
  if (unknown.length > 0) {
    throw new Error(`Brand config has unknown keys: ${unknown.join(', ')}`);
  }
  const { appName, nameStatus, decision, clearanceEvidence } = raw;
  assertName(appName);
  if (decision !== 'DEC-01') {
    throw new Error('decision must be "DEC-01", the PRD §27 brand decision');
  }
  if (nameStatus === 'provisional') {
    if (clearanceEvidence !== null) {
      throw new Error('A provisional name cannot cite clearance evidence; set clearanceEvidence to null');
    }
    return Object.freeze({ appName, nameStatus, decision, clearanceEvidence: null, trademarkClearance: 'unproved' });
  }
  if (nameStatus !== 'cleared') {
    throw new Error('nameStatus must be "provisional" or "cleared"');
  }
  assertEvidencePath(clearanceEvidence);
  const text = readEvidence(clearanceEvidence);
  if (typeof text !== 'string') {
    throw new Error(`Clearance evidence ${clearanceEvidence} does not exist`);
  }
  if (!clearanceLine(appName).test(text)) {
    throw new Error(
      `Clearance evidence ${clearanceEvidence} must contain the line "DEC-01 clearance: ${appName} · cleared YYYY-MM-DD · <qualified reviewer>"`,
    );
  }
  return Object.freeze({ appName, nameStatus, decision, clearanceEvidence, trademarkClearance: 'recorded' });
}
