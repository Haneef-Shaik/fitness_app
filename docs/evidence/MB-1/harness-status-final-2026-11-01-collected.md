I added a small helper that parses the captured `supabase status` JSON with fixed error messages, and switched all three suites to it. Nothing was run: the 7 new tests are written but have never executed, so none of this is verified yet. No status, box or readiness is claimed.

**Changes (source only):**
- **`scripts/backend/status-output.mjs`** (new): exports only `parseStatusOutput(output)`. It accepts a string or a Buffer and returns the parsed object only if it is a real JSON object.
  - **Bad JSON, or input that isn't a string or Buffer:** throws a plain `Error` with the same fixed text `local-stack.mjs:43` already uses ("…did not print JSON; its output is not shown because it holds keys").
  - **`null`, an array or a single value:** throws a second fixed message ("…did not print a JSON object; …").
  - **The original parse error** is dropped unread and never attached, so no input text, parse detail or key reaches the message.
  - **Its only import** is `node:buffer`. It doesn't trim or rewrite any value.
- **The three suites:** each gains one import line. In each, `JSON.parse(` becomes `parseStatusOutput(` on the status line. The command, its options, the child-process call, the loopback check, the tests and the cleanup are byte-identical.
  - **`verify.mjs`:** the import replaces the blank line 4, so every line QA-9 cites stays where it is.
  - **`verify-gym.mjs` and `verify-freezes.mjs`:** everything from line 4 down moves by one. QA-9's readiness record now cites those two files one line too early; the new numbers are in the evidence file.
- **`scripts/backend/status-output.test.mjs`** (new): written before the helper existed.
  - Valid objects as a string and as a Buffer; the Buffer is left unchanged.
  - Six near-miss `API_URL` values come back unchanged, so the helper doesn't loosen the 55321 check.
  - Ten bad-JSON inputs carry a synthetic key value. Each error's message, stack and inspected form must show no part of it, no parse wording and no cause.
  - `null`, arrays and single values are refused.
  - Inputs that are not a string or Buffer are refused.
  - A wiring check reads the three suites as text without importing them. It confirms each uses the helper, the command and loopback check are unchanged, and the old raw parse is gone.
  - A purity check on the helper.
  - The synthetic key values are built from parts, so no file spells a key-shaped string.
- **`docs/evidence/MB-1/harness-status-parse-2026-11-01.md`** (new): the record. It contains none of the §8 secret-scan patterns, so the pinned inventory is unaffected.

**Still open** (not fixed by this, as briefed):
- **A failing `supabase status` can still print keys.** If the command fails, `execFileSync` throws before the helper runs, and Node's crash report shows that error's `stdout`. This needs its own fix.
- **Other harness gaps:** target binding (G6/M1), timeouts and signals (G4), cleanup (G1–G3), the per-run namespace (G7), the `local-stack.mjs` executor and `verify-identity` in `backend:test`.
- **Readiness:** the harness is not claimed ready, and QA-9 phase 3N stays blocked.
- **Out of scope:** `verify-freeze-projection.mjs:12` still uses a raw `JSON.parse`, but on psql output, not status.

**Proposed check, for a separately authorised run** (pure; it never runs the live suites):
`rtk proxy node --check` on each of the five `.mjs` files, then `rtk proxy node --test scripts/backend/status-output.test.mjs`. Do not run `node scripts/backend/verify*.mjs` or `pnpm backend:test` as part of it.

**Self-review:**
- **Critical, High:** none.
- **Medium:** M1, nothing executed. RED was never seen, and the tests rely on Node's error layout, stack format and `inspect` output, which is unconfirmed.
- **Low:**
  - L1: the blank line in `verify.mjs` was traded for the import, to keep line numbers.
  - L2: QA-9's citations for two files are off by one.
  - L3: the wiring test pins exact source text on purpose.
  - L4: the purity check is text-based.

**Tools and paths:** Read, Grep, Edit and Write only; no permission was denied, and no sub-agents were used.
- Read only: MB-1 `checkpoint.md`, `handoff.md`, `phase1d.md` and `phase2-plan.md` §8; QA-9 `phase-3n-readiness.md` §1–2; `local-stack.mjs`; `check-sql-sources.mjs`; `package.json`; three test files.
- Written: the five script paths above plus the evidence file.
- Not changed: checkpoint, handoff, status, GOALS, ledger, `main` and other worktrees. Nothing was committed or staged.

```
GOAL: MB-1
BRANCH: codex/mb1-identity
HEAD: 2a95726 (uncommitted working tree; no commit made, by brief)
HANDOFF: docs/plan/runs/MB-1/handoff.md
BOXES: 0/— Done-when boxes met (none in scope; this source-only F4 phase claims no box)
STATUS: ready-for-verification
NOTES: Record is docs/evidence/MB-1/harness-status-parse-2026-11-01.md (handoff unchanged per brief); 7 tests UNRUN, so a separately authorized run of the pure test command is needed; the execFileSync failure-output leak and G1–G4/G6/G7 stay open; QA-9 line citations for verify-gym/verify-freezes are now off by one.
```
