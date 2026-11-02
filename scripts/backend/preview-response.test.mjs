import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inspect } from 'node:util';
import * as previewResponse from './preview-response.mjs';

// The guarded reads of the two local auth responses that preview-account.mjs parses (QA-9 phase 3N gap G5; PRD 22.1:
// never log tokens): the admin create-user response, which must carry the new account's id, and the password sign-in
// response, which must carry its access token. Every response here is a fake built in this file from synthetic values
// and passed straight to the pure helper. Nothing here imports or runs the preview script, starts a process, reads a
// file, a real status or a credential, or reaches the network.
const { readCreatedAccount, readLoginSession } = previewResponse;

// Credential-shaped synthetic values, assembled from parts so no literal appears in any file. They are not credentials.
const TOKEN = ['previewresponse', 'access', 'synthetic', 'must-never-print-0001'].join('-');
const REFRESH = ['previewresponse', 'refresh', 'synthetic', 'must-never-print-0002'].join('-');
const SENTINEL = ['previewresponse', 'body', 'sentinel', 'must-never-print-0003'].join('-');
const ACCOUNT_ID = ['previewresponse', 'account', 'synthetic', 'must-never-print-0004'].join('-');
const EMAIL = `${['previewresponse', 'synthetic'].join('-')}@example.invalid`;
const SYNTHETIC = Object.freeze([TOKEN, REFRESH, SENTINEL, ACCOUNT_ID, EMAIL]);

// The closed list: four fixed messages per operation, chosen by which export was called. The create refusal is the
// exact message preview-account.mjs already threw for a create response that was not ok.
const CREATE = Object.freeze({
  refused: 'Could not create local preview account',
  unread: 'Could not read the local preview account response; it is not shown because it can hold credentials',
  notObject: 'The local preview account response was not a JSON object; it is not shown because it can hold credentials',
  missing: 'The local preview account response had no account id; it is not shown because it can hold credentials',
});
const LOGIN = Object.freeze({
  refused: 'Could not sign in to local preview account',
  unread: 'Could not read the local preview sign-in response; it is not shown because it can hold tokens',
  notObject: 'The local preview sign-in response was not a JSON object; it is not shown because it can hold tokens',
  missing: 'The local preview sign-in response had no access token; it is not shown because it can hold tokens',
});
const ALLOWLIST = Object.freeze([...Object.values(CREATE), ...Object.values(LOGIN)]);

// What a thrown value or a body would show if any part of it got through: a parse or type error's name or wording, a
// response or body field as `name: value`, or a cause or inner errors under inspection.
const DETAIL = /SyntaxError|TypeError|is not valid JSON|in JSON at position|Unexpected token|Unexpected end of JSON|Unterminated string|is not a function|Cannot read propert|\[cause\]|\[errors\]|\b(?:cause|errors|body|status|statusText|headers|access_token|refresh_token)\s*:/;

/** A synthetic create-user body, shaped like the local auth admin response. */
const createdBody = () => ({ id: ACCOUNT_ID, aud: 'authenticated', role: 'authenticated', email: EMAIL, app_metadata: { provider: 'email' }, user_metadata: {} });
/** A synthetic password sign-in body, shaped like the local auth token response. */
const sessionBody = () => ({ access_token: TOKEN, token_type: 'bearer', expires_in: 3600, refresh_token: REFRESH, user: { id: ACCOUNT_ID, email: EMAIL } });

// Each operation: its export, the one field it needs, its synthetic body, the other operation's body (which lacks that
// field at the top level), and its own four messages.
const OPERATIONS = Object.freeze([
  { name: 'create', read: readCreatedAccount, field: 'id', body: createdBody, other: sessionBody, messages: CREATE },
  { name: 'login', read: readLoginSession, field: 'access_token', body: sessionBody, other: createdBody, messages: LOGIN },
]);

/** A fake fetch response with this `ok` whose json() records each call, then returns what `respond` returns. */
const fakeResponse = (ok, respond, calls) => ({ ok, json: (...received) => { calls.push(received); return respond(); } });
const resolving = (value) => () => Promise.resolve(value);
const rejecting = (value) => () => Promise.reject(value);
const throwing = (value) => () => { throw value; };
/** A copy of `body` without `field`, built new. */
const withoutField = (body, field) => Object.fromEntries(Object.entries(body).filter(([key]) => key !== field));
/** Throws synthetic tokens: what any read a test forbids would raise. */
const leak = () => { throw new Error(`${TOKEN} ${SENTINEL}`); };

/**
 * A proxy response that records every operation on it. Reading ok gives `ok`, and reading json gives `json` when one is
 * passed; any other operation, or a read of json when none is passed, throws synthetic tokens.
 */
