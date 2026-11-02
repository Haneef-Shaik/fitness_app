# Handoff — QA-2 · Reconcile the docs with the code        attempt 1 · `codex/fitlog-qa2-docs` · commit 2 `7a01395` of correction phase 12, on top of commit 1 `173eff0`, plus correction phases 13 and 14's uncommitted changes (before any rebase)

**Outcome claimed.** The card's named `docs/` files, plus the root README, ORCHESTRATOR and 003's
status labels (scope approved by Codex), agree with `main` and frozen record 003. The `.claude/`
corrections (the historical 8-file patch and follow-up F1) are applied and committed on this
branch. Follow-up F2 is applied in this worktree and not committed (phase 13). **QA-2 is not
Done**: box 3 is open, M-1 is not resolved in the integrate-goal skill, and nothing is integrated.
*(Phase 14, the 10:05Z review:)* F2's one-sided sentence (P13-1) is **not** fixed: the Edit was
denied. The ignored-entry gap (P13-2) is an integration blocker. P13-3 to P13-7 are fixed in the
records only. This phase makes no box claim.

**Where the full record is.** This is the compact handoff (M5, commit then cut, Codex's ruling on
the 07:05Z review). *(Phase 13, the 09:05Z review's L-2 and L-5: corrected.)* **The previous
version of this file** is the full record of phases 1–11, with every one of those phases' rules,
command records, self-review and denials. Phase 12's record is in stale-paths §19, checkpoint step
67 and this file's *Commits and integrity anchor*. Phase 13's is in stale-paths §20 and checkpoint
step 69. Phase 14's is in stale-paths §21 and checkpoint step 71. To find the previous version after any rebase, run
`git log --format='%H %s' -- docs/plan/runs/QA-2/handoff.md` and keep the one line whose subject
**equals** `docs(QA-2): preserve reviewed reconciliation phase history`. Do not use
`git log --grep`: commit 2's body quotes that subject, so it matches both (the 09:05Z reviewer's
`git log -2` read, *inherited*). Phase 13 ran this lookup
before any rebase (*executed*): two lines, and exactly one equal subject,
`173eff04cbf6a9c3384ae02c217ef218ada99f02`. Stale-paths §1–§20 and the checkpoint keep their full
records too.
[stale-paths.md](../../../evidence/QA-2/stale-paths.md) ·
[checkpoint.md](checkpoint.md) ·
[09:05Z review](../../../evidence/QA-2/final-2026-10-27T0905Z-collected.md) ·
[its response](../../../evidence/QA-2/review-response-2026-10-27T0905Z.md) ·
[10:05Z review](../../../evidence/QA-2/final-2026-10-27T1005Z-collected.md) ·
[its response](../../../evidence/QA-2/review-response-2026-10-27T1005Z.md)

## Current state (correction phases 13 and 14)

- **Branch:** `codex/fitlog-qa2-docs`, coordinator-created from `5fefc31`. **Never rename it**:
  committed `main` names it in `EXECUTION.md:115`.
- **`main`:** `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf` (*executed*: phase 12 call 4 and phase 13
  call 16, read from this worktree). It is one commit ahead of `5fefc31` and changes only
  `docs/plan/EXECUTION.md` and `docs/plan/runs/supervision-2026-10-26T1903Z.md` (the 06:05Z and
  09:05Z reviewers' git reads, *inherited*). Not rebased yet.
- **Commits:** commit 1 `173eff04cbf6a9c3384ae02c217ef218ada99f02`, then commit 2
  `7a01395f1688df7901f804f72c9e3c12267253d2`, which changes only this file (*Commits and integrity
  anchor*, below). `HEAD` is commit 2 (phase 13 call 3; phase 14 call 3, *executed*). Nothing is
  pushed.
- **Uncommitted (phase 13):** F2 in `.claude/agents/security-reviewer.md`; the records
  (`stale-paths.md`, `checkpoint.md`, this file); two new files (the F2 patch and the 09:05Z review
  response); and the two untracked 09:05Z files. Nothing is staged. The final inventory is below.
  *(Phase 14:)* the same, plus two untracked finals saved since (phase 13's own final and the
  10:05Z review) and phase 14's review response. Phase 14 changed the three records only;
  `security-reviewer.md` is as phase 13 left it, because the F2-sentence Edit was denied.
- **Live status:** QA-2 `claimed` by Codex on this branch (M9, phase 9, *executed* then). QA-2 made
  no status, GOALS, ledger or `main` change.
- **The privacy override** stays in every `security-reviewer` launch: gym staff never read or write
  private health data, whatever consent (PRD §16.1; 003 §6). It stays until QA-2 is merged to
  `main` **and** the launching checkout has the corrected file, identical to `main`'s, as all six
  SESSION-PROMPT checks (P1–P5, P3b) decide. Applying or committing here does not end it.
- **Next:** an independent read-only review of phase 13 (F2, the records and the denied Edit).
  Codex decides a writer route for the integrate-goal edit. Then a phase to stage and commit
  phase 13's files, then the post-commit reads and the rebase, then the rest of the matrix (*Left
  undone*). *(Phase 14: the review of phase 13 is done, the
  [10:05Z review](../../../evidence/QA-2/final-2026-10-27T1005Z-collected.md). Next comes a fresh
  independent review of phase 14. Then Codex names writer routes for the F2 sentence (P13-1),
  before any commit of phase 13's files, and for the next skill-edit scope (stale-paths §21), which
  is the integration blocker.)*

