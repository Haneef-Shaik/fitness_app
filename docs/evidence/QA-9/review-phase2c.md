# QA-9 · Independent review of phase 2C (verbatim)

| Field | Value |
|---|---|
| What this is | The independent read-only review of QA-9 phase 2C (the phase-2B review remediation), copied verbatim below the line. Nothing in it is edited, reordered or summarised |
| Review session | `08c6473e-33b4-46e0-b12f-fee9863f850d`. That is the transcript `~/.claude/projects/-Users-Adya--codex-worktrees-fitlog-qa9-fitness-app/08c6473e-33b4-46e0-b12f-fee9863f850d.jsonl`. It records `"agentName":"FitLog QA9 independent phase2C review"`, `"permissionMode":"dontAsk"`, Claude Code `2.1.310` and branch `codex/qa9-quality-ratchets`, and its text includes this review's title line. The brief is `/tmp/fitlog-qa9-review2c-launch.json` (agent `code-reviewer`). It asked for the quality suite and `pnpm check` to be run, but every Bash call in that session was denied, as the review says |
| Source file | `/tmp/fitlog-08c6473e-final.md`, read on 26 October 2026 |
| Reviewed state | Branch `codex/qa9-quality-ratchets`, uncommitted working tree on top of `main` at `2a95726`, as phase 2C left it |
| What it accepts | Phase 2C's code, by reading only. It ran no commands. It is not a verdict on the goal, not the owner's signature, and not Codex's acceptance, which is recorded separately in the [checkpoint](../../plan/runs/QA-9/checkpoint.md) |
| Persisted by | The phase-2D session, working for Codex under AUTH-01. How each finding was handled is in [ratchet-enforcement.md §6](ratchet-enforcement.md#6-phase-2d-phase-2c-review-findings-r8-and-r11) and the [checkpoint](../../plan/runs/QA-9/checkpoint.md) |

---

# QA-9 phase 2C review: accept, with four low findings

**Verdict: accept phase 2C.** I found no critical, high or medium defects. Both phase-2B findings are fixed: a non-object input file now fails the guard, and source comments that switch off coverage are scanned for. The phase-2B fixes and wiring are intact. There are four low findings. Two are one-line fixes that can go in before the commit; the other two can join the next bounded phase.

This is not a verdict on the whole goal. The hosted CI run, Prettier, R8 (lint scope) and R11 (transform-time config) are still open.

**I could not run anything.** This session was in don't-ask mode and every Bash call was denied, so I ran neither the quality suite nor `pnpm check`. I did not run `git diff` either, so I read the files in full instead. Every claim about test results comes from your 47/47 run on Node 26.7.0 or from the implementer's records on Node 22.23.1; I reproduced neither. On Node 26, reporter test 5 skips its "Node did not fail it" assertion, so a `pnpm check` on the pinned Node 22.23.1 is still owed before commit. I also did not run the Python launcher at the end of your message, since you ruled out launchers and subagents.

## Findings (most severe first)

**1. Low: the source scan's folders are fixed, but the guard lets the coverage scope grow beyond them**
- **Location:** `scripts/quality/coverage-suppression.mjs:9` (`SUPPRESSION_ROOTS`), with `coverage-ratchet.mjs:222-236` and `coverage-ratchet.test.mjs:174`, where test 8 confirms that widening passes.
- **Defect:** the scan only reads `apps/mobile/src` and `packages/domain/src`. The guard accepts new include patterns outside `src/`, and once `main` records them they can never be removed.
- **Failure scenario:**
  1. A reviewed change adds `"scripts/**/*.ts"` to `collectCoverageFrom` and is merged into `main`.
  2. A later change adds `/* istanbul ignore file */` to `apps/mobile/scripts/generate-palette.ts`.
  3. The include pattern is still there, so the scope check passes. The scan never reads `apps/mobile/scripts`. That file leaves Jest's count and the guard passes.
- **Why it is only low:** today every counted file is under `src/`, and the domain include is fixed by its template. So this needs a future widening first; nothing can be bypassed today.
- **Fix:** take the scan folders from the thresholds file's include patterns (the fixed part before the first wildcard), or refuse include patterns outside `src/` until the scan follows them. Add a fixture test for "widened, anchored, then suppressed".

**2. Low: one unreadable-file path still depends on the order of the checks**
- **Location:** `scripts/quality/coverage-ratchet.mjs:280`.
- **Defect:** `read(MOBILE_PACKAGE)` sits inside a bare `try/catch`, so a read error there is swallowed and the file is treated as `{}`. That skips the `jest`-key check.
- **Why it causes no harm today:** `wiringProblems(read)` runs first (line 321) and throws on the same unreadable file before line 322 runs.
- **Failure scenario:** someone reorders the problem list, or moves the mobile `package.json` out of `PINNED_SCRIPTS`. An unreadable mobile `package.json` would then silently skip the `jest`-key check, which breaks 2C's rule that an unreadable file never passes for a missing one.
- **Fix:** move `read(...)` outside the `try` and wrap only `JSON.parse`.

**3. Low (evidence): the ratchet-enforcement header says all three phases were "approved by Codex"**
- **Location:** `docs/evidence/QA-9/ratchet-enforcement.md:5`, against `docs/plan/runs/QA-9/checkpoint.md:5` and `:195-196`.
- **Defect:** the header says all three phases were approved. The checkpoint says 2C awaits review, and lists "Accept phase 2B" under "Phase 2B (still open)".
- **Failure scenario:** a verifier or integrator reads the evidence header as acceptance that was never recorded.
- **Fix:** write "authorised by" instead, or record the actual acceptances once they are given.

**4. Low (evidence and follow-up): R11 describes the transform-time risk too narrowly**
- **Location:** `ratchet-enforcement.md:269`, `checkpoint.md:161` and `:182`.
- **Defect:** R11 talks about pinning `apps/mobile/babel.config.js`, but that file does not exist. Babel would also use a new `babel.config.*` file, any `.babelrc*` file in the mobile package (including one under `src/`), or a `babel` key in `apps/mobile/package.json`.
- **Note:** this last point is Babel's documented config lookup. I could not read `node_modules` to confirm how jest-expo calls Babel.
- **Fix (next phase):** have the guard refuse any of these files or that key, not pin one file. Do the same when R8 is handled for ESLint.

## Trust boundary versus a real bypass

These are outside the guard's promise. Each already has an owner or is recorded (R5, R6, R9):
- A `jest.config.cjs` that behaves differently under Jest than under the guard (environment checks, getters, a Proxy).
- A test that writes an ignore comment into source before Jest collects coverage.
- A change that edits `SUPPRESSION_ROOTS` or the comment patterns together with their tests.

One gap is not recorded anywhere. Production code placed under `__tests__/`, or a domain module named `*.test.ts` inside a subfolder of `src/`, falls outside the coverage scope by its name alone. This is a visible rename, not a config change. I suggest noting it with R9 or QA-10. It does not block 2C.

## What I checked and found sound

- **Non-object inputs:**
  - `minimumsIn` keeps "missing" separate from "parsed to `null`". In the working tree, the floor, thresholds file and domain `package.json` must be a JSON object. At a baseline, a file that is absent still means "predates the ratchet", and anything present must be an object.
  - A symlink stored in Git shows up as non-JSON text, so it also fails closed.
  - `jestProblems` always runs now. With no readable thresholds object, `appliedProblems` reports "cannot be checked", so the tolerant `?? fallback` and `try/catch` configs from the 2B review both fail. Test 21 loads the narrowed config the way Jest would before showing the guard refuses it.
- **Unreadable inputs:**
  - Only `ENOENT` and `ENOTDIR` count as missing; any other read error stops the guard and names the file. The workflow, tsconfigs and quality files get the same treatment through the shared reader.
  - A Jest config that cannot be loaded is reported, and so is a scan entry that cannot be read.
- **Source scan:**
  - Its patterns cover what Istanbul honours (`istanbul ignore`) and what Node honours (`node:coverage …`), plus c8 and V8.
  - Letter case, spacing and comments split across lines are all caught.
  - Symlinks, sockets, a missing folder and unlistable folders fail closed.
  - The scan never throws.
  - The "141 files" claim matches what is on disk: 128 mobile files plus 13 domain files.
- **Phase-2B wiring:** gate-wiring changed by one `QUALITY_FILES` line. The pinned scripts, workflow lines, Jest allowlist and anchoring logic are unchanged and still match the repository files.
- **Tests:**
  - The ratchet file has 25 tests and the suppression file has 6; with the 8 gate-wiring and 8 reporter tests that makes 47.
  - The C1–C7 failure counts in the evidence match which tests assert each behaviour, given that test 25 was added after C1–C6.
  - None of the new tests can pass without the behaviour they check: each starts from a clean pass and edits fail on a no-op.
- **Evidence:** `review-phase2b.md` matches `/tmp/fitlog-74c7436b-final.md` word for word, apart from the provenance header. The docs/23 §9 rule 3 wording limits the scan's promise to the two scanned folders.

## Follow-ups (named, not claimed as done)

- **Next bounded phase:** Prettier, R8 and R11, with the wider Babel config set from finding 4.
- **Consider for R9 or QA-10:** findings 1 and 2, and the naming gap above.
- **Before commit:** a `pnpm check` on Node 22.23.1 by you or the integrator.
- **At integration:** the floor comparison at the exact merge commit.
- **Still open:** the hosted CI negative run (box 3), which needs push authorisation.

I made no edits, commits, status changes, network calls or subagent launches.
