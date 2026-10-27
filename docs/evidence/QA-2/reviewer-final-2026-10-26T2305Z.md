**Verdict: QA-2 is not ready to verify, and nothing here is Done.** Box 1 stays open until the protected `.claude` changes are applied. Box 2 is met only in uncommitted files. Box 3 has no command proof. The docs work holds up against the code, the PRD and 003. The patch's wording is correct, it checks clean against the current files, and it states the privacy rule correctly. But it is not applied, so R1 is still live.

I reviewed the brief's invariants (I6, I7, I8 and `alembic`) against the PRD and 003 instead, because those tags are stale. That brief is one of the files the patch corrects.

## Commands run

| Command | Result |
|---|---|
| `rtk proxy git apply --check --verbose docs/evidence/QA-2/claude-corrections-UNAPPLIED.patch` | **Passed.** It printed "Checking patch …" for all 7 files and reported no error. This was a check only; nothing was applied. |
| `git rev-parse --abbrev-ref HEAD` | `codex/fitlog-qa2-docs` |
| `git status --short`, `git log --oneline -3 main`, `git diff --stat` | **Denied** ("don't ask" mode). Not retried and not wrapped. |

No tests, `pnpm`, `node`, database, Supabase, Docker, Figma or sub-agent ran. Everything else below comes from reading files, plus the git metadata files under `.git/`.

## Open findings, most severe first

**1 · High · `.claude/agents/security-reviewer.md:21` (also :18–20, :24, :30, :35, :37–38). This is R1.**
- **Defect:** the agent still says "gym staff see member content only with the member's consent". PRD §16.1 (lines 1050–1053), 003 §6 (lines 1030 and 1032) and docs/23 :244 all say staff never read or write private health data, whatever the request carries.
- **Why it is still dangerous:** the interim override exists only in QA-2's own files (handoff :87–91, stale-paths :149). The places that actually launch the agent don't mention it: `run-goal/SKILL.md:126` and `docs/plan/SESSION-PROMPT.md:27`.
- **Failure scenario:** an MB-1 session follows run-goal §7 on a diff that adds a staff read behind a consent flag. The reviewer follows line 21 and passes it.
- **Fix:** apply the patch; its check passed today. Until then, put the override in every security-reviewer launch.

**2 · Medium · Box 3 (`scripts/plan/status.mjs:24-37, :102-123`)**
- **Defect:** no command in docs/23 §7 or the skills has run on `main`.
- **The `next --slots` command can't run.** `parseArgs` is strict, has no `slots` option, and there is no `next` command, so it exits 1 with `plan status: Unknown option '--slots'…`. I confirmed this from the code.
- **The patch doesn't fully resolve it.** After it, run-plan says the command fails, which only meets "runs as written" if the verifier accepts "exits 1, so advisory mode" as the written behaviour.
- **Small leftover:** `run-plan/SKILL.md:134` ("`next` returns nothing more") is not patched. It only matters in live mode, which can't happen today.
- **Fix:** follow stale-paths §6.3 and record each result line. The verifier should rule explicitly on how to read box 3.

**3 · Low · `.claude/skills/run-goal/SKILL.md:195-196`. Part of R9.**
- **Defect:** the by-hand close-out still appends the handoff to the tracker with no link re-basing step. The patch adds that rule only to integrate-goal step 5.
- **Failure scenario:** the next hand-integrated goal appends links written for the run folder, such as `../../../evidence/<ID>/…`. These break from `docs/`, which is the T11 defect again. Codex lanes, AR-1 included, integrate this way.
- **Fix:** add one line to the patch: "re-base links as in integrate-goal step 5".

**4 · Low · patch hunks for `tdd-guide.md:38` and `verify-goal/SKILL.md:68`**
- **Defect:** the new text says "today there are none to lower". QA-9 is claimed and active (main `status.json:76-83`), and its box 1 adds thresholds to `jest.config.cjs`.
- **Failure scenario:** QA-9 integrates before this patch is applied. The new text is then false on arrival, and a reviewer may skip the threshold check.
- **Fix:** reword to "until QA-9 adds them", or check the order when applying.

**5 · Low · evidence accuracy**
- `stale-paths.md:187` and `implementer-final…:9` say "14 hunks". The patch has **13** (2+2+2+3+1+1+2).
- Patch line 8 labels R1 as "C1–C6". R1 is C4 only.
- handoff :42 and stale-paths :196 say the patch check was "Not run". It has now passed (this review).
- `docs/evidence/QA-2/implementer-final-2026-10-26T2235Z.md` was added by Codex during this review. The handoff's file list doesn't include it.

## Closed findings (from reading the sources)

