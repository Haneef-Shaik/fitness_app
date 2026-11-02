# Independent pure-test output

```text
TAP version 13
# Subtest: an ok response with the required nonempty string gives a new frozen object holding that field alone, after reading ok, then json, and calling json() once with no argument
ok 1 - an ok response with the required nonempty string gives a new frozen object holding that field alone, after reading ok, then json, and calling json() once with no argument
  ---
  duration_ms: 1.907917
  type: 'test'
  ...
# Subtest: a response that is not ok is refused with the operation's fixed message before its body is read: json() is never called
ok 2 - a response that is not ok is refused with the operation's fixed message before its body is read: json() is never called
  ---
  duration_ms: 4.664334
  type: 'test'
  ...
# Subtest: a response that is not ok is touched only to read ok: a proxy that records every operation sees one read of ok, and an ok that throws refuses without showing it
ok 3 - a response that is not ok is touched only to read ok: a proxy that records every operation sees one read of ok, and an ok that throws refuses without showing it
  ---
  duration_ms: 0.286084
  type: 'test'
  ...
# Subtest: a body read that throws or rejects gives the fixed unread message, is never retried, and shows nothing of what was thrown
ok 4 - a body read that throws or rejects gives the fixed unread message, is never retried, and shows nothing of what was thrown
  ---
  duration_ms: 1.923833
  type: 'test'
  ...
# Subtest: a json that is missing or not a function, or a json() that gives a thenable that throws or rejects, gives the fixed unread message
ok 5 - a json that is missing or not a function, or a json() that gives a thenable that throws or rejects, gives the fixed unread message
  ---
  duration_ms: 0.646458
  type: 'test'
  ...
# Subtest: a thrown value is never read: getters on every field and proxies that watch every trap see no access
ok 6 - a thrown value is never read: getters on every field and proxies that watch every trap see no access
  ---
  duration_ms: 0.686334
  type: 'test'
  ...
# Subtest: a body that is not a JSON object (null, an array, a scalar) gives the fixed not-an-object message
ok 7 - a body that is not a JSON object (null, an array, a scalar) gives the fixed not-an-object message
  ---
  duration_ms: 0.866917
  type: 'test'
  ...
# Subtest: an object without its required nonempty string field gives the fixed missing-field message, and a field getter that throws shows nothing
ok 8 - an object without its required nonempty string field gives the fixed missing-field message, and a field getter that throws shows nothing
  ---
  duration_ms: 1.094
  type: 'test'
  ...
# Subtest: diagnostics come from one closed list of eight fixed messages: each operation uses its own four, takes no caller text, and throws a new error every time
ok 9 - diagnostics come from one closed list of eight fixed messages: each operation uses its own four, takes no caller text, and throws a new error every time
  ---
  duration_ms: 0.930958
  type: 'test'
  ...
1..9
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 49.205459
```

```text
TAP version 13
# Subtest: each consumer is its before-source with two lines replaced in place, the child import by the wrapper import and the inline status parse by one wrapper call, and nothing else but preview-account.mjs’s assigned response edits (read as text, never loaded)
ok 1 - each consumer is its before-source with two lines replaced in place, the child import by the wrapper import and the inline status parse by one wrapper call, and nothing else but preview-account.mjs’s assigned response edits (read as text, never loaded)
  ---
  duration_ms: 5.632708
  type: 'test'
  ...
# Subtest: each consumer reads status through the wrapper alone: one wrapper import, one call with no argument, and no child process, status command, JSON.parse or response .json() call of its own
ok 2 - each consumer reads status through the wrapper alone: one wrapper import, one call with no argument, and no child process, status command, JSON.parse or response .json() call of its own
  ---
  duration_ms: 0.726125
  type: 'test'
  ...
# Subtest: the existing exact guard follows the wrapper call at once, unchanged, nothing runs before it, and every side effect after it is the before-source byte for byte, apart from preview-account.mjs’s assigned response edits
ok 3 - the existing exact guard follows the wrapper call at once, unchanged, nothing runs before it, and every side effect after it is the before-source byte for byte, apart from preview-account.mjs’s assigned response edits
  ---
  duration_ms: 0.482084
  type: 'test'
  ...
# Subtest: this file reads both consumers as text only: its sole imports are assert, fs and test, and it has no run-time load
ok 4 - this file reads both consumers as text only: its sole imports are assert, fs and test, and it has no run-time load
  ---
  duration_ms: 0.267041
  type: 'test'
  ...
1..4
# tests 4
# suites 0
# pass 4
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 37.472167
```