**Final inventory, phase 13** (after the record edits): see *Inventory at the end of phase 13*,
below. **Phase 14:** *Inventory at the end of phase 14*.

## Done when

| Box | Met | Evidence |
|-----|-----|----------|
| `docs/evidence/QA-2/stale-paths.md` records the search (`services/api`, `uv run`, `jest.config.js`, `docs/1[0-9]-`, `Maestro`, `config.py` …) and every hit is fixed or labelled historical | **yes, committed on the branch; not integrated** | [stale-paths.md](../../../evidence/QA-2/stale-paths.md): searches S1–S10 (§2), dispositions (§3.1–§3.6), re-runs (§7). In the named `docs/` files and the approved extension, every hit is fixed, labelled or accurate. In `.claude/`, 20 findings (C1–C10, C12–C21) are in the historical patch, applied in phase 8 (*executed*: SHA-256 `4f9ed884…a382169` before the check and before the apply; `git diff --stat -- .claude` exactly 8 files), and F1 adds the purpose-consent bullet (phase 12, *executed*). F2 adds six lines to it (phase 13, *executed*, uncommitted): consent-event retention after erasure stays open as R-4 under DEC-04, and the AI entry points and their exceptions are named. After the apply, S1, S5 and S6 over `.claude/` find only `verify-goal:40` (accurate), and S2–S4 and S8 find nothing (*inspected*, Grep). Commit 1 carries it all, so `git diff main...codex/fitlog-qa2-docs` now shows it |
| The tracker states that the board owns goal status and [ACCEPTANCE.md](../../ACCEPTANCE.md) owns acceptance results | **yes, committed on the branch; not integrated** | `docs/09-PROJECT-TRACKER.md:10` "Goal status · **Owned by the plan board** … This tracker does not hold goal status"; `:11` "Acceptance results · **Owned by plan/ACCEPTANCE.md** … This tracker does not hold acceptance results"; prose at `:19-21`. In commit 1 |
| Every command in docs/23 §7 and in the skills runs on `main` as written | **no** | **Run:** M19 (phases 7 and 8), M1 and M3–M15 (phase 9) and M2 (phase 10), all *executed* on `main` `c8a5d57` **before any commit**. M2 is labelled "ran; run-plan §1 red condition holds (coordinator state)". **Not run:** M16–M18, M20 and M21 (post-commit), every M re-run after the rebase, W1–W6, and the D script (the disposable-clone proof of the mutating skill commands, D1–D19), which has **never run**. Its run line was refused in phases 9 and 10, the second time with its exact text on the allowlist, and it is **blocked** until Codex or the owner decides a route. A reviewer's *inspected* reading of D does not close this box. **Box 3 reading** (phase 2, Codex): `status.mjs next --slots …` is future-only and never run; a session finds its mode by reading `status.mjs`'s dispatch. The verifier rules on that reading. Plan: stale-paths §6.3 (M1–M21, W1–W6, the script), the matrix in §18 as amended in §19 and §20. *(Phase 13:)* the integrate-goal edit for M-1 and L-4 was denied, so the skill's precondition 2 still refuses on any untracked path; once a permitted route lands the edit, its two new read-only commands, M22 and M23 (§20), need runs as written too. *(Phase 14, P13-3:)* M22 and M23 are replaced by stale-paths §21's M22a, M22b, M22 (with ignored entries) and M23 (pinned `H` and `T`, `--no-renames`). They run before the verifier, from the branch's skill text, once a permitted route lands it. They are a plan; none has run |

## Acceptance evidence

| Ledger row | Run | Result | Evidence | Row written here? |
|------------|-----|--------|----------|-------------------|
| None | — | — | QA-2 proves no ledger row (GOALS.md and ACCEPTANCE.md read directly) | No. ACCEPTANCE.md is untouched |

## Gates

