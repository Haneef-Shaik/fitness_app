import { Buffer } from 'node:buffer';

// The guarded parse of `supabase status -o json` output that the caller has already captured (QA-9 phase 3N gap G5, fix
// F4): the same guard as local-stack.mjs's own parse, for verify.mjs, verify-gym.mjs and verify-freezes.mjs. Pure: it
// runs nothing, reads and writes nothing, and prints nothing. The output holds keys, so each refusal is fixed text with no
// part of the input, no parse detail, no key name and no cause. It decides no target: each suite still asserts API_URL.

const NOT_JSON = 'supabase status -o json did not print JSON; its output is not shown because it holds keys';
const NOT_OBJECT = 'supabase status -o json did not print a JSON object; its output is not shown because it holds keys';
const UNPARSED = Symbol('unparsed');

/** JSON.parse's value, or UNPARSED. The parse error is dropped unread, because its message quotes the input. */
function parsedOrUnparsed(text) {
  try {
    return JSON.parse(text);
  } catch {
    return UNPARSED;
  }
}

/** The JSON object in captured status output: a string, or a Buffer read as UTF-8. Anything else throws a fixed message. */
export function parseStatusOutput(output) {
  const text = typeof output === 'string' ? output : Buffer.isBuffer(output) ? output.toString('utf8') : undefined;
  const value = text === undefined ? UNPARSED : parsedOrUnparsed(text);
  if (value === UNPARSED) throw new Error(NOT_JSON);
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(NOT_OBJECT);
  return value;
}
