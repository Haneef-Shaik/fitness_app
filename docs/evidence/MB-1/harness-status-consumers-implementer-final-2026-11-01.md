COMPLETE: both consumers now read `supabase status` only through `readLocalStatus`. The new regression test is written but has not been run. Nothing was executed, including the test, any CLI, the database or the network, and nothing was committed. Both consumers were read as text only.

**What changed:** each consumer had two lines replaced in place, so line counts (6 and 18) and every line number are the same:
- `environment.mjs` lines 1 and 3: the `node:child_process` import became `import { readLocalStatus } from './status-command.mjs';`, and the inline `JSON.parse(execFileSync(…))` became `const status = readLocalStatus();`.
- `preview-account.mjs` lines 2 and 7: the same two substitutions.

The loopback guard, the publishable-key guard and everything after them (writes, `0o600` modes, messages, random IDs, fetch and credential handling) are unchanged. `status-command.mjs`, `status-output.mjs` and their two test files were only read.

**The new test** (`status-consumers.test.mjs`) was written before either consumer was edited. It reads both consumers as text and never loads them. It imports only assert, fs and test, starts no process and makes no network call. Its four tests check:
1. Each file equals its pinned before-source with exactly the two substituted lines changed.
2. Each file has one wrapper import and one call, and no `child_process`, `execFileSync`, `JSON.parse` or status-command text of its own.
3. The original guard comes straight after the status read, and every side effect comes after the guard, unchanged.
4. The test file itself loads nothing else.

By reading only, tests 1–3 should fail on the old source and all four should pass now; neither result has been observed. The proposed command, which needs separate approval, is `node --test scripts/backend/status-consumers.test.mjs` (with the repo's usual `rtk proxy` prefix). Don't use `backend:test` for this: it also runs the live suites.

**Paths written (all four permitted, nothing else touched):**
- `scripts/backend/environment.mjs`
- `scripts/backend/preview-account.mjs`
- `scripts/backend/status-consumers.test.mjs` (new)
- `docs/evidence/MB-1/harness-status-consumers-2026-11-01.md` (new)

**Self-review:**
- **Critical / High:** none.
- **M1:** the `code-reviewer`, `security-reviewer` and `tdd-guide` sub-agents were not used, because this phase's tools exclude sub-agents. An independent verifier needs to do those reviews.
- **M2:** I checked the pinned before-source lines in the test against the `/tmp` snapshot by hand only. A copying mistake would make the test fail wrongly, not pass wrongly.
- **L1:** test 3 overlaps test 1 on purpose, so a failure names its cause.
- **L2:** the checks match text rather than parsing JavaScript, so mistakes fail closed.
- **L3:** the self-check can't prove the test never calls `fetch`, because the pinned source text contains `fetch(`; reading the file shows no call.
- **L4:** JSON output that isn't an object is now refused with the helper's fixed message. That is stricter, and intended.
- **L5:** new, not fixed: in `preview-account.mjs`, `response.json()` and `login.json()` could print a `SyntaxError` quoting part of a non-JSON local auth response. Named for MB-1/QA-9 G5 triage.
- **L6:** the pinned strings contain literal `${…}`, which a lint rule would flag if `scripts/backend` were ever linted. Today only `apps/mobile` is linted.

Still open:
- `verify-freeze-projection.mjs` diagnostics, owned by MB-1/QA-9.
- G1–G4 and G6–G7.
- MB-1 as a whole.

No Done-when box is claimed. File hashes weren't computed because I had no way to run anything.

```
GOAL: MB-1
BRANCH: codex/mb1-identity
HEAD: 2a95726 (uncommitted working-tree changes on top; no commit per phase scope)
HANDOFF: docs/evidence/MB-1/harness-status-consumers-2026-11-01.md (handoff.md not in this phase's four permitted write paths)
BOXES: 0/— Done-when boxes met (none claimed or changed; bounded G5 residual phase)
STATUS: ready-for-verification
NOTES: G5 status-consumer residual only; 2-line in-place swap per consumer; new test UNRUN (proposed: node --test scripts/backend/status-consumers.test.mjs); sub-agent reviews not run (tools excluded) so the verifier must do them; helper and test files unchanged
```
