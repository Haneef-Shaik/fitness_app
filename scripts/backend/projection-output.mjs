// The guarded read of the freeze projection query's output for verify-freeze-projection.mjs (MB-1 / QA-9 gap G5). The
// suite passes a callback that runs the query; it is called once here, with no arguments, and never again. A failed query
// raises a value that carries what psql printed, the query text with its inputs, and a message that can quote them, so
// that value is dropped unbound and unread, and a new error with one fixed message, no cause and no field takes its
// place. A parse failure is dropped the same way, because its message quotes the text. Output that is not a string is
// refused without being converted, and JSON that is not an object gets its own fixed message. Pure: this module loads
// nothing, has no real default for the callback, touches no file or network, prints nothing and decides no target or
// database step.

const NO_RUN = 'freeze projection read needs a callback that runs the query; nothing was run';
const FAILED = 'freeze projection query failed; its error and output are not shown because they can hold query text and data';
const NOT_JSON = 'freeze projection query did not print JSON; its output is not shown because it can hold query data';
const NOT_OBJECT = 'freeze projection query did not print a JSON object; its output is not shown because it can hold query data';
const FAILED_RUN = Symbol('failed run');
const UNPARSED = Symbol('unparsed');

/** What the callback returned, or FAILED_RUN. The raised value is never bound, so nothing here can read it. */
function outputOrFailed(run) {
  try {
    return run();
  } catch {
    return FAILED_RUN;
  }
}

/** The parsed value of string output, or UNPARSED. Other output is not converted; a parse failure is dropped unread. */
function parsedOrUnparsed(output) {
  if (typeof output !== 'string') return UNPARSED;
  try {
    return JSON.parse(output);
  } catch {
    return UNPARSED;
  }
}

/** The projection object the callback printed. Each refusal is a new error with one fixed message and no cause. */
export function readProjectionResult(run) {
  if (typeof run !== 'function') throw new Error(NO_RUN);
  const output = outputOrFailed(run);
  if (output === FAILED_RUN) throw new Error(FAILED);
  const value = parsedOrUnparsed(output);
  if (value === UNPARSED) throw new Error(NOT_JSON);
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(NOT_OBJECT);
  return value;
}
