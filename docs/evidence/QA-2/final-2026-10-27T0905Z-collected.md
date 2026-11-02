No Critical or High findings. There are two Mediums and seven Lows. QA-2 is not Done and box 3 is still unmet. I edited, staged and committed nothing.

## What holds

- **Commit 1, `173eff0`** (parent `5fefc31`), *executed*. Exactly 48 paths: 22 modified (8 `.claude/` files and 14 docs) and 26 added (24 under `docs/evidence/QA-2/`, plus the checkpoint and handoff). It touches no `scripts/plan`, GOALS, status or ACCEPTANCE file.
- **Commit 2, `7a01395`**, *executed*. It changes only `handoff.md` (+207/−1,111). Neither commit has a trailer.
- **Blob IDs**, *executed*. All 24 in the handoff match `git ls-tree -r 173eff0 -- docs/evidence/QA-2/`. Commit 2 and the working tree leave them unchanged.
- **Handoff sections**, *inspected*. Every run-goal §9 section is present, in order. Box texts are verbatim apart from the adjusted ACCEPTANCE link.
- **`main`**, *executed*. It is `c8a5d57`, and since `5fefc31` it changes only `EXECUTION.md` (whose line 115 names the branch) and one supervision file. None of the five pinned paths has drifted. This is an inspection, not the formal drift check.
- **Pins and prerequisites**, *inspected*. Both pin checks list the five paths (stale-paths :2447, :2454). The W1 network need and the W5 DB-lane need are in matrix steps 8, 9 and 14 (c), and in the handoff's *Left undone* items 4 and 7.
- **F1**, *inspected*:
  - All seven purposes in PRD §22.2 are listed.
  - `PRO_REQUIRED` coming before `CONSENT_REQUIRED` matches 003 at :438 and :951.
  - A gym link without consent getting `CONSENT_REQUIRED` matches 003 :647.
  - The privacy boundary is absolute, consistent with PRD §16.1 and the override.
  - The hunk `-27,6 +27,16` counts correctly.
- **Override**, *inspected*. The two copies in SESSION-PROMPT (:27–31 and :113–117) are identical. Both stop conditions are stated: QA-2 merged **and** the launching checkout corrected.

## Findings

**M-1 · Medium · `stale-paths.md:2413` (step 14 (a)); `integrate-goal/SKILL.md:15-23`**
- **Defect:** step 14 (a) can never pass. integrate-goal refuses on any untracked path, and the main checkout holds three unrelated ones that step 14 (a) itself says to leave alone.
- **Scenario:** my read-only status of the main checkout (*executed*) shows `.impeccable/review/`, `artifacts/` and `error.log`. These are the unrelated files `EXECUTION.md:40-41` says to preserve. Even after Codex settles all its own files, the integrator returns `RESULT: refused` every time. AR-1 only got through by Codex's own practice ("zero incoming path collisions", `EXECUTION.md:90-93`), which step 14 doesn't name.
- **Fix:** Codex rules how this precondition treats pre-existing unrelated untracked paths. For example, the integrator task names the tolerated set and requires that none of it overlaps the branch's incoming paths. Never move, stash or delete those files.
- **Next proof:** just before launch, a read-only `git --no-optional-locks status --porcelain=v1 -uall` and `git diff --name-only H...codex/fitlog-qa2-docs`, with the empty overlap recorded.

**M-2 · Medium · `security-reviewer.md:34`; `followup-purpose-consent.patch:30`**
- **Defect:** F1 drops 003 §3.3's caveat (:159-160) that whether consent events must be kept after erasure is still open. That question is R-4, owner-reserved under DEC-04 (003:1239), so F1 presents an open legal question as settled.
- **Scenario:** MB-7's erasure job deletes consent events, and a reviewer following F1 passes it. If R-4 then requires keeping them, the job has to be redone, and any records already deleted are gone for good.
- **Fix:** add "Whether they must instead be kept after erasure is R-4 (DEC-04); until it is decided, a change that deletes them is a finding."
- **Next proof:** a separate additive patch (call it F2), `git apply --check`, one apply, an independent read, then P1 and P2.

**L-1 · Low · `security-reviewer.md:35-38`**
- **Defect:** "every AI entry point" is undefined in the agent file, and the exceptions in PRD §10.3 and 003 :957 are missing.
- **Scenario:** a reviewer demands `PRO_REQUIRED` or `CONSENT_REQUIRED` on confirming a ready proposal after AI permission is withdrawn. Fixing that would break PRD §10.3, which keeps such a proposal confirmable.
- **Fix:** add "(create, retry and reanalyse; confirming a ready proposal or manual food needs neither)". It can go in the same F2 patch.

**L-2 · Low · `handoff.md:8-12`**
- **Defect:** "Find it by that subject, which is unique" is ambiguous, and the uniqueness was never shown.
- **Scenario:** `git log --grep` on that subject matches both commits, because commit 2's body quotes it (*executed* via `git log -2`). My all-refs uniqueness check was **denied**, so I stopped there; it is UNRUN.
- **Fix:** give an exact lookup, such as `git log --format='%H %s' -- docs/plan/runs/QA-2/handoff.md`, keeping the line whose subject equals that string.
- **Next proof:** run that lookup in the post-commit phase, before and after the rebase.

