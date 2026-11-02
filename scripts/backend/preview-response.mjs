// Guarded reads of the two local auth responses that preview-account.mjs parses: the admin call that creates the
// synthetic preview account, and the password sign-in that returns its session (QA-9 phase 3N gap G5; PRD 22.1: never
// log tokens). The script used to call response.json() and login.json() inline. A body that was not JSON could throw a
// V8 error quoting part of it, and the sign-in's ok was never checked. Pure: no import, and no file, network, process or
// console use; the caller passes the fetch response it already has. A response whose ok is not exactly true is refused
// before its body is read. A body read that throws or rejects is dropped unbound and unread. Each refusal is a new Error
// with one fixed message from the closed list below, chosen by which export was called: no caller text, body, token,
// parse detail or cause. Each export returns a new frozen object holding only the one field the script uses, read once.

const UNREAD = Symbol('unread');
const MISSING = Symbol('missing');

// The closed list. The create refusal is the exact message the script already threw for a create response that was not ok.
const CREATE = Object.freeze({
  field: 'id',
  refused: 'Could not create local preview account',
  unread: 'Could not read the local preview account response; it is not shown because it can hold credentials',
  notObject: 'The local preview account response was not a JSON object; it is not shown because it can hold credentials',
  missing: 'The local preview account response had no account id; it is not shown because it can hold credentials',
});
const LOGIN = Object.freeze({
  field: 'access_token',
  refused: 'Could not sign in to local preview account',
  unread: 'Could not read the local preview sign-in response; it is not shown because it can hold tokens',
  notObject: 'The local preview sign-in response was not a JSON object; it is not shown because it can hold tokens',
  missing: 'The local preview sign-in response had no access token; it is not shown because it can hold tokens',
});

/** True only for an object whose ok is exactly true. Anything thrown while reading ok is dropped unread, and refuses. */
function isOk(response) {
  try {
    return response !== null && typeof response === 'object' && response.ok === true;
  } catch {
    return false;
  }
}

/** What response.json() resolves to, or UNREAD. A throw or rejection is never bound, so nothing here can read it. */
async function bodyOrUnread(response) {
  try {
    return await response.json();
  } catch {
    return UNREAD;
  }
}

/** True for a JSON object: not null, not an array, not a scalar. Anything thrown while checking is dropped, and refuses. */
function isObject(body) {
  try {
    return body !== null && typeof body === 'object' && !Array.isArray(body);
  } catch {
    return false;
  }
}

/** The body's field, read once, when it is a nonempty string; MISSING otherwise. A throw while reading is dropped unread. */
function fieldOrMissing(body, field) {
  try {
    const value = body[field];
    return typeof value === 'string' && value !== '' ? value : MISSING;
  } catch {
    return MISSING;
  }
}

/** The operation's required field from an ok response, or a new Error with one of that operation's fixed messages. */
async function readRequired(response, operation) {
  if (!isOk(response)) throw new Error(operation.refused);
  const body = await bodyOrUnread(response);
  if (body === UNREAD) throw new Error(operation.unread);
  if (!isObject(body)) throw new Error(operation.notObject);
  const value = fieldOrMissing(body, operation.field);
  if (value === MISSING) throw new Error(operation.missing);
  return value;
}

/** The new account's id, from the admin create-user response. */
export async function readCreatedAccount(response) {
  return Object.freeze({ id: await readRequired(response, CREATE) });
}

/** The session's access token, from the password sign-in response. */
export async function readLoginSession(response) {
  return Object.freeze({ access_token: await readRequired(response, LOGIN) });
}