function watchedResponse(touched, ok, json) {
  const traps = new Proxy({}, {
    get(_, trap) {
      touched.push(`trap ${String(trap)}`);
      if (trap !== 'get') return leak;
      return (target, key) => {
        touched.push(`get ${String(key)}`);
        if (key === 'ok') return ok;
        if (key === 'json' && json) return json;
        return leak();
      };
    },
  });
  return new Proxy({}, traps);
}

/** A thrown value that records every read: a getter for each field or conversion a handler might touch, each throwing tokens. */
function watchedGetters(touched) {
  const keys = ['message', 'stack', 'name', 'cause', 'code', 'body', 'status', 'errors', 'constructor', 'toString', 'valueOf', 'toJSON', 'then', Symbol.toPrimitive, Symbol.toStringTag, inspect.custom];
  const value = Object.create(SyntaxError.prototype);
  for (const key of keys) {
    Object.defineProperty(value, key, { enumerable: true, get() { touched.push(String(key)); return leak(); } });
  }
  return value;
}

/** A proxy whose handler records every trap looked up, so any operation on it is seen, then throws synthetic tokens. */
function watchedProxy(touched, target) {
  const traps = new Proxy({}, { get: (_, trap) => { touched.push(`trap ${String(trap)}`); return leak; } });
  return new Proxy(target, traps);
}

/** A real V8 parse error over a token-bearing body that is not JSON: its message can quote part of that body. */
function realParseError() {
  try {
    JSON.parse(`{"access_token":${TOKEN},"refresh_token":"${REFRESH}"}`);
  } catch (error) {
    return error;
  }
  throw new Error('the synthetic body unexpectedly parsed');
}

/**
 * The error `action` rejects with, after checking every way it can be shown: its message, its string form, its stack, a
 * full inspection, JSON with and without its hidden fields, and a structured clone. It must be a new plain Error, never
 * the thrown value, with one message from the closed list and no other field; and none of its forms may hold a synthetic
 * value, a parse or type detail, a body or response field, or a cause.
 */
async function refusal(action, expected, label, thrown) {
  let caught;
  await assert.rejects(action, (error) => { caught = error; return true; }, `${label}: must reject`);
  assert.equal(caught === thrown, false, `${label}: a new error, not the thrown value`);
  assert.equal(Object.getPrototypeOf(caught), Error.prototype, `${label}: a plain Error`);
  assert.deepEqual(Object.getOwnPropertyNames(caught).filter((name) => name !== 'stack'), ['message'], `${label}: no field but the message`);
  assert.deepEqual(Object.getOwnPropertySymbols(caught), [], `${label}: no symbol field`);
  assert.equal(caught.message, expected, `${label}: the fixed message`);
  assert.ok(ALLOWLIST.includes(caught.message), `${label}: a message from the closed list`);
  assert.equal('cause' in caught, false, `${label}: no cause`);
  const [head, ...frames] = String(caught.stack).split('\n');
  assert.equal(head, `Error: ${expected}`, `${label}: the stack starts with the fixed message`);
  for (const frame of frames) assert.match(frame, /^\s+at /, `${label}: after the message the stack holds call sites only`);
  const shown = [
    caught.message,
    String(caught),
    String(caught.stack),
    inspect(caught, { showHidden: true, depth: Infinity }),
    JSON.stringify(caught),
    JSON.stringify(caught, Object.getOwnPropertyNames(caught)),
    inspect(structuredClone(caught), { showHidden: true, depth: Infinity }),
  ];
  for (const form of shown) {
    for (const part of SYNTHETIC) assert.equal(form.includes(part), false, `${label}: a synthetic value is shown`);
    assert.doesNotMatch(form, /previewresponse|must-never-print|example\.invalid|Bearer/, `${label}: part of a synthetic value is shown`);
    assert.doesNotMatch(form, DETAIL, `${label}: a detail of a thrown value or a body is shown`);
  }
  return caught;
}

test('an ok response with the required nonempty string gives a new frozen object holding that field alone, after reading ok, then json, and calling json() once with no argument', async () => {
  for (const { name, read, field, body } of OPERATIONS) {
    for (const [index, parsed] of [body(), { [field]: body()[field] }, { [field]: 'x' }].entries()) {
      const touched = [];
      const snapshot = structuredClone(parsed);
      const json = (...received) => { touched.push(['json() called', received]); return Promise.resolve(parsed); };
      const result = await read(watchedResponse(touched, true, json));
      assert.deepEqual(touched, ['trap get', 'get ok', 'trap get', 'get json', ['json() called', []]], `${name} ${index}: ok first, then json() once with no argument, nothing else on the response`);
      assert.deepEqual(result, { [field]: parsed[field] }, `${name} ${index}: only the one field the script uses`);
      assert.equal(result[field], snapshot[field], `${name} ${index}: the field's value, unchanged`);
      assert.ok(Object.isFrozen(result), `${name} ${index}: frozen`);
      assert.notEqual(result, parsed, `${name} ${index}: a new object, not the parsed body`);
      assert.deepEqual(parsed, snapshot, `${name} ${index}: the body is only read, never changed`);
    }
  }
});

