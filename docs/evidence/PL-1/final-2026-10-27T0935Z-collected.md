I fixed M1 and L1 test-first, in the guard and its tests only. The `scripts/ci` tests now pass 37 of 37 on Node v22.23.1, from one final run. None of the three Done-when boxes is met, since each still needs a push, branch protection or a probe pull request, so PL-1 is not Done. Nothing is committed or staged, and no tracked file changed.

**M1 (Medium), a changed action SHA hidden behind a decoy:**
- The guard now holds each action as a full `owner/repo@sha` (checkout, setup-node and the pnpm action). All three workflows are checked against that list, using the parsed step.
- The old check, which scanned `mobile-ci.yml`'s raw text including comments and kept the last match, is deleted.
- Tests first: each of the three actions was moved to another commit behind a comment on the same line, a later comment line, or a step after `pnpm check` that keeps the old SHA. The old guard missed all 9. Each is now refused by the guard both guard jobs run, and the test checks that `backend-ci.yml` and `ci-guard.yml` are unchanged.
- One consequence: moving any of these actions to another commit, in any workflow, now needs the same change in `workflow-guard.mjs` in the same diff. That is in the handoff for QA-9.

**L1 (Low):** `mobile-ci.yml`'s `check` job must now run on `ubuntu-latest` with a timeout from 1 to 15 minutes. The old guard missed all four test edits (`macos-latest`, a custom runner label, 16 minutes and 0 minutes). A 1-minute timeout is still accepted.

**Runs:**
- **First failing run:** 37 tests, 32 pass, 5 fail. The tool cut the middle of the output, so I ran the three cut tests once more, with the guard still unchanged, and recorded them exactly: 0 of 3 pass.
- **Final run, once:** 37 of 37. One of those tests runs the guard on the real repository files, so all three real workflows match the new pins.
- **Changed tests:** six existing expectations were re-pointed to the new messages. Each is the same edit, still refused, and now names the exact pin. Four of them (the F1 regexes) were updated after the failing run and never shown failing first, and neither were two new assertions. The evidence file lists all of them.

**Corrected claims:**
- The guard comments, the test title, `review-0705-corrections.md` (a marked note plus a "Corrected later" row) and the handoff, where decision 12 is amended and 13 and 14 are added.
- Line 6 of the raw `final-2026-10-27T0905Z.md` is not edited. It gets a pointer from `review-0705-corrections.md` and the new `review-0905-corrections.md`.
- Both 0905 files and every workflow have the same hashes before and after this phase.

**Not run, by instruction:** sub-agent reviews, Prettier (layout matched by hand, not proven), a strict YAML parse (neither new workflow has been through a parser), outside mutation runs, `pnpm check`, `pnpm install`, `pnpm backend:test`, Docker, Supabase, the network and anything hosted. L2, the invisible U+2028 character, stays deferred, and the denied `perl` was not retried. No permission was denied this phase.

PL-1 reads and writes no member or health data. The rule that gym staff never read or write private health data, whatever the consent, is unchanged.

A fresh independent review is the next step. Full results are in `docs/evidence/PL-1/review-0905-corrections.md`.

```
GOAL: PL-1
BRANCH: codex/fitlog-pl1-ci
HEAD: c8a5d57 (22 PL-1 paths untracked; nothing staged or committed, by instruction)
HANDOFF: docs/plan/runs/PL-1/handoff.md
BOXES: 0/3 Done-when boxes met
STATUS: ready-for-verification
NOTES: Ready for a fresh independent review only, not goal-verifier (0/3 boxes, each needs owner-authorised hosted actions). Review 0905 M1+L1 fixed test-first: M1 9/9 and L1 4/4 failed first, final 37/37 on Node v22.23.1; action pins held as full owner/repo@sha, pinsOf removed; no CI YAML changed (hashes equal); L2 U+2028 deferred, writer not retried; Prettier/YAML parse not run.
```
