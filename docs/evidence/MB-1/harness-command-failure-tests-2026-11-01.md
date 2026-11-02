# Independent synthetic test capture

Session 0d28a5a0-c24c-4345-9ac1-59f8df6e404a. Only injected fake commands; no live backend tests. Captured 2026-11-01T12:48:52.539426+00:00

```text
rtk proxy node --test scripts/backend/status-command.test.mjs

TAP version 13
# Subtest: a successful run gives the parsed object, from a string or a Buffer, after one call of the exact command and options
ok 1 - a successful run gives the parsed object, from a string or a Buffer, after one call of the exact command and options
  ---
  duration_ms: 0.388583
  type: 'test'
  ...
# Subtest: a successful run's output goes to parseStatusOutput unchanged: the helper's value, or its own fixed refusal
ok 2 - a successful run's output goes to parseStatusOutput unchanged: the helper's value, or its own fixed refusal
  ---
  duration_ms: 1.61275
  type: 'test'
  ...
# Subtest: a failed command throws one new fixed error that shows no message, stack, cause or field of the error it threw
ok 3 - a failed command throws one new fixed error that shows no message, stack, cause or field of the error it threw
  ---
  duration_ms: 0.828833
  type: 'test'
  ...
# Subtest: a thrown primitive gives the same fixed error and shows nothing of the value
ok 4 - a thrown primitive gives the same fixed error and shows nothing of the value
  ---
  duration_ms: 0.45975
  type: 'test'
  ...
# Subtest: the thrown value is never read: getters on every field and proxies that watch every trap see no access
ok 5 - the thrown value is never read: getters on every field and proxies that watch every trap see no access
  ---
  duration_ms: 0.189584
  type: 'test'
  ...
# Subtest: the wrapper exports readLocalStatus alone, binds no caught value, and parses through the helper after its catch
ok 6 - the wrapper exports readLocalStatus alone, binds no caught value, and parses through the helper after its catch
  ---
  duration_ms: 0.184125
  type: 'test'
  ...
# Subtest: all three suites read status through the wrapper alone: the direct command and its imports are gone, and the loopback assertion follows unchanged (read as text, never imported)
ok 7 - all three suites read status through the wrapper alone: the direct command and its imports are gone, and the loopback assertion follows unchanged (read as text, never imported)
  ---
  duration_ms: 0.689083
  type: 'test'
  ...
1..7
# tests 7
# suites 0
# pass 7
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 39.756917
```

```text
rtk proxy node --test scripts/backend/status-output.test.mjs

TAP version 13
# Subtest: a JSON object, as a string or as a Buffer, comes back exactly as JSON.parse gives it
ok 1 - a JSON object, as a string or as a Buffer, comes back exactly as JSON.parse gives it
  ---
  duration_ms: 1.382708
  type: 'test'
  ...
# Subtest: the helper decides no target: values come back unchanged, so each suite's loopback assertion still refuses a near miss
ok 2 - the helper decides no target: values come back unchanged, so each suite's loopback assertion still refuses a near miss
  ---
  duration_ms: 0.153375
  type: 'test'
  ...
# Subtest: malformed output fails closed with one fixed message that shows no input, parse detail, key or cause
ok 3 - malformed output fails closed with one fixed message that shows no input, parse detail, key or cause
  ---
  duration_ms: 1.519292
  type: 'test'
  ...
# Subtest: JSON that is not an object (null, an array, a scalar) fails closed with its own fixed message
ok 4 - JSON that is not an object (null, an array, a scalar) fails closed with its own fixed message
  ---
  duration_ms: 0.56875
  type: 'test'
  ...
# Subtest: anything but a string or a Buffer is refused before any parse, with the fixed message
ok 5 - anything but a string or a Buffer is refused before any parse, with the fixed message
  ---
  duration_ms: 0.163959
  type: 'test'
  ...
# Subtest: all three suites reach the helper only through the status-command wrapper, which runs the unchanged status command once and passes its output straight to the helper (read as text, never imported)
ok 6 - all three suites reach the helper only through the status-command wrapper, which runs the unchanged status command once and passes its output straight to the helper (read as text, never imported)
  ---
  duration_ms: 0.405166
  type: 'test'
  ...
# Subtest: the helper is pure and narrow: one export, node:buffer its only import, and no file, network, child, console or process use
ok 7 - the helper is pure and narrow: one export, node:buffer its only import, and no file, network, child, console or process use
  ---
  duration_ms: 0.171875
  type: 'test'
  ...
1..7
# tests 7
# suites 0
# pass 7
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 39.333583
```