test("a response that is not ok is refused with the operation's fixed message before its body is read: json() is never called", async () => {
  const notOk = [false, undefined, null, 0, 1, '', 'true', {}, [], Object(true)];
  const notResponses = [undefined, null, true, 200, TOKEN, Symbol(TOKEN)];
  for (const { name, read, body, messages } of OPERATIONS) {
    for (const [index, ok] of notOk.entries()) {
      const calls = [];
      await refusal(() => read(fakeResponse(ok, resolving(body()), calls)), messages.refused, `${name}: ok ${index}`);
      assert.deepEqual(calls, [], `${name}: ok ${index}: json() is never called`);
    }
    const calls = [];
    await refusal(() => read({ json: (...received) => { calls.push(received); return Promise.resolve(body()); } }), messages.refused, `${name}: no ok at all`);
    assert.deepEqual(calls, [], `${name}: no ok at all: json() is never called, so a failed sign-in stops before parsing and before onboarding`);
    for (const [index, response] of notResponses.entries()) await refusal(() => read(response), messages.refused, `${name}: not a response ${index}`);
  }
});

test('a response that is not ok is touched only to read ok: a proxy that records every operation sees one read of ok, and an ok that throws refuses without showing it', async () => {
  for (const { name, read, messages } of OPERATIONS) {
    for (const ok of [false, undefined]) {
      const touched = [];
      await refusal(() => read(watchedResponse(touched, ok)), messages.refused, `${name}: watched, ok ${String(ok)}`);
      assert.deepEqual(touched, ['trap get', 'get ok'], `${name}: ok ${String(ok)}: only ok was read; json and the body were never touched`);
    }
    const touched = [];
    const response = { get ok() { touched.push('ok'); return leak(); }, json: () => { touched.push('json'); return Promise.resolve({}); } };
    await refusal(() => read(response), messages.refused, `${name}: an ok that throws synthetic tokens`);
    assert.deepEqual(touched, ['ok'], `${name}: an ok that throws: json() is never called`);
  }
});

test('a body read that throws or rejects gives the fixed unread message, is never retried, and shows nothing of what was thrown', async () => {
  const bodyError = Object.assign(
    new SyntaxError(`Unexpected token in JSON at position 16: ${TOKEN}`, { cause: new Error(`${SENTINEL} ${REFRESH}`) }),
    { stack: `SyntaxError: ${TOKEN}\n    at ${SENTINEL} (file:///${REFRESH}.mjs:1:1)`, body: JSON.stringify(sessionBody()), status: 200, headers: { authorization: `Bearer ${TOKEN}` } },
  );
  const thrown = [
    ['a real JSON.parse error over a token-bearing body', realParseError()],
    ['a parse error carrying the body, a cause and a stack of synthetic tokens', bodyError],
    ['an AggregateError around it', new AggregateError([bodyError], `${SENTINEL} ${TOKEN}`)],
    ['a plain object with string forms', { message: TOKEN, body: SENTINEL, toString: () => TOKEN, toJSON: () => REFRESH }],
    ['a token string', TOKEN],
    ['the whole body as text', JSON.stringify(sessionBody())],
    ['a symbol', Symbol(TOKEN)],
    ['undefined', undefined],
    ['null', null],
  ];
  for (const { name, read, messages } of OPERATIONS) {
    for (const [label, value] of thrown) {
      for (const [how, make] of [['rejects with', rejecting], ['throws', throwing]]) {
        const calls = [];
        await refusal(() => read(fakeResponse(true, make(value), calls)), messages.unread, `${name}: json() ${how} ${label}`, value);
        assert.deepEqual(calls, [[]], `${name}: json() ${how} ${label}: called once with no argument, never retried`);
      }
    }
  }
});

test('a json that is missing or not a function, or a json() that gives a thenable that throws or rejects, gives the fixed unread message', async () => {
  for (const { name, read, messages } of OPERATIONS) {
    const odd = [
      ['no json', { ok: true }],
      ['json a token string', { ok: true, json: TOKEN }],
      ['json null', { ok: true, json: null }],
      ['a thenable whose then throws synthetic tokens', { ok: true, json: () => ({ then: leak }) }],
      ['a thenable that rejects with synthetic tokens', { ok: true, json: () => ({ then: (_, reject) => reject(new Error(`${TOKEN} ${SENTINEL}`)) }) }],
    ];
    for (const [label, response] of odd) await refusal(() => read(response), messages.unread, `${name}: ${label}`);
  }
});