**L-3 · Low · `stale-paths.md:2445-2451`**
- **Defect:** the drift check compares `5fefc31` with the rebase base, but D clones whatever `main` is when it runs (script :1001, :1019).
- **Scenario:** `main` moves after the rebase, the check still passes, and D's one allowed run is spent against changed GOALS or status data.
- **Fix:** check `5fefc31` against `main` itself straight before D, and require D's logged pin to equal that hash.

**L-4 · Low · step 14 (b); `integrate-goal/SKILL.md:25-39`**
- **Defect:** the expected-`MAIN_BEFORE` refusal only happens before step 3, and it doesn't cover a resumed integration.
- **Scenario 1:** if `main` moved before launch, the integrator refuses only after the rebase and all the gates, which wastes the DB-lane slot.
- **Scenario 2:** if an interrupted integration had already fast-forwarded `main`, the refusal fires with `main` already moved. That contradicts "a refusal leaves `main` untouched". The re-run pin check would then exit 1, because the new `main` contains QA-2's own skill edits, and D would be demanded again.
- **Fix:** check `main` equals H before step 1 as well. On a resume, compare H with the interrupted run's recorded `MAIN_BEFORE`.

**L-5 · Low · `handoff.md:9-10`, `:114-116`; `checkpoint.md:6`, `:328`**
- **Defect:** the compacted records overstate one thing, drop one open item and carry stale lines:
  - The handoff calls the previous version "the full phase 1–12 record". That version says of itself that it covers phases 1–11, with phase 12 in stale-paths §19 and checkpoint step 67.
  - The compaction dropped the open Low on the D script's assumptions (git's `-c` and `--template=` behaviour is expected from documentation, not observed).
  - Checkpoint :6 still says "uncommitted", and :328 says the compaction was done with Edit.
  - Handoff :114-116 still asks for the Write-versus-Edit ruling that Codex has now given.
- **Fix:** a records-only fix in its own commit. The 09:05Z final, still untracked, goes in the next inventory too.

**L-6 · Low · `handoff.md:127`**
- **Defect:** nothing links phase 8's SHA-256 of the historical patch (`4f9ed884…a382169`) to its committed blob (`364e2f33…`). So it is unproven that the committed patch is the one that was applied.
- **Next proof:** take the SHA-256 of `git show 173eff0:docs/evidence/QA-2/claude-corrections-UNAPPLIED.patch` and compare it. If that read is denied, record it as UNRUN.

**L-7 · Low, informational · `security-reviewer.md:31`, `:38-39`; PRD :1724-1728**
- **Defect:** F1 counts passport grants as a purpose consent and says no consent opens staff access, yet the PRD's deferred passport (G29) lets a receiving gym see a member-selected, expiring artifact.
- **Fix:** leave F1 alone; the absolute rule stands. Record this for G29, which needs its own approved scope (PRD :1054-1055).

## How each proof was obtained

- **Executed by me** (read-only, each a separate `rtk proxy` command): the git reads listed under *What holds*, `git show` and `git grep` on commit 1's handoff, the diffs of the 22 tracked files, and the main checkout's status.
- **Inspected** (Read, Grep, Glob):
  - F1 against PRD and record 003.
  - The SESSION-PROMPT override copies, run-goal, integrate-goal, stale-paths §2, §18, §19 and the D setup.
  - S1–S6 over `.claude/`: the only hit is `verify-goal:40`, as the handoff says.
  - The main repository's hooks folder: `*.sample` files only.
  - No secrets in the QA-2 records, and no broken links into 003.
- **Inherited, not re-checked:**
  - The phase 8 apply and its hash.
  - Phase 9's P1, P2 and M1–M15, and phase 10's M2.
  - Phase 12's pre-staging inventory, `git apply` output and staged-set check.
  - The D copy's hash, and the live `claimed` status.
- **UNRUN:**
  - P1 and P2 on the post-F1 file; my reading of the file is code review only, not their proof.
  - P3, P3b, P4 and P5.
  - D and the drift check.
  - M16–M18, M20 and M21, the rebase and the M re-runs.
  - W1–W6, the three reviews, the verifier and integration.
- **Denied to me, sequence stopped, no substitute:**
  - The all-refs subject check (L-2).
  - A `sed` read of `stale-paths.md:745-752`, so I did not verify that §6.3 step 5 (:750) lists the five paths. The §18 copies do.

**Suggested next phases:**
1. Codex rules on M-1.
2. One bounded phase: the F2 patch for M-2 and L-1 (check, apply once), plus records-only fixes for L-2 to L-5, as their own commit.
3. A fresh read of F2.
4. The planned post-commit phase: the reads, the L-2 lookup, the L-6 hash, the rebase, the M re-runs, then P1 and P2.

D stays blocked.