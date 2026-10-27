No command ran in this session: Bash was refused in "don't ask" mode, including `git` and `rtk proxy`. I worked only with Read, Grep and Glob, checked branch state from the worktree's git metadata files, and edited nothing. Where the reviewer brief's invariants (I6/I7/I8, `alembic`) are stale, I applied the PRD and 003 instead.

**Verdict: QA-2 is not ready to verify.** Box 1 is not met, box 2 is met only in uncommitted files, and box 3 is unproved. The docs edits I checked are accurate against the code, 003 and the PRD. The live blockers are the unapplied `.claude` corrections, the false branch record, and stale text outside the named files.

## Branch status

- **The worker's "detached HEAD, no branch" claim is false.** The worktree's HEAD file reads `ref: refs/heads/codex/fitlog-qa2-docs`.
- **What happened:** the reflog shows the worktree created detached at `5fefc31` (18:59:53Z). Fifty seconds later the coordinator created `codex/fitlog-qa2-docs` from it and checked it out (19:00:43Z). The branch still points at `5fefc31`.
- **Main has moved on.** It is at `c8a5d57` ("reconcile three active local Claude lanes", 19:03:10Z), so the branch is one commit behind.
- **Main already records this branch.** On main, `status.json:84-91` shows QA-2 `claimed` with ref `codex/fitlog-qa2-docs`, as do `EXECUTION.md:115` and `local-supervision.json:53`. The supervision note (line 9) independently calls the detached claim stale.

## Findings, most severe first

**R1 · High · `.claude/agents/security-reviewer.md:21` (and :18-19, :24, :30, :35, :37-38)**
- **Defect:** it tells reviewers that gym staff may see member content "with the member's consent". PRD §16.1, docs/23 §9 rule 6 and 003 §6 all say staff never read or write private health data, whatever flag a request carries.
- **Failure scenario:** a backend diff (for example G16.api) lets a manager read a member's sessions behind a consent flag. A reviewer following line 21 passes it, and the AC09 tests that would catch it don't exist yet. MB-1's security review is in flight with this agent.
- **Fix:** apply stale-paths §4.2, and add three clauses:
  - a programme offer is not fitness-data consent (PRD §16.1);
  - staff never receive URLs for personal health assets (PRD §22.1, 003 §6);
  - AC09 tests are required (003 §6).

  Until then, every security-reviewer launch should state that PRD §16.1 and 003 override lines 18-24.

**R2 · Medium · `handoff.md:1, :11, :93-95, :101-102`; `checkpoint.md:6, :32`; `stale-paths.md:7`**
- **Defect:** they record "detached HEAD, no branch created", and resume step 2 says to run `git branch -m plan/qa-2-docs-reconciled`.
- **Failure scenario:** following step 2 renames the coordinator's branch. `status.json`, `EXECUTION.md` and `local-supervision.json` would then name a branch that no longer exists, and the verifier's `git diff main...codex/fitlog-qa2-docs` would fail.
- **Fix:** describe the real branch (exact text under Next phase), delete the rename step, and commit on `codex/fitlog-qa2-docs`.

**R3 · Medium · `docs/plan/ORCHESTRATOR.md:203, :280, :308-309, :402`**
- **Defect:** :203 (`config.py`) and :309 (`Maestro`) match the card's own search and are neither fixed nor labelled. :280 states as "a standing rule" that migrations are reversible with `alembic downgrade`, which contradicts append-only migrations (docs/23 §5, 003 §7).
- **Why it blocks box 1:** the box says *every* hit is fixed or labelled, not only hits in the named files.
- **Failure scenario:** `run-plan:8` sends the orchestrator to this file as "the design". A rollback of a merged backend goal would then look for a down-migration, or edit a migration that is already on `main`.
- **Fix:** amend QA-2's scope and apply the text under Next phase.

**R4 · Medium · `docs/architecture/003-architecture-freeze.md:1, :5, :6, :8, :20-36, :1274`**
- **Defect:** most of 003's status text says AR-1 is not Done:
  - the title still says "(proposal)";
  - the status row (:5) and revision history (:1274) say "AR-1 is not Done";
  - :6 says "Phase 2A is in progress … not complete" and :8 says "not merged";
  - the "Current state … (read this first)" section says "Not Done".

  Only :12-18 says Done, and its words are run together ("onlocalmain73e3f63", "isDone").
- **Why it matters now:** QA-2 points readers at 003 from six places (docs/README:11, docs/23:7, tracker:8 and :36, 001:8-9, 002:8).
- **Failure scenario:** a session that "reads this first" concludes SP0 is unmet and blocks MB-1.
- **Gap in the handoff:** it reported :5, :20-36 and :1274, but missed :1, :6 and :8.

