# QA-9 · Independent review of phase 2G (verbatim)

| Field | Value |
|---|---|
| What this is | The independent review of QA-9 phase 2G (the phase-2F review's three lows fixed), and with it the first independent run of phases 2F and 2G, copied verbatim below the line. Nothing in it is edited, reordered or summarised |
| Review session | `908f412f-5536-4da2-84f7-743b8d1ec933`. Codex's phase-3 brief names it by the source file `/tmp/fitlog-908f412f-final.md` and says that session has stopped. The transcript `~/.claude/projects/-Users-Adya--codex-worktrees-fitlog-qa9-fitness-app/908f412f-5536-4da2-84f7-743b8d1ec933.jsonl` records `"agentName":"FitLog QA9 independent phase2G review"`, `"permissionMode":"dontAsk"`, Claude Code `2.1.310` and branch `codex/qa9-quality-ratchets`, and holds this review's first sentence |
| Source file | `/tmp/fitlog-908f412f-final.md`, read on 27 October 2026 |
| Reviewed state | Branch `codex/qa9-quality-ratchets`, uncommitted working tree on top of `main` at `2a95726`, as phase 2G left it (before phase 3) |
| **Attribution: executed, independently** | Unlike the phase-2E and phase-2F reviews, this one **ran commands**: `node --version` (`v22.23.1`), the 79 quality tests, the full `pnpm check` (264 tests, exit 0), `git status --short` and `git diff --stat`, each through `rtk proxy`. One Bash call was denied and not retried, as its own text says. It is the first independent execution of phases 2F and 2G |
| Findings | No correctness defect. One low, records only: R17's owner named as S7 Quality under QA-9 in four places, where Codex had assigned the remainder to PL-1 for CI wiring only, and an incomplete sentence about relative imports leaving `src/`. Three optional, non-blocking protections |
| What it accepts | Phase 2G, and with it 2F, is ready for the separate Prettier phase. It says itself that it is not a goal Done, not a hosted-CI claim and not Codex's acceptance |
| Codex's acceptance | Codex's phase-3 brief of 27 October 2026 (AUTH-01) **accepts this review** and assigns the one separate Prettier phase. The brief's words are "accepts independent phase2G review". They are recorded as that, not as a separate statement that phase 2F or 2G is accepted. None of this is the owner's signature, the goal's acceptance or a box's |
| Persisted by | The phase-3 session (`287f647f-b235-44cd-9804-676b8e566c57`, a new local Claude session working for Codex under AUTH-01). How the finding and the optional items were handled is in [ratchet-enforcement.md §10](ratchet-enforcement.md#10-phase-3-prettier-on-touched-files-and-the-phase-2g-review) and the [checkpoint](../../plan/runs/QA-9/checkpoint.md) |

---

I found no correctness defect in phase 2G. All three phase-2F lows are fixed, tested and wired into the gate. The only actionable item is a low documentation fix to R17's owner. This is also the first independent run of phases 2F and 2G, and it reproduces the writer's numbers exactly.

## What I ran (Node 22.23.1)
One Bash call was denied in dontAsk mode and not retried: `rtk proxy git -C <worktree> status --short`. These single `rtk proxy` commands were allowed:

| Command | Result |
|---|---|
| `node --version` | `v22.23.1`, the `.node-version` pin |
| `node --test scripts/quality/*.test.mjs` | 79 tests, 79 pass, 0 fail |
| `pnpm check` | No error reported, so it exited 0. Domain 37, quality 79, mobile 126, plan 22: **264 tests**. Domain lines 537/583, branches 272/313, functions 106/117, all 8 files counted. Mobile 12.23 / 10.57 / 10.23 / 18.67. Lint passes, with `Design rules verified` |
| `git status --short` | The same nine paths |
| `git diff --stat` | Only the four phase-2/2B files at 8, 3, 2 and 2 lines, plus docs/23 |

I made no edits, wrote no scratch files and started no sub-agents.

## Findings, most severe first

**Correctness: none.** No critical, high, medium or low code defect in the 2G change.

**1. Low (records only): R17's owner doesn't match Codex's assignment**
- **Location:** `docs/plan/runs/QA-9/checkpoint.md:448` (R17 row), `:457` (decision 3), `:506`; `docs/evidence/QA-9/ratchet-enforcement.md:387`.
- **The defect:** all four name "S7 Quality, under QA-9" as the owner of R17's remainder (JavaScript outside `src/`). Your brief says Codex assigned it to PL-1, for CI wiring only.
- **Failure scenario:** when QA-9 closes, the record still shows QA-9 owning open R17 work, while PL-1's card never receives it.
- **Also in that row:** the sentence saying the only relative imports leaving `src/` are "two domain tests that read JSON files by URL" is slightly off. `packages/domain/src/contract.test.ts:86-87` also runs `import()` on `../${entry}`, taken from `package.json`'s `exports`. Today that resolves back to `./src/index.ts`.
- **Fix:** when recording the acceptance, change the owner in those four places to PL-1 (CI wiring only), and correct the sentence. No code change.

**Optional extra protection (not correctness, none blocking):**
- **Reused mutation labels.** Phase 2B already used G1–G7 (`ratchet-enforcement.md:398-399, 436-440`), and phase 2G uses G1–G12 again in §9 and the checkpoint. A reader following "G1 is killed" could land on 2B's gate-wiring mutation. Prefixing them (for example `2G-G1`) would remove the ambiguity.
- **Success message.** The guard's pass message (`coverage-ratchet.mjs:369`) still mentions only the three comments. It doesn't mention the declaration, UTF-16 or JavaScript refusals. This is message text only.
- **R17 route via `exports`.** `packages/domain/package.json`'s `exports` isn't pinned, and mobile resolves `@fitlog/domain` through it. This falls inside the accepted R17 remainder (and R6). I think strict `tsc` would likely reject an untyped JavaScript entry, but I didn't verify that.

## The three lows: verified
1. **Line breaks in declaration names.** `isDeclarationName` (`type-suppression.mjs:55-58`) matches TypeScript 6.0.3's own rules (checked at `typescript.js:40466-40480`) and has no `.` wildcard.
   - The scan checks the whole name and ignores case, so it can only add names.
   - The one name TypeScript reads differently is a POSIX name containing a backslash. TypeScript can't open such a file, because it turns `\` into `/`.
   - Test 8 checks 8 line-break declarations and 12 near misses against the installed TypeScript. It also shows both packages' real `include` picking the files up.
   - Ratchet test 31 checks the U+2028 case through the whole guard.
2. **UTF-16 byte-order marks, refused by the real reader.**
   - The guard calls `typeSuppressionProblems(root)` with no reader passed (`coverage-ratchet.mjs:352`), so it uses the default byte reader.
   - Which mark means which encoding matches TypeScript's `sys.readFile` (`typescript.js:8533-8556`). A UTF-8 byte-order mark is harmless, because the scan searches the whole text.
   - Test 9 uses no injected reader. A reader that returns text fails closed (test 6), as Codex's byte-reader choice requires.
3. **JavaScript in source.** `.js`, `.jsx`, `.mjs` and `.cjs` are refused in any letter case under both `src/` folders, the domain included as Codex chose.
   - The check runs after the link check, so a link still fails closed.
   - Test 10 shows the premise with the real mobile tsconfig: a type error is reported in the `.ts` file and not in the same `.js` file.
   - A Glob finds no JavaScript in either `src/` today. The design-rules script lints in memory and never writes into `src/`.

**Gate wiring.**
- `type-suppression.test.mjs` is in `QUALITY_FILES`, and gate-wiring test 8 fails on any unlisted test file.
- All three copies of the guard run the scan: root `check`, mobile `test:ci` and domain `test`.
- CI runs `pnpm check` on ubuntu with `.node-version`.
- The files' modification times put the three files the writer says changed in 2G last, which fits that claim.

**Docs.** docs/23 §9 rule 3 matches the code. It makes no claim to protect against a hostile repository ("What the guard cannot stop" defers to PL-1).

## Prettier readiness
Phase 2G, and with it 2F, is **ready for the separate Prettier phase**. Finding 1 is a records fix that can go with the acceptance or the commit. For Prettier, leave `apps/mobile/eslint.config.js` alone, since it is pinned as text.

This is not a goal Done and not a hosted-CI claim. Box 3's hosted run is still unmet, the floor isn't anchored until it is integrated into `main`, and nothing is committed. This review isn't Codex's acceptance either.

**What I relied on the test runs for:** I read the 2G code and tests in full, plus the guard's assembly, the wiring pins, the tsconfigs, the package scripts, the CI lines, the checkpoint and the evidence. I didn't re-read `lint-scope.mjs`, `transform-config.mjs`, `coverage-suppression.mjs`, the reporter or their tests line by line. They were unchanged in 2G, and the green runs above cover them. Review finished; stopping here.