| Gate | Command | Result |
|------|---------|--------|
| Standard check | `pnpm check` | **Not run** (not permitted in any phase so far; W2). The diff is Markdown and two `.patch` files under `docs/evidence/`, plus Markdown under `.claude/` |
| Plan check | `node scripts/plan/build.mjs --check` | Not required: GOALS.md and ACCEPTANCE.md are unchanged. M14 ran it on `main` in phase 9 and passed |
| Backend, export | `pnpm backend:test`; `expo export …` | Not required by the paths QA-2 touches, and not run. integrate-goal step 2 runs them anyway at integration (matrix step 14 (c): the DB lane, and possibly the network) |
| F1 check and apply, **phase 12** | `rtk proxy git apply --check --verbose docs/evidence/QA-2/followup-purpose-consent.patch`, then `rtk proxy git apply --verbose …` the same path, once | **Applied** (*executed*): `Checking patch .claude/agents/security-reviewer.md...`, then `Applied patch .claude/agents/security-reviewer.md cleanly.` The bullet is at `security-reviewer.md:30-39` (Grep) |
| F2 check and apply, **phase 13** | `rtk proxy sha256sum docs/evidence/QA-2/followup-consent-retention-ai-scope.patch`; `rtk proxy git apply --check --verbose …` the same path; `rtk proxy git apply --verbose …`, once; the same `sha256sum` again | **Applied** (*executed*, uncommitted): SHA-256 `14d71b1782a5da9f8e276dd782fcd67a91e9661f19085679e31b1cf61a9dc4fa` before and after; `Checking patch .claude/agents/security-reviewer.md...`, then `Applied patch .claude/agents/security-reviewer.md cleanly.` The lines are at `security-reviewer.md:40-45` (Read). Do not apply it again |
| P1 and P2 | `rtk proxy grep -n -F "only with the member's consent" /Users/Adya/.codex/worktrees/fitlog-qa2-docs/fitness_app/.claude/agents/security-reviewer.md`, and P2's sentence | **Phase 12: P1 denied, P2 not attempted**, and nothing stood in for them. **Phase 13: not run** (no P proof permitted). Last run: phase 9, on the file before F1 (P1 no output, exit 1; P2 line 28, exit 0). F1 and F2 contain neither sentence (Grep) |
| Historical patch apply, phase 8 | `git apply` on `claude-corrections-UNAPPLIED.patch`, between two equal SHA-256 reads | **Applied** (*executed*): 8 files, `93 insertions(+), 43 deletions(-)`. Do not apply it again |
| Historical patch linked to its blob, **phase 13** (the 09:05Z review's L-6) | `rtk proxy git rev-parse 173eff0:docs/evidence/QA-2/claude-corrections-UNAPPLIED.patch`; `rtk proxy git hash-object docs/evidence/QA-2/claude-corrections-UNAPPLIED.patch`; `rtk proxy sha256sum` the same path; `rtk proxy git config --show-origin --get-all core.autocrlf` | **Linked** (*executed*): the committed blob and the working file's blob ID are both `364e2f3353b5869b56e8d6ecea74d6ba6e60904c`; `core.autocrlf` is unset and the file has no CR, so the bytes are the blob's; their SHA-256 is `4f9ed884360edfbb8f32142264c3ad068aeaaddb3ead298ff2f7fc2a9a382169`, phase 8's. So the committed patch is the one phase 8 applied |
| integrate-goal edit, **phase 13** (M-1, L-4) | The Edit tool, on `.claude/skills/integrate-goal/SKILL.md` | ***Denied.*** The sequence ended, with no other writer. The text as typed is in stale-paths §20; the rule is in the proof matrix only. Not retried in phase 14, by rule |
| F2 sentence, **phase 14** (P13-1) | The Edit tool, on `.claude/agents/security-reviewer.md`: one sentence, "Until then, a change that deletes consent events, even in the erasure job, is a finding." | ***Denied.*** The sequence ended, with no other writer. The text as typed is in stale-paths §21. Grep shows `:42` unchanged (*inspected*). P13-1 is **open** |
| Orientation, **phase 14** | `rtk proxy git rev-parse --abbrev-ref HEAD`; `rtk proxy git rev-parse HEAD`; `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ`; `rtk proxy git --no-optional-locks status --porcelain=v1 -uall` | *Executed*: `codex/fitlog-qa2-docs`, `7a01395f…`, and the inventory (4 modified, 6 untracked). `date -u` was ***denied*** and not retried or replaced. No hash, P, M, W or D command ran |
| Reviews | `code-reviewer`, `security-reviewer`, `tdd-guide` on `git diff main...codex/fitlog-qa2-docs` | **Not run**: no sub-agents, by Codex's phase rules (phases 12, 13 and 14). The self-review in the previous version is not independent. The 09:05Z review is an independent read of phase 12, not these three reviews |

## Commits and integrity anchor (phase 12, *executed*)

- **Before staging:** `git --no-optional-locks status --porcelain=v1 -uall` printed exactly the
  expected 48 paths: 22 modified (the 8 `.claude/` files and 14 docs) and 26 untracked (24 under
  `docs/evidence/QA-2/`, then `checkpoint.md` and `handoff.md`), as listed in stale-paths §19.
- **Staging:** four `git add --` commands with literal paths only, no folder or `-A`. Then
  `git diff --cached --name-status` printed the same 48 paths (22 `M`, 26 `A`), and the status
  showed nothing unstaged or untracked.
- **Hooks:** `git rev-parse --git-path hooks` gave `/Users/Adya/personals/fitness_app/.git/hooks`,
  which holds only `*.sample` files (Glob), so no hook ran.
- **Commit 1:** `173eff04cbf6a9c3384ae02c217ef218ada99f02`,
  `docs(QA-2): preserve reviewed reconciliation phase history`, on `5fefc31`:
  `48 files changed, 6500 insertions(+), 189 deletions(-)`. Its body carries the L5 note on the
  historical patch's header and "followup-purpose-consent.patch (F1) is applied in this commit."
  After it, the status printed nothing (a clean tree).
- **Blob IDs at commit 1** (`git ls-tree -r HEAD -- docs/evidence/QA-2/`). This is the state at
  commit time. It is **not** proof that a file was unchanged before then; earlier phases could
  not read hashes for the finals.

  | Blob | Path under `docs/evidence/QA-2/` |
  |---|---|
  | `364e2f3353b5869b56e8d6ecea74d6ba6e60904c` | `claude-corrections-UNAPPLIED.patch` |
  | `6541514bdb094cbd642c6e6935dfdd3b6ed81fa6` | `final-2026-10-27T0335Z.md` |
  | `f1f951809826e3eb31ac94c6990b10fee4b2acf0` | `final-2026-10-27T0405Z.md` |
  | `003e9b679389ef0fcfbf1086d9d0e468757c7e88` | `final-2026-10-27T0435Z.md` |
  | `cc9701ab037cfda35e4b90b3caa1ca5f154b4281` | `final-2026-10-27T0505Z.md` |
  | `52c69b174aea3e7fc08236cd6efedd2bce64ed74` | `final-2026-10-27T0535Z.md` |
  | `19cf13facfc841fb687e996f4382a33fa296a03f` | `final-2026-10-27T0605Z.md` |
  | `57597216c0f384e9f9a8591321244b721308de5b` | `final-2026-10-27T0635Z.md` |
  | `24fdb5d563a69881beb55d4ac278844069c2f648` | `final-2026-10-27T0705Z.md` |
  | `8a093969a37eb7ef13d4872c249da166843a1c41` | `followup-purpose-consent.patch` |
  | `4ce2e11ab99776d1aa660e772e88160436673389` | `implementer-final-2026-10-26T2235Z.md` |
  | `f60ce884ffc1045eb349580e2919a2fb7b4fdec6` | `implementer-final-2026-10-26T2335Z.md` |
  | `f622cefaa72a239d99f519aa41d985f759186c88` | `implementer-final-2026-10-27T0035Z.md` |
  | `1b815fb725088a67e6520f976788490567d5edf2` | `implementer-final-2026-10-27T0135Z.md` |
  | `f2e397318549be1d8223ebfcec883337453669ed` | `implementer-final-2026-10-27T0235Z.md` |
  | `38b5a08070a64f1d4ce45f267d071a6ba36adfb5` | `implementer-final-2026-10-27T0305Z.md` |
  | `90d6425c445f2a8396c2a3d3658781ecd9ce400a` | `independent-review-2026-10-26T2000Z.md` |
  | `603eb7b905840fa27299ab3ff49a115c4371ec53` | `review-response-2026-10-27T0605Z.md` |
  | `c448a8f6425ef3a9d007c581c938cae5febe8feb` | `review-response-2026-10-27T0705Z.md` |
  | `238191cc67e46d54602b49375507932b1db4fc72` | `reviewer-final-2026-10-26T2305Z.md` |
  | `d03fa83b703aee12c60ab809ad7806483e3555c6` | `reviewer-final-2026-10-27T0005Z.md` |
  | `a1c17c20709f8f5d2cb74255d68bb0a22b1ddbb7` | `reviewer-final-2026-10-27T0105Z.md` |
  | `dc2da25edcaccd8e448e9532330b430c15108949` | `reviewer-final-2026-10-27T0205Z.md` |
  | `906a5f6777e07cd075a03cb54c95f982da9b3e95` | `stale-paths.md` |

- **Commit 2:** `docs(QA-2): compact current verification handoff`. It changes this file only. A
  file cannot hold its own commit's hash, so read it with git. Check:
  `git diff 173eff0 <commit 2> -- docs/plan/runs/QA-2/handoff.md` should show only the
  compaction, and `git diff --stat 173eff0 <commit 2>` should list only this file. The
  compaction replaced this file's text in place with the Write tool, after reading it. No `cp`,
  no copy and no second file was made. *(Phase 13: Codex has ruled on this. The in-place Write is
  accepted, so no request is left open.)*

## Inventory at the end of phase 13 (*executed*, after the record edits)

`rtk proxy git --no-optional-locks status --porcelain=v1 -uall` printed exactly these 8 paths:
- **Modified (4):** `.claude/agents/security-reviewer.md` (F2), `docs/evidence/QA-2/stale-paths.md`,
  `docs/plan/runs/QA-2/checkpoint.md` and this file.
- **Untracked (4), in `docs/evidence/QA-2/`:**
  - `final-2026-10-27T0905Z-collected.md`, the 09:05Z review, SHA-256
    `511be56cefdf90ad2bcd4d69f112dcb560dfa990f0c5e169065a82b061458056`;
  - `final-2026-10-27T0905Z.md`, phase 12's implementer final, misnamed in the 08:35 cycle, SHA-256
    `ddfe5e2e5026b0bee232f26b0ee716806a0cb6f998baa653cb077fe2efb702c0`;
  - `followup-consent-retention-ai-scope.patch` (F2), SHA-256
    `14d71b1782a5da9f8e276dd782fcd67a91e9661f19085679e31b1cf61a9dc4fa`;
  - `review-response-2026-10-27T0905Z.md`.

Both 09:05Z files are kept verbatim; phase 13 hashed them before any record edit and wrote neither.
`git --no-optional-locks diff --stat` gave `4 files changed, 471 insertions(+), 66 deletions(-)`,
with `security-reviewer.md` `+6`. `git diff --cached --name-only` printed nothing, so nothing is
staged, and `HEAD` is still `7a01395f…`. `.claude/skills/integrate-goal/SKILL.md` is unmodified, so
the denied Edit wrote nothing. *(This file's own later edit, this section, came after that
`--stat`.)*

## Inventory at the end of phase 14 (*executed*, after the record edits)

`rtk proxy git --no-optional-locks status --porcelain=v1 -uall` printed exactly these 11 paths:
- **Modified (4):** `.claude/agents/security-reviewer.md` (F2 from phase 13, unchanged in phase
  14), `docs/evidence/QA-2/stale-paths.md`, `docs/plan/runs/QA-2/checkpoint.md` and this file.
- **Untracked (7), in `docs/evidence/QA-2/`:**
  - `final-2026-10-27T0905Z-collected.md`, the 09:05Z review: SHA-256 `511be56c…61458056`
    (phase 13, *inherited*);
  - `final-2026-10-27T0905Z.md`, phase 12's final, misnamed: SHA-256 `ddfe5e2e…fb702c0`
    (phase 13, *inherited*);
  - `final-2026-10-27T0935Z-collected.md`, **phase 13's own implementer final**, not a review
    (the 10:05Z reviewer's reading, *inherited*; content *inspected*). SHA-256 **UNRUN**;
  - `final-2026-10-27T1005Z-collected.md`, the 10:05Z review of phase 13. SHA-256 **UNRUN**;
  - `followup-consent-retention-ai-scope.patch` (F2): SHA-256 `14d71b17…61a9dc4fa` (phase 13,
    *inherited*);
  - `review-response-2026-10-27T0905Z.md`;
  - `review-response-2026-10-27T1005Z.md`, new in phase 14.

Every final is kept verbatim and unrenamed. Phase 14 wrote none of them. The stage phase records
each file's role and SHA-256. Further checks:
- `git --no-optional-locks diff --cached --name-only` printed nothing, so nothing is staged.
- `git --no-optional-locks diff --check` printed nothing.
- `git --no-optional-locks diff --stat` gave
  `4 files changed, 899 insertions(+), 66 deletions(-)`, with `security-reviewer.md` still `+6`.
- `.claude/skills/integrate-goal/SKILL.md` is not in the status.

So neither denied Edit wrote anything. *(This section and §21's last rows were written after
those reads.)*

## Inherited and used

| From | Claim | Held? |
|------|-------|-------|
| Codex's phase 12 task, with its 08:04Z post-reset reconciliation | Acceptance of the 07:05Z review and the rulings in stale-paths §19; the earlier attempt `bf4fef77` stopped at an account limit with no change, test or commit | Recorded as Codex's (*inherited*) and followed. The worktree matched phase 11's inventory plus the two new finals (call 1), which agrees with "no changes" |
| The 07:05Z review | The main checkout `main…origin/main [ahead 50]`, 4 modified and 29 untracked; `EXECUTION.md` and `runs/local-supervision.json` modified there | *Inherited*: phase 12 did not read the main checkout. It is the reason for matrix step 14 (a) |
| The 06:05Z review | `c8a5d57`'s parent is `5fefc31`, and it changes only two coordinator files | *Inherited* (its git read). M16 is still QA-2's own post-commit read |
| Phases 9 and 10 (*executed* then) | M1–M15 on `main` `c8a5d57`; M9 shows QA-2 `claimed`, with QA-1 and AR-1 Done | Not repeated in phase 12, by rule. They predate both commits |
| Phases 8–10 (*executed* then) | The D copy at `/tmp/fitlog-qa2-script.9wBgD5/qa2-box3-proof.sh`, byte-identical to the block, SHA-256 `1e64c8653b662967285123bd5f0f7319fb5ddbd5326cc2614a6a8e8f0cfe92e5` | Not re-read in phase 12. Re-check it straight before any run (L4) |
| Phase 8 (*executed* then) | The historical patch's SHA-256 `4f9ed884360edfbb8f32142264c3ad068aeaaddb3ead298ff2f7fc2a9a382169` | **Re-read and linked in phase 13** (*executed*, L-6): the committed blob's bytes have this SHA-256 (*Gates*) |
| The 09:05Z reviewer | `main` `c8a5d57` changes only `EXECUTION.md` and one supervision file since `5fefc31`; the main checkout holds `.impeccable/review/`, `artifacts/` and `error.log` untracked | *Inherited* (its git reads). Phase 13 did not read the main checkout. These are the reason for §20's tolerated-set rule |
| Codex's phase 13 task | `final-2026-10-27T0905Z.md` is phase 12's own final, misnamed in the 08:35 cycle; the collected file is the 09:05Z review | *Inherited*, and consistent with both files' contents (Read) |
| `status.json` (worktree snapshot) | QA-1 done `67e6d1c`, AR-1 done `73e3f63` | Snapshot only, not live status |

## Mutation checks

None applicable: the diff is documentation, with no guard or test. The D script's `guard`,
`config_unset` checks and no-hook setup are guards in a plan, never run, so no guard has been seen
to pass or stop. Of the six SESSION-PROMPT checks, only P1 and P2 have ever run (phase 9, before
F1); their expected exit codes match git's and grep's documented behaviour.

## Review findings left open

- **High, mitigated on this branch only · `security-reviewer.md`'s consent bullet** (R1, C4). Every
  checkout without QA-2's correction tells reviewers that consent opens staff access. It is fixed
  in commit 1, not on `main`, so the override is required in every launch (MB-1's included).
- **Medium · box 3** (above). D is blocked; the post-commit reads, the rebase, the M re-runs and
  W1–W6 are not run.
- **Medium · M-1 and L-4 not in the skill** (the 09:05Z review). Codex ruled that integrate-goal
  should tolerate explicit, pre-existing, unrelated untracked paths after a read-only full
  inventory and an empty incoming-path overlap, and check the expected `MAIN_BEFORE` before the
  rebase and straight before the fast-forward. The Edit was **denied** in phase 13, so the
  committed skill still refuses on any untracked path, and matrix step 14 cannot pass in the main
  checkout as it stands. The rule is in the proof matrix (stale-paths §20); Codex decides the
  writer route.
- **Medium · P13-1, F2's one-sided interim rule** (the 10:05Z review). F2's sentence at
  `security-reviewer.md:42-43` makes deleting consent events "even in the erasure job" a finding.
  That conflicts with F1's erasure-job exception at `:34`, and in practice picks R-4's retention
  answer. Codex's fix: one symmetric sentence that makes the exception subject to R-4 and chooses
  neither answer. The Edit was **denied** in phase 14, with no other writer used; the text as typed
  is in stale-paths §21. It is to be fixed before phase 13's files are committed, by a writer
  route Codex names.
- **Medium · P13-2, ignored paths at integration: an integration blocker** (the 10:05Z review;
  this replaces phase 13's Low). The inventory must list ignored entries (`!!`) as well as
  untracked ones. Paths must be compared after NFC normalisation and case folding, and by path
  prefix. `git merge` overwrites an ignored file at an incoming path by default (*expected* from
  git's documentation, not observed). Stale-paths §21 holds the plan. It is not executed code, and
  integration stays blocked until the denied skill correction (§21's next skill-edit scope) lands
  and is reviewed.
- **Low · F2 has had no independent read.** It was written and applied in phase 13
  (`security-reviewer.md:40-45`). *(F1's ten-line bullet was read by the 09:05Z reviewer, who
  found M-2 and L-1 in it; F2 answers those.)* *(Phase 14: the 10:05Z review has now read F2. It
  found P13-1 and confirmed the L-1 half.)*
- **Low · P1 and P2 not re-run after F1 or F2.** Phase 12's P1 was denied, as phase 8's was, and
  phase 13 permitted no P proof. P3, P3b, P4 and P5 have never run.
- **Low · D script assumptions, all fail-closed** *(restored from the previous version, :797–814,
  for the 09:05Z review's L-5)*. If git stores `origin` in a form other than `$D/origin.git`, the
  first `guard` stops the script. Before the first clone it stops on a system, global or effective
  `core.hooksPath` or `init.templateDir`, on `GIT_TEMPLATE_DIR`, `GIT_CONFIG`,
  `GIT_CONFIG_PARAMETERS` or `GIT_CONFIG_COUNT`, on any `include` or `includeIf` in system or
  global config, and on any unexpected `git config` error. The two clones run as
  `git -c core.hooksPath="$D/no-hooks" clone --template= …`, and D7's setup worktree creation as
  `git -c core.hooksPath="$D/no-hooks" worktree add "$D/wt" plan/qa-2-box3-proof-renamed`. After the
  clones it checks the effective `core.hooksPath` in `$D/repo` and `$D/origin.git`, and after D7 in
  `$D/wt`, and stops on any non-sample hook. **What `-c` and `--template=` do is *expected* from
  git's documentation, not observed.** The live `status.json` hash is for information only.
- ~~**Low · ignored files at integration**~~ *(Phase 14: raised to the Medium P13-2 above.)*
  Phase 13's text, kept: (stale-paths §20 (d)) the tolerated-set inventory lists untracked files,
  not ignored ones, and `git merge` overwrites an ignored file at an incoming path by default
  (*expected* from git's documentation, not observed).
- **Low · harness permissions.** The D run line is refused even with its exact allowlist entry,
  and P1's `grep` form is refused in some phases and not others. A Codex authorisation is not a
  harness permission.
- **Low, owned by QA-2 · the global Git config file set.** Whether `--global` also reads
  `$XDG_CONFIG_HOME/git/config` is unverified (recorded only, no machinery; stale-paths §15–§16).
- **Low · two copies of the override in SESSION-PROMPT** (:27–31, :113–117), identical now. Only a
  later docs change, after both stop conditions hold, retires them.
- **Low · the historical patch's "UNAPPLIED" header**, kept byte for byte by Codex's ruling and
  explained in commit 1's body and stale-paths §4.
- **Low · the W exact forms and D2b, D6b and D13b** should be matched to their skill lines by the
  verifier (stale-paths §6.3).
- **Low · Codex's 15-hunk check** has no recorded time or output; the 16-hunk checks supersede it.
- **Deferred follow-ups (Codex, phase 6):** the six checks match fixed text; the D script does not
  check command-running config (`uploadpack.packObjectsHook`, `core.fsmonitor`, filter drivers).
- **Low · T-7** (docs/22:81–84): the retired Figma page's live name is unchecked.
- **Low · INBOX:52–53 and tracker:49–59** typography, left as is (stale-paths §5).

## Left undone, and why

In matrix order (stale-paths §18, as amended in §19 and §20). Each needs its own phase and
permission:
1. **An independent read-only review** of phase 13: F2 as applied, the records, and the denied
   integrate-goal Edit with its recorded text. *(The 09:05Z review covered phase 12.)* *(Phase 14:
   done, the 10:05Z review. Now a fresh independent review of phase 14.)*
2. **The integrate-goal edit** (M-1, L-4) by a writer route Codex decides, then its review.
   *(Phase 14: now stale-paths §21's next skill-edit scope, which adds P13-2 to P13-5 and
   `goal-integrator.md`. Plus the F2 sentence (P13-1), by a writer route Codex names, before
   item 3.)*
3. **Stage and commit** phase 13's files, by exact path, after a fresh `--no-optional-locks`
   inventory. *(Phase 14: phase 14's files too. The inventory records every file's role and
   SHA-256, including the two new finals, whose hashes are UNRUN. Nothing is renamed.)*
4. **Post-commit reads** M16–M18, M20, M21 and the subject lookup; **the rebase** (`git rebase
   main`; on a conflict, `--abort` and stop); then M1–M15, M19 and the post-commit reads again,
   with M22 and M23 once the skill edit lands.
5. **P1 and P2** on the post-F2 file.
6. **W1–W3** (W1 may need the package registry), then **W4–W6** in the DB lane, serialized
   separately; never stop, reset or reconfigure 55321.
7. **D**, once, **blocked** until Codex or the owner decides a route. Straight before it, the
   phase 13 drift check: `git rev-parse main`, recorded as `M_D`, then the five-path
   `git diff --quiet 5fefc31 <M_D> -- …; echo $?` (exit 0 to proceed), and the exact SHA-256 and
   diff of the copy (L4). Afterwards the D pin must equal `M_D`. *(Phase 14, P13-7: that drift
   check, and the integration pin check, are now typed as single commands with no `; echo $?`:
   `rtk proxy git diff --quiet 5fefc31 <M_D> -- scripts/plan .claude/skills docs/plan/GOALS.md docs/plan/status.json docs/plan/ACCEPTANCE.md`,
   with the exit code read from the tool's result; stale-paths §21.)*
8. **The three reviews** (`security-reviewer` with the override text) and **a fresh verifier**.
9. **Integration** under stale-paths §20's *Integration preconditions*, which replace matrix step
   14's (a) and (b): (a) Codex settles its own tracked main-checkout changes; unrelated untracked
   paths stay only if M22's full inventory lists nothing outside the exact tolerated set named in
   the integrator's task, and M23's incoming paths do not overlap it, and nobody stashes, resets,
   cleans, moves or deletes any file; (b) Codex's five-path pin check against the current `main`
   `H` just before the launch, with `H` passed as the expected `MAIN_BEFORE`, which the integrator
   checks before the rebase and again straight before the fast-forward; (b2) on a resume, the
   recorded `MAIN_BEFORE` and result are reconciled before anything changes; (c) the DB lane, and
   possibly the network. This needs item 2 first. *(Phase 14, stale-paths §21:)*
   - M22 includes ignored entries;
   - collisions are compared after NFC normalisation and case folding, and by path prefix;
   - M23 is typed with pinned `H` and `T` and `--no-renames`;
   - (b2) compares the recorded `MAIN_BEFORE` with `H_orig` and covers `main` having moved past
     the tip;
   - the integrator re-takes M22a, M22 and M23 straight before the fast-forward.

   All of these are a plan until the skill carries them.
10. **After the merge:** P3, P3b, P4 and P5 before each later `security-reviewer` launch, and
    later a docs change that retires the override once both conditions hold everywhere.
11. **T-7**, an optional Figma metadata read. **A push** only on the owner's explicit, specific
    authorisation; QA-2 never pushes.

## Found for other goals

- **PL-1.** `.github/workflows/mobile-ci.yml:6` still triggers on pushes to `v2/develop`.
- **Lane S2 (`verify-freeze*.mjs`).** `scripts/backend/verify-freeze-projection.mjs:12` runs `psql`
  in the hard-coded container `supabase_db_fitlog_rebuild_20261017` without the `supabase status`
  API URL check the other runners perform. Low.
- **DS-6.** No app icon is configured (`apps/mobile/app.config.ts`); docs/22 §9 says so.
- **owner-concierge.** INBOX:52–53 typography ("gyms,≥50", "per-gym40%").
- **Whichever goal next owns integrate-goal.** It has no "expected `MAIN_BEFORE`" refusal, so a
  coordinator's pre-launch check has to travel in the task text (matrix step 14 (b)). QA-2 does not
  change the skill for it. *(Phase 13: superseded. Codex ruled that QA-2 makes this change, with
  the tolerated-set rule; the Edit was denied, so it waits on Codex's writer route, *Review
  findings left open*.)*
- **G29 (passport, deferred; the 09:05Z review's L-7).** F1 lists future voluntary passport grants
  as a purpose consent and says no consent opens staff access. PRD :1724–1728's deferred passport
  lets a receiving gym see a member-selected, expiring artifact. G29 needs its own approved scope
  (PRD :1054–1055) before any such access exists. F1, F2 and the absolute rule stay as they are;
  QA-2 changes nothing for it.

## Requests for other lanes' files

- **Coordinator.** Decide the route for the one D run (matrix step 10).
- **Coordinator (phase 13).** Decide a permitted writer route for the integrate-goal edit (M-1,
  L-4). The Edit tool was refused on `.claude/skills/integrate-goal/SKILL.md`. The denied text, as
  typed, is in stale-paths §20, together with the rest the rule needs: the resume section, the
  `MAIN_BEFORE` paragraph, the milestone preconditions, and a consistency line in
  `.claude/agents/goal-integrator.md` ("Main must be clean"), none of them attempted. Until it
  lands, a launch brief cannot make integrate-goal tolerate an untracked path. *(Phase 14: the
  scope is now stale-paths §21's *next skill-edit scope*. It adds ignored entries, the NFC, case
  and path-prefix comparison, `H_orig`, and the re-check straight before the fast-forward. It
  stays the integration blocker.)*
- **Coordinator (phase 14).** Name a writer route for the F2 sentence (P13-1) in
  `.claude/agents/security-reviewer.md`, before phase 13's files are committed. The Edit tool was
  refused. The text as typed is in stale-paths §21. It makes F1's erasure-job exception subject to
  R-4 and treats deletion and retention alike, as an unresolved finding that names R-4.
- **Coordinator.** Put the override into every `/run-goal` and orchestrated `security-reviewer`
  launch until QA-2 is merged **and** the launching checkout is corrected; run and record all six
  checks before each launch.
- **Coordinator.** Before integration, meet stale-paths §20's *Integration preconditions*
  (replacing matrix step 14 (a) and (b)) and step 14 (c), and run D with
  `QA2_BOX3_D19=1` so integrate-goal's MS-7 `--override` form and milestone commit get a recorded
  run, or record why not. They are at :95–97 and :100 in `main`'s unpatched file, as stale-paths
  §6.3 cites them, and at :104–106 and :109 in this branch's file (*inspected*).
- **Coordinator.** Decide whether docs/23 §6 and `goal-integrator.md:25-26` should match the
  Codex practice (`codex/<lane>` branches; `main` merged into a goal branch before the
  fast-forward). QA-2 only recorded the practice.
- **owner-concierge (INBOX).** The first pass moved one section and corrected one row (INBOX:34–36
  note). Unchanged since.

## Decisions forced (for the tracker decision log)

None needs the owner. All are Codex's under AUTH-01, for review:
- **Box 3 reading (phase 2).** `status.mjs next` is future-only and never run; `status.mjs ready`
  is the present-day advisory pick; the verifier rules.
- **Mode detection (phases 3–4).** A session reads `status.mjs` for a `cmd === "next"` dispatch
  line; advisory mode changes no status.
- **When the override may stop (phases 4–5).** QA-2 merged **and** the launching checkout corrected,
  identical to `main`'s, as all six checks decide.
- **One-process no-hook setup (phases 5–6)** for the two clones and D7's `git worktree add`, and
  **pre-clone include checks (phase 7)**. Two related Lows deferred (phase 6).
- **The historical patch kept byte for byte (phase 9)**, with its header explained in commit 1's
  body (phase 11's L5 note).
- **F1 (phases 11–12).** A separate additive patch for the purpose-consent bullet, revised for the
  07:05Z review's L-2 and L-3 and applied before integration.
- **M5 (phase 12): commit then cut.** No copy and no `history.md`; commit 1 keeps the full record.
- **The D pin (phases 11–12).** Five paths (`scripts/plan`, `.claude/skills`, GOALS, status,
  ACCEPTANCE), a drift check before D, and Codex's pin check before launching the integrator.
  *(Phase 13, L-3: the drift check compares `5fefc31` with the actual `main`, `M_D`, read straight
  before D, and the D pin must equal `M_D`.)*
- **The handoff compaction by in-place Write (phase 12)**, accepted by Codex (phase 13).
- **Integration preconditions (phase 13, the 09:05Z review's M-1 and L-4, Codex's ruling).**
  Explicit, pre-existing, unrelated untracked paths may stay only after a read-only full inventory
  and an empty incoming-path overlap, with the exact tolerated set in the launch brief and a
  fail-closed refusal; nothing is stashed, reset, cleaned, moved or deleted. The expected
  `MAIN_BEFORE` is checked before the rebase and straight before the fast-forward, and a resume
  reconciles its record first. In the proof matrix; the skill edit was denied.
- **F2 (phase 13).** A separate additive patch for the 09:05Z review's M-2 and L-1. It keeps
  consent-event retention after erasure open as R-4 under DEC-04 (owner and counsel), decides
  nothing legal, and names the AI entry points and their two exceptions.
- **L-7 deferred to G29 (phase 13).** The absolute privacy rule is unchanged.
- **Phase 14 (the 10:05Z review, Codex's rulings).** P13-1 is to be fixed by one symmetric F2
  sentence that chooses neither retention nor deletion; the Edit was denied. P13-2 is an
  integration blocker until the denied skill correction lands. P13-3 to P13-7 are fixed in the
  records. The matrix is a plan, not executed code.
- **PROGRESS.md:19** stays unticked under its own rule.
- **Tracker appended handoffs** may re-base links, write colliding anchors as words and re-space
  run-together words, each with a dated note.

## Traps hit

The full list is in the previous version of this file. The ones that still apply:
- **An authorisation in the task is not a permission in the harness.** List every command a gated
  sequence needs, and stop on the first refusal: never swap in another tool or form.
- **A form permitted in one phase may be refused in the next** (P1 in phases 8 and 12; `shasum` in
  phase 11).
- **A ruling to update a `.claude/` file is not an Edit permission there.** In phase 13
  `git apply` wrote `security-reviewer.md`, but the Edit tool was refused on the integrate-goal
  skill. Name the writer route together with the ruling. *(Phase 14: the Edit tool was refused on
  `security-reviewer.md` too, for a single sentence, although `git apply` wrote that file in
  phases 8, 12 and 13. `rtk proxy date -u` was refused, although phase 13 ran it twice.)*
- **A suffix is not a role.** `-collected` marks the 09:05Z and 10:05Z reviews, but also phase
  13's own final (0935Z). Record each file's role from its content, and never rename a final.
- **`git log --grep` on a subject also matches a commit whose body quotes it.** Use
  `git log --format='%H %s'` and an exact subject match.
- **An exact allowlist entry may not be enough** for a line that runs a script file with a
  redirect. Settle the route for D before its phase.
- **Applied here is not applied everywhere.** A safety rule must say where the corrected file has
  to be, with a check anyone can run.
- **A same-status write skips the guard it is meant to prove.** Put each guarded form on a real
  status change.
- **A clone or worktree can run hooks before any check after it.** Neutralise hooks for that one
  process, then check every git dir the later commands use.
- **Worktree `status.json` is a branch-time snapshot**, and committed `main` has no QA-2 entry; the
  live status is in the main checkout.
- **A `cd` in a successful command carries over.** Use absolute paths.
- **A whole-file handoff goes into the tracker.** Keep the handoff short and the history in git.