**R5 · Medium · `run-plan/SKILL.md:13-14, :53-66`; integrate-goal and run-goal mutating commands**
- **Defect:** `status.mjs next --slots` cannot run: `parseArgs` is strict and has no `slots` option (`status.mjs:24-37`), so it exits 1.
  - Stale-paths §4.5 fixes only :13-14. Lines :53-66 still say the command "applies every start rule in code" and that its answer is final.
  - The git-mutating, status-changing and publishing skill commands have no safe way to be proven.
- **Failure scenario:** someone "proves" box 3 by running `status.mjs set … done`, `git branch -m` or `git push origin main` on the main checkout.
- **Fix:** a Codex decision on how to prove them; see the supervised phase below.

**R6 · Low · `docs/implementation/PROGRESS.md:19`**
- **Defect:** the `[AR-1]` line is ticked, but 003 §8 leaves write-time assertion of four of the eight persisted schemas to MB-2, MB-3, MB-5 and MB-6. The bracket under-lists the line's owners, so the tick overstates completeness.
- **Fix:** untick it and list `[AR-1, MB-2, MB-3, MB-5, MB-6]`, citing 003 §8.

**R7 · Low · `docs/09-PROJECT-TRACKER.md:113`, :515-518, :525-526, :550-553; 003:14-18, :62**
- **Defect:** run-together coordinator text remains here. QA-2 fixed the same defect in INBOX, and its own Traps section notes that it breaks searches for "local main" and "AR-1 is Done".
- **Fix:** re-space only, as was done in INBOX.

**R8 · Low · `docs/plan/runs/QA-2/handoff.md:22`**
- **Defect:** `[ACCEPTANCE.md](ACCEPTANCE.md)` is broken from the run folder, and will also be broken once appended to the tracker.
- **Fix:** use `../../ACCEPTANCE.md` in the run folder, and re-base it to `plan/ACCEPTANCE.md` at integration.

**R9 · Low · stale-paths §4.4 (integrate-goal) and `tracker:100-101`**
- **Defect:** the proposed re-basing rule lists only three link forms. It misses `../../../architecture/…`, `../../../09-PROJECT-TRACKER.md#…`, `../../GOALS.md` and `../<ID>/…`, all of which the AR-1 handoff used. It also misses colliding in-page anchors.
- **Related:** the tracker note at :100-101 says only links changed, but anchors were reworded too.
- **Fix:** a general rule: "resolve each relative link against `docs/plan/runs/<ID>/` and rewrite it relative to `docs/`; turn same-page links to another handoff's headings into words."

**R10 · Low · `docs/23:138-140`, `run-goal:41-43`, `goal-integrator:25-26`**
- **Defect:** these prescribe `plan/<id>-<slug>` branches and "no merge commits". Practice differs:
  - every Codex lane uses `codex/*`;
  - `integration-gates.md:6-7` records that main was merged into the AR-1 branch (`d624ece`) before main fast-forwarded. I couldn't confirm that with git.
- **Fix:** record the Codex convention in §6.

**R11 · Low · `run-goal/SKILL.md:20`**
- **Defect:** it points to "the by-hand close-out in step 9", but the close-out is §10.

**R12 · Low · `tdd-guide.md:38`, `verify-goal/SKILL.md:68`**
- **Defect:** both cite thresholds that don't exist on main. `jest.config.cjs` has no `coverageThreshold`, and the domain package has no coverage settings.
- **Fix:** annotate "(thresholds arrive with QA-9)".

**R13 · Low · the stale-paths §4 replacement texts**
- **Defect 1:** the Aadhaar/biometric line has no source; the PRD never mentions Aadhaar. Cite the PRD §21.2 entity list or reword it.
- **Defect 2:** the code-reviewer date bullet omits the gym-timezone rule. Add: "gym records and visits use the gym's timezone" (PRD §4.2).

**R14 · Low · `checkpoint.md:11-16` and resume step 3**
- **Defect:** the entry gate and the planned `status.mjs show QA-2` / `gate MS-0` read the worktree's `5fefc31` snapshot, where QA-2 has no entry. On main, QA-2 is claimed.
- **Fix:** run planner reads in the main checkout (`run-goal` §0).

**R15 · Low · `docs/22:81, :145, :262`**
- **Defect:** the retired page's name was chosen without opening Figma, and register check T-7 is assigned to QA-2.
- **Fix:** Codex can authorise one read-only Figma metadata read, or the handoff can keep T-7 explicitly open.

**Found for other goals:** `mobile-ci.yml:6` still triggers on pushes to `v2/develop` (PL-1).

## Box verdicts

| Box | Verdict |
|---|---|
| 1 · stale-path search recorded, every hit fixed or labelled | **Not met:** R1 (with the other unapplied `.claude` items C1–C10), R3, plus R4 as a stale current status |
| 2 · tracker says the board owns status and ACCEPTANCE.md owns results | **Met in the working tree** (tracker :10-11, :19-21; main already said it in prose). Nothing is committed, so the verifier's `git diff main...codex/fitlog-qa2-docs` shows nothing yet |
| 3 · every docs/23 §7 and skill command runs on main as written | **Not met, unproved:** nothing was executed by the worker or by me, and `next --slots` cannot run as written (R5) |