| Finding | How it was checked |
|---|---|
| **R2** branch record | Worktree `HEAD` reads `ref: refs/heads/codex/fitlog-qa2-docs`. The branch ref is `5fefc31`, `main` is `c8a5d57`, and the reflog shows the 50 s gap. The handoff (:1, :12, :119) and checkpoint (:6) match, and the rename step is gone. |
| **R3** ORCHESTRATOR | The note at :11–16 cites the right sections (§5 :210, §6 :287–288, §7 :315, §11 :409). Row :287 now says migrations are append-only. Root README :47–52 is fixed. |
| **R4** 003 status labels only | Changes are limited to the title, the notes on :5/:6/:8, re-spacing at :14–18 and :62 (link targets unchanged), the :20 retitle and the new :1275 row. Every section heading sits on the same line number as in the main checkout's copy, and §6 (:1022–1041) is identical. I could not diff the whole body because git diff was denied. |
| **R6** | PROGRESS:19 now matches 003 :1138–1142. |
| **R7** | Re-spacing confirmed at tracker :116, :520–532 and :556–557, and 003 :14–18 and :62. |
| **R8** | handoff :25 links `../../ACCEPTANCE.md`, which resolves correctly. |
| **R10 (docs part)** | docs/23 :143–149. Its quote matches `integration-gates.md:6-8`. |
| **R14 (records part)** | checkpoint :14–20. |
| **R15** | Deliberately kept open: docs/22 :82–84 says the name was never checked against Figma, so T-7 stays open. No Figma claim is made. |

**Open in the patch only (wording verified, not applied):** C1–C3, C4 (R1), C5–C8, C9 (R9 skill), C10 and C12 (R5), C13 (R11), C14 (R10 skill), C15 (R12), C16 (R14 skill), and C2/C6 (R13).

## What I verified in the patch

- **Privacy rule.** The patch deletes the consent line and lists exactly the data 003 §6 protects (:1032). It says no consent, sharing or assignment flag opens staff access and a programme offer is not consent (PRD §16.1), and that staff never receive URLs for personal health assets (PRD §22.1 :1481–1482). It requires AC09 tests and treats a consent-gated staff read as a critical finding.
- **Other sources.** 003 §4.3 (:537–539, 404 for a foreign or revoked scope), §4.5 (:645–648), §4.6 and §4.14 all exist and match. So do PRD §4.1, §4.2 (gym timezone, canonical units), §10.3 (:541, retries included), §14.2, §15.1 and §21.2. The test files tdd-guide names exist, and `jest.config.cjs` has no `coverageThreshold`.
- **Link re-basing examples** in integrate-goal resolve correctly from `docs/plan/runs/<ID>/`.

## Stale-path searches and docs checks

- **My re-runs match stale-paths §7.** S1, S5/S6, S8, plus S3, S9 and S10 on the tracker (no `../` links left; only `#decision-log` anchors).
- **`.claude/` today:** S1 finds nothing. S5/S6 hit exactly the lines the patch changes, plus `verify-goal:40` ("Expo Go"), which is accurate. None of the patch's added lines contains a search token, so after applying only `verify-goal:40` should remain. That is reasoning; I did not apply the patch.
- **Privacy wording:** across the named scope, the only consent-gated staff wording left is `security-reviewer.md:21`.
- **docs/23 §7 paragraph** matches the code: `package.json:18` (8 steps); the 55321 checks in verify, verify-gym, verify-freezes and local-stack.mjs :40–43; no check in `verify-freeze-projection.mjs:12`; `check-sql-sources.mjs:136-155` and `snapshot-contract.ts:129-148`.
- **Tracker ownership:** :10–11 state it explicitly, with prose at :19–21.

## Done-when boxes

| Box | Verdict |
|---|---|
| 1 · Search recorded, every hit fixed or labelled | **Open.** The named docs and the extension are clean by my re-run. The 12 `.claude` hit lines stay until the patch is applied. |
| 2 · Tracker states who owns status and results | **Met in the working tree only.** It is uncommitted, so it is invisible to `git diff main...codex/fitlog-qa2-docs`. |
| 3 · Every command runs on `main` as written | **Open.** Checked against the code only; no command proof. |

## Next bounded phase (coordinator-supervised)

1. Optionally fix findings 3 and 4 and the run-plan:134 line in the patch. Re-run `git apply --check`, then apply it.
2. Re-run S1 and S5/S6 over `.claude/`; expect only `verify-goal:40`. Update stale-paths §3.5, §4 (13 hunks), §7 and §8, the handoff's gates row and the checkpoint.
3. Commit on `codex/fitlog-qa2-docs`. Don't rename the branch and don't push. Then rebase onto `main` (`c8a5d57` or later).
4. Box 3, per stale-paths §6.3:
   - read-only planner commands in the main checkout;
   - install, check and export in the worktree;
   - `backend:test` only after `supabase status` confirms 55321, and serialized with MB-1;
   - mutating commands only in a disposable `/tmp` clone with a local bare `origin`.
5. Run code-reviewer, the patched security-reviewer and tdd-guide on the diff, then hand to a fresh verifier. T-7 stays open unless a Figma read is authorised.

**Limitations.** I compared files against the main checkout's copies, which are `c8a5d57` plus possible uncommitted coordinator edits. For the tracker, docs/22, INBOX, 001, 002 and RESET-BASELINE I checked the changed regions, not every line. I did not open `/tmp/fitlog-mb1-replay-20261026`. I made no edits.
