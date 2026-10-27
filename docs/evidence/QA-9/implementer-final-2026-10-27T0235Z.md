I stripped the trailing spaces, made the one commit, and ran `pnpm check` once. It passed. QA-9 is not Done: box 3 still needs the owner's approval to push.

**What I ran this session**
- **Whitespace:** I removed one trailing space from each of the 31 coverage rows: 12 in the phase-3D outputs and 19 in the phase-3E outputs. Against the staged copies, Git saw exactly 12 and 19 changed lines, and no difference once end-of-line whitespace is ignored. Each file's header now says it is the captured output with trailing spaces removed and that no output content or figure changed.
- **Commit:** I staged exactly your 11 paths. `contract.test.ts` stayed at 713 insertions and 89 deletions, and `git diff --cached --check` was clean. Then I made one commit, `3007094` (`test(QA-9): cover deterministic Git baseline histories`), on top of `4a7ee21`. It has 11 files, no hook output, and left a clean tree. There was no amend, reset, rebase or push.
- **`pnpm check`, once, on Node v22.23.1:** exit 0, 285 tests (40 + 97 + 126 + 22).
  - Format step: 19 files, labelled `from 4a7ee2100bff`. 33 files weren't JavaScript or TypeScript, matching my count beforehand.
  - Domain: lines 535/583 (91.7667%), branches **273/313** (87.2204%), functions 106/117 (90.5983%).
  - Mobile: 254/2076, 164/1551, 84/821 and 191/1023.
  - The floor is still not anchored, as expected before integration.
- **One command denied:** `git hash-object` on the two output files. I didn't retry it; the `--ignore-space-at-eol` diff is the proof instead.

**Not committed:** the results in a new `phase-3g-check-outputs.md`, plus updates to the checkpoint and handoff. Those three files are all that differs from the commit.

**What I only read:** the 285-test independent review is accepted from before. No new review covers phases 3F or 3G, which changed records and whitespace only. As you said, I ran no reviewer sub-agents and did a self-review instead. I didn't rewrite any historical report or test, and no threshold, floor, code or config changed.

**Still open:** the floor at the exact `main` commit, `pnpm backend:test`, both JS exports, the `HEAD` = `main` and CI re-measures, the §14 mutations, and the owner's specific approval for the hosted run.

**I did not run the Python launcher pasted at the end of your message.** It would start the QA2 and MB1 sessions, including the MB1 database mutation run, which are outside this phase. Running it is your call.

```
GOAL: QA-9
BRANCH: codex/qa9-quality-ratchets
HEAD: 300709473f12cdae800cd7b3fc25f295887e58ce
HANDOFF: docs/plan/runs/QA-9/handoff.md
BOXES: 2/3 Done-when boxes met
STATUS: blocked
NOTES: Phase done: 31 trailing spaces stripped, 11 paths committed as 3007094, pnpm check passed once (285 tests, 273/313, 19 format files, 33 non-JS/TS); results uncommitted; box 3 needs owner push approval.
```