**Command inventory:** every docs/23 §7 command and every skill command is unproved. The prior-run log lines that stale-paths §6.1 quotes do exist, with the quoted content. They are AR-1 runs made through `rtk proxy` from the AR-1 worktree, not runs on `5fefc31` or on this branch.

## Proposed amendments (a routine Codex decision under AUTH-01: extend QA-2's scope to status labels only)

- **ORCHESTRATOR.md**
  - Insert after line 9:
    > **27 October 2026 (QA-2):** `app/config.py` (§5), reversible migrations with `alembic downgrade` (§6), and `uv`, `pytest` and Maestro (§7, §11) describe the removed v1 stack and are historical. Migrations are append-only, and a migration on `main` is never edited (docs/23 §5, 003 §7); undo one with a new forward migration. The gates are docs/23 §7.
  - Replace the :280 cell with:
    > *Historical (v1).* Migrations are append-only: a rollback adds a forward migration; never edit or delete one on `main`.
- **Root README.md:46-50**
  > [Record 003](docs/architecture/003-architecture-freeze.md) is the frozen architecture and contract (AR-1). [001](…) and [002](…) are historical checkpoints of 17 and 19 October. CI is defined in `.github/workflows/mobile-ci.yml`; no hosted run is recorded yet (PL-1). The [delivery checklist](…) is a derived view of the plan board.
- **003**
  - Title: drop "(proposal)".
  - Append to :5, :6 and :8:
    > *QA-2, 27 Oct: historical. AR-1 was integrated at `73e3f63` and is Done; see Integration outcome.*
  - Re-space :14-18 and :62.
  - Retitle :20 to "Approval state — 26 October 2026 (historical, before integration)". No document links to that anchor (checked).
  - Add a revision-history row:
    > 27 Oct 2026 | Status labels only (QA-2): AR-1 integrated at `73e3f63` and Done; earlier PENDING/Not Done text is historical. No decision changed.

## Next phase

**1. Correction writer (docs and `.claude`; Codex must grant `.claude` edit permission; no DB, status or ledger changes).**
- Fix R2 with this wording:
  > attempt 1 · `codex/fitlog-qa2-docs` (coordinator-created from `5fefc31`; the worktree was detached for its first 50 s) · uncommitted

  Delete the rename step.
- Apply stale-paths §4 with the R1, R5, R9, R11, R12 and R13 amendments.
- Apply the scope amendments above, plus R6, R7, R8 and the :100-101 note wording.
- Re-run searches S1–S10 and update stale-paths §3.5, §5 and §7.
- Commit on `codex/fitlog-qa2-docs`. Do not rename the branch and do not push.

**2. Supervised execution (Codex runs it).**
- **Read-only, in the main checkout:**
  - `status.mjs show QA-2`, `gate MS-0`, `ledger --gate MS-5 --open`, and the docs/23 §10 reads;
  - `build.mjs --check`;
  - `status.mjs next --slots 1` (expect exit 1).
- **In the worktree, after rebasing onto `c8a5d57`:** install, `pnpm check` and the export.
- **`pnpm backend:test` on 55321:** only after `supabase status` confirms the stack, and serialized against MB-1's shared DB work.
- **Mutating skill commands:** run only in a disposable `git clone` of main under `/tmp`, with a local bare repo as `origin`. `PLAN_DIR` is repo-relative (`lib.mjs:11-12`), so status writes stay inside the clone.
- Then a fresh independent verifier.

## What I checked, and limitations

**Checked against the code, 003 and the PRD:**
- the new docs/23 §7 paragraph against `local-stack.mjs`, each `verify*.mjs`, `check-sql-sources.mjs:136-156`, `snapshot-contract.ts:129-157` and `contract.test.ts:116`;
- the `backend:test` comment against `package.json:18`;
- the docs/22 code claims, the 001/002/README/RESET-BASELINE/PROGRESS notes, the plan README hubs and SESSION-PROMPT paths;
- all 50 re-based tracker links: every target exists, with no `../` links left;
- the INBOX move: facts and links unchanged;
- each stale-paths §4 replacement against the PRD and 003 sections it cites, and C10 against `status.mjs`.

**Limitations:**
- No git, so no diff. I compared each changed file with the main checkout's copy. That copy is `c8a5d57` plus uncommitted coordinator edits, not `c8a5d57` itself.
- For the tracker and docs/22 I compared the changed regions, not every line.
- I found no sign that `c8a5d57` touches these 11 files, so a clean rebase is likely but unproven.
- Not checked: the live Figma file, hosted CI, any database, and the `d624ece` merge.