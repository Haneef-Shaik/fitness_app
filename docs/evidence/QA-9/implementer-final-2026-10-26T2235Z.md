# Collected bounded implementation final

Collected by Codex 2026-10-26T22:32:38.450234+00:00 from local Claude session `1e2bed82-07fa-43fe-9eae-9aba2995f855`.
This is the implementer report, not an independent verdict. Worker stopped before fresh review.

Phase 3B is finished and recorded, but QA-9 is not done: box 3 and the floor anchoring still need your authorisation. Nothing is committed. `pnpm check` passes on Node 22.23.1 (exit 0, 281 tests), and the quality tests pass 96 of 96.

**Medium finding (the format rule could silently switch off in CI):**
- **Reproduced first.** A new test copies the check under a new name, as a rename would. Before the fix it showed exactly the review's symptom: 0 files checked, "not committed yet", exit 0.
- **The fix.** `RULE` is now derived from the check's own path, so a rename or move carries the rule with it. A test asserts it equals that path and the one root `check` runs.
- **If no commit adding the check can be found,** CI now fails instead of checking nothing. Locally it fails too once `HEAD` holds the check. The local fall-back to "only uncommitted edits" stays for one state only: before the check is committed, which is the repository today.
- **Tests:** 4 new format tests, plus 6 mutations, each caught by a named test.

**`prettierPath: null` (your choice for finding 2):**
- Added to `apps/mobile/jest.config.cjs` (2 lines) and pinned in the guard. Any other value fails, and so does leaving it out.
- A new test runs the installed Jest's inline-snapshot writer directly. With Jest's default it throws the Prettier-3 refusal the review described; with `null` it writes the snapshot.
- Ratchet test 9 gains 3 cases, and 3 more mutations are each caught.

**Findings 3 and 4:**
- Finding 3 is recorded as R18(h): rebase QA-9 onto `main`, don't merge `main` in. I added R18(i) for a rename that's still uncommitted locally; CI never sees that state.
- The hex-colour probe is struck from the box-3 plan. A Grep confirmed the review's 33 files and 460 long lines. The stale "only root `package.json` change" sentence is corrected.

**What I didn't do, and why:**
- No independent run of phase 3 or 3B exists yet; the phase-3 review was source-only. A review that can run commands should come next.
- Before relying on the next `pnpm check`, commit first: until the check is committed, it selects only `jest.config.cjs`, as today.
- I ran no sub-agents (a written self-review replaced them), no commits, network or database. I didn't run the launch script.
- My first command was a compound `git status && git log && ls` and was denied. I recorded it and didn't retry or work around it.
- One early test run was piped through `tail` and was allowed. Every later command ran bare.
- I couldn't re-check the review's "20 commits past `2a95726`", since `git log` isn't on the allowlist.

I moved the new tests to the end of their files so the test numbers earlier records cite stay valid. No threshold, floor, dependency or lockfile changed. Full details are in `docs/plan/runs/QA-9/checkpoint.md` and `docs/evidence/QA-9/ratchet-enforcement.md` §11.

```
GOAL: QA-9
BRANCH: codex/qa9-quality-ratchets
HEAD: 2a95726912c6 (base; nothing committed by instruction)
HANDOFF: docs/plan/runs/QA-9/handoff.md
BOXES: 2/3 Done-when boxes met
STATUS: blocked
NOTES: Phase 3B complete (pnpm check exit 0, 281 tests); boxes 1–2 met locally and uncommitted; box 3 hosted CI and floor anchoring wait on Codex commit/push/integration authorisation and an executing review; rebase, don't merge.
```
