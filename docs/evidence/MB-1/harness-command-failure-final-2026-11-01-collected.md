I've finished this writer phase. A failed `supabase status` command can no longer print its captured output, which holds the local keys. None of the tests have been run, so nothing here is proven at runtime yet.

**What changed** (seven paths, Read/Grep/Edit/Write only, no denials):
1. `scripts/backend/status-command.mjs` (new): `readLocalStatus(run = execFileSync)`.
   - It runs the same `pnpm exec supabase status -o json` call with the same options.
   - If the command throws, the wrapper ignores the thrown value without reading it and throws a new error with one fixed message. That error has no cause and no other fields.
   - Successful output goes to the existing `parseStatusOutput`, outside that catch, so the parser's own refusals still come through.
   - Loading the file runs nothing. The real command is only the default for `run`.
2. `scripts/backend/status-command.test.mjs` (new, written before the wrapper): 7 tests, all with fake commands.
   - A check of the wrapper's source runs before the file is loaded. If someone later makes the wrapper run the command on load, the test fails instead of starting a real child process.
   - Success as a string and as a Buffer, with exactly one call and the exact command, arguments and options.
   - Output goes to the parser unchanged, and badly formed output still gets the parser's own refusal.
   - Thrown errors with a fake key in the message, stack, cause, stdout, stderr and output. Also thrown primitive values.
   - Hostile thrown values (getters and proxies) that record any access. They prove the wrapper never reads what was thrown.
   - Text-only checks of the three suites. They are never imported.
3. `verify.mjs`, `verify-gym.mjs`, `verify-freezes.mjs`: the two unused imports became one wrapper import, and the status line became `readLocalStatus()`. Every other byte is unchanged, including the loopback assertion on the next line.
4. `scripts/backend/status-output.test.mjs`: only the wiring constants and the wiring test changed, to follow suite → wrapper → parser. It checks everything it checked before. The other six tests are byte for byte unchanged.
5. `docs/evidence/MB-1/harness-command-failure-2026-11-01.md` (new): why, exact scope, the tests that still need running, limits and who owns what is left.

**Self-review**
- **Critical / High:** none.
- **Medium 1:** RED, GREEN, the mutation checks and the suites' syntax are all unproven; I only traced the tests by hand. Both test files need a fresh run by a separate verifier, which the earlier 7/7 doesn't cover:
  - `rtk proxy node --test scripts/backend/status-command.test.mjs`
  - `rtk proxy node --test scripts/backend/status-output.test.mjs`
- **Medium 2 (not changed, out of scope):** `verify-freeze-projection.mjs` has a similar unguarded failure path: `JSON.parse(execFileSync('docker', … psql …))` with stderr piped. MB-1/QA-9 should decide whether it belongs to G5.
- **Low 1:** both test files check the three suites, so some checks overlap. The original brief and the scope correction each asked for them.
- **Low 2:** the load-time check is text matching. Contrived code could get past it, but ordinary edits make it fail.
- **Low 3:** this is by design. A failed status command now shows no exit code or stderr; to diagnose it, run the command by hand in a trusted terminal.
- **Low 4:** the hostile-value tests cover JavaScript-level reads only, not anything inside Node or V8.
- **Low 5:** I did not run the code-reviewer, security-reviewer or tdd-guide reviews (the brief bans sub-agents), and did not update `handoff.md` (it is outside the seven paths). Nothing is committed.

G1–G4, G6, G7 and the shared target binding stay open with MB-1, verified under QA-9 phase 3N.

```
GOAL: MB-1
BRANCH: codex/mb1-identity
HEAD: 2a95726 (uncommitted working-tree changes; commits not authorised this phase)
HANDOFF: docs/evidence/MB-1/harness-command-failure-2026-11-01.md (phase record; docs/plan/runs/MB-1/handoff.md outside the 7 allowed paths, not updated)
BOXES: 0/? Done-when boxes met (none claimed; F4/G5 prerequisite phase only)
STATUS: ready-for-verification
NOTES: Writer phase complete, all tests UNRUN; a separate verifier must run both pure test files (commands in evidence) and must not run the three live suites; G1-G4/G6/G7 and target binding stay open with MB-1/QA-9.
```