test('a thrown value is never read: getters on every field and proxies that watch every trap see no access', async () => {
  const cases = [
    ['getters on every field', (touched) => watchedGetters(touched)],
    ['a proxy over an empty object', (touched) => watchedProxy(touched, {})],
    ['a proxy over a parse error', (touched) => watchedProxy(touched, new SyntaxError(`${TOKEN} ${SENTINEL}`))],
  ];
  for (const { name, read, messages } of OPERATIONS) {
    for (const [label, build] of cases) {
      for (const [how, make] of [['rejects with', rejecting], ['throws', throwing]]) {
        const touched = [];
        const value = build(touched);
        await refusal(() => read(fakeResponse(true, make(value), [])), messages.unread, `${name}: json() ${how} ${label}`, value);
        assert.deepEqual(touched, [], `${name}: json() ${how} ${label}: nothing read the thrown value`);
      }
    }
  }
});

test('a body that is not a JSON object (null, an array, a scalar) gives the fixed not-an-object message', async () => {
  for (const { name, read, body, messages } of OPERATIONS) {
    const notObjects = [null, undefined, [], [body()], TOKEN, JSON.stringify(body()), '', 0, 42, true, false];
    for (const [index, parsed] of notObjects.entries()) {
      const calls = [];
      await refusal(() => read(fakeResponse(true, resolving(parsed), calls)), messages.notObject, `${name}: not an object ${index}`);
      assert.deepEqual(calls, [[]], `${name}: not an object ${index}: json() called once`);
    }
  }
});

test('an object without its required nonempty string field gives the fixed missing-field message, and a field getter that throws shows nothing', async () => {
  for (const { name, read, field, body, other, messages } of OPERATIONS) {
    const value = body()[field];
    const missing = [
      ['an empty object', {}],
      ['the body without the field', withoutField(body(), field)],
      ["the other operation's body", other()],
      ['the field only nested', { user: { [field]: value } }],
      ['an empty string', { ...body(), [field]: '' }],
      ['null', { ...body(), [field]: null }],
      ['a number', { ...body(), [field]: 42 }],
      ['true', { ...body(), [field]: true }],
      ['an array holding the value', { ...body(), [field]: [value] }],
      ['an object holding the value', { ...body(), [field]: { value } }],
      ['a String object holding the value', { ...body(), [field]: Object(value) }],
      ['a getter that throws synthetic tokens', Object.create(Object.prototype, { [field]: { enumerable: true, get: leak } })],
    ];
    for (const [label, parsed] of missing) {
      const calls = [];
      await refusal(() => read(fakeResponse(true, resolving(parsed), calls)), messages.missing, `${name}: ${label}`);
      assert.deepEqual(calls, [[]], `${name}: ${label}: json() called once`);
    }
  }
});

test('diagnostics come from one closed list of eight fixed messages: each operation uses its own four, takes no caller text, and throws a new error every time', async () => {
  assert.deepEqual(Object.keys(previewResponse), ['readCreatedAccount', 'readLoginSession'], 'two operation-specific exports; no message, generic reader or other export');
  assert.equal(new Set(ALLOWLIST).size, ALLOWLIST.length, 'eight distinct messages');
  for (const message of ALLOWLIST) assert.doesNotMatch(message, /previewresponse|must-never-print|access_token|refresh_token|Bearer|[{}"]/, 'a fixed message names no key, token or body');
  for (const { name, read, body, messages } of OPERATIONS) {
    assert.equal(read.length, 1, `${name}: one parameter, the response`);
    const failures = [
      [messages.refused, () => fakeResponse(false, resolving(body()), [])],
      [messages.unread, () => fakeResponse(true, rejecting(new Error(SENTINEL)), [])],
      [messages.notObject, () => fakeResponse(true, resolving(null), [])],
      [messages.missing, () => fakeResponse(true, resolving({}), [])],
    ];
    const errors = [];
    for (const [expected, build] of failures) {
      // Text passed beside the response changes nothing: there is no parameter to carry it.
      errors.push(await refusal(() => read(build(), SENTINEL, { message: TOKEN }), expected, `${name}: with extra arguments`));
      errors.push(await refusal(() => read(build()), expected, `${name}: the same failure again`));
    }
    assert.equal(new Set(errors).size, errors.length, `${name}: every failure throws a new error, never a shared one`);
    assert.deepEqual(errors.map((error) => error.message), Object.values(messages).flatMap((message) => [message, message]), `${name}: only its own four messages, never the other operation's`);
  }
});
