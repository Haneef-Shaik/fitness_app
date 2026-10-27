# Handoff — QA-2 · Reconcile the docs with the code        attempt 1 · `codex/fitlog-qa2-docs` · commit 2 of correction phase 12, on top of commit 1 `173eff0` (before any rebase)

**Outcome claimed.** The card's named `docs/` files, plus the root README, ORCHESTRATOR and 003's
status labels (scope approved by Codex), agree with `main` and frozen record 003. The `.claude/`
corrections (the historical 8-file patch and follow-up F1) are applied and committed on this
branch. **QA-2 is not Done**: box 3 is open, and nothing is integrated.

**Where the full record is.** This is the compact handoff (M5, commit then cut, Codex's ruling on
the 07:05Z review). The full phase 1–12 record, with every earlier phase's rules, command records,
self-review and denials, is **the previous version of this file**: the commit titled
`docs(QA-2): preserve reviewed reconciliation phase history`. Find it by that subject, which is
unique, because a rebase changes hashes. Before any rebase it is `173eff0`. Stale-paths §1–§19 and
the checkpoint keep their full records too.
[stale-paths.md](../../../evidence/QA-2/stale-paths.md) ·
[checkpoint.md](checkpoint.md) ·
[07:05Z review](../../../evidence/QA-2/final-2026-10-27T0705Z.md) ·
[its response](../../../evidence/QA-2/review-response-2026-10-27T0705Z.md)

## Current state (correction phase 12)

- **Branch:** `codex/fitlog-qa2-docs`, coordinator-created from `5fefc31`. **Never rename it**:
  committed `main` names it in `EXECUTION.md:115`.
- **`main`:** `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf` (*executed*, phase 12 call 4). It is one
  commit ahead of `5fefc31` and changes only `docs/plan/EXECUTION.md` and
  `docs/plan/runs/supervision-2026-10-26T1903Z.md` (the 06:05Z reviewer's git read, *inherited*).
  Not rebased yet.
- **Commits:** commit 1 `173eff04cbf6a9c3384ae02c217ef218ada99f02`, then commit 2, which changes
  only this file (*Commits and integrity anchor*, below). Nothing is pushed.
- **Live status:** QA-2 `claimed` by Codex on this branch (M9, phase 9, *executed* then). QA-2 made
  no status, GOALS, ledger or `main` change.
- **The privacy override** stays in every `security-reviewer` launch: gym staff never read or write
  private health data, whatever consent (PRD §16.1; 003 §6). It stays until QA-2 is merged to
  `main` **and** the launching checkout has the corrected file, identical to `main`'s, as all six
  SESSION-PROMPT checks (P1–P5, P3b) decide. Applying or committing here does not end it.
- **Next:** a fresh read-only review of phase 12, both commits included. Then a separate phase for
  the post-commit reads and the rebase. Then the rest of the matrix (*Left undone*).

## Done when

| Box | Met | Evidence |
|-----|-----|----------|
| `docs/evidence/QA-2/stale-paths.md` records the search (`services/api`, `uv run`, `jest.config.js`, `docs/1[0-9]-`, `Maestro`, `config.py` …) and every hit is fixed or labelled historical | **yes, committed on the branch; not integrated** | [stale-paths.md](../../../evidence/QA-2/stale-paths.md): searches S1–S10 (§2), dispositions (§3.1–§3.6), re-runs (§7). In the named `docs/` files and the approved extension, every hit is fixed, labelled or accurate. In `.claude/`, 20 findings (C1–C10, C12–C21) are in the historical patch, applied in phase 8 (*executed*: SHA-256 `4f9ed884…a382169` before the check and before the apply; `git diff --stat -- .claude` exactly 8 files), and F1 adds the purpose-consent bullet (phase 12, *executed*). After the apply, S1, S5 and S6 over `.claude/` find only `verify-goal:40` (accurate), and S2–S4 and S8 find nothing (*inspected*, Grep). Commit 1 carries it all, so `git diff main...codex/fitlog-qa2-docs` now shows it |
| The tracker states that the board owns goal status and [ACCEPTANCE.md](../../ACCEPTANCE.md) owns acceptance results | **yes, committed on the branch; not integrated** | `docs/09-PROJECT-TRACKER.md:10` "Goal status · **Owned by the plan board** … This tracker does not hold goal status"; `:11` "Acceptance results · **Owned by plan/ACCEPTANCE.md** … This tracker does not hold acceptance results"; prose at `:19-21`. In commit 1 |
| Every command in docs/23 §7 and in the skills runs on `main` as written | **no** | **Run:** M19 (phases 7 and 8), M1 and M3–M15 (phase 9) and M2 (phase 10), all *executed* on `main` `c8a5d57` **before any commit**. M2 is labelled "ran; run-plan §1 red condition holds (coordinator state)". **Not run:** M16–M18, M20 and M21 (post-commit), every M re-run after the rebase, W1–W6, and the D script (the disposable-clone proof of the mutating skill commands, D1–D19), which has **never run**. Its run line was refused in phases 9 and 10, the second time with its exact text on the allowlist, and it is **blocked** until Codex or the owner decides a route. A reviewer's *inspected* reading of D does not close this box. **Box 3 reading** (phase 2, Codex): `status.mjs next --slots …` is future-only and never run; a session finds its mode by reading `status.mjs`'s dispatch. The verifier rules on that reading. Plan: stale-paths §6.3 (M1–M21, W1–W6, the script), the matrix in §18 as amended in §19 |

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
| P1 and P2 | `rtk proxy grep -n -F "only with the member's consent" /Users/Adya/.codex/worktrees/fitlog-qa2-docs/fitness_app/.claude/agents/security-reviewer.md`, and P2's sentence | **Phase 12: P1 denied, P2 not attempted**, and nothing stood in for them. Last run: phase 9, on the file before F1 (P1 no output, exit 1; P2 line 28, exit 0). F1's bullet contains neither sentence |
| Historical patch apply, phase 8 | `git apply` on `claude-corrections-UNAPPLIED.patch`, between two equal SHA-256 reads | **Applied** (*executed*): 8 files, `93 insertions(+), 43 deletions(-)`. Do not apply it again |
| Reviews | `code-reviewer`, `security-reviewer`, `tdd-guide` on `git diff main...codex/fitlog-qa2-docs` | **Not run**: no sub-agents, by Codex's phase rules. The self-review in the previous version is not independent |

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
  no copy and no second file was made. Codex's word was "Edit"; this is an in-place edit of this
  one file, and the review should say if it wanted the Edit tool itself.

## Inherited and used

| From | Claim | Held? |
|------|-------|-------|
| Codex's phase 12 task, with its 08:04Z post-reset reconciliation | Acceptance of the 07:05Z review and the rulings in stale-paths §19; the earlier attempt `bf4fef77` stopped at an account limit with no change, test or commit | Recorded as Codex's (*inherited*) and followed. The worktree matched phase 11's inventory plus the two new finals (call 1), which agrees with "no changes" |
| The 07:05Z review | The main checkout `main…origin/main [ahead 50]`, 4 modified and 29 untracked; `EXECUTION.md` and `runs/local-supervision.json` modified there | *Inherited*: phase 12 did not read the main checkout. It is the reason for matrix step 14 (a) |
| The 06:05Z review | `c8a5d57`'s parent is `5fefc31`, and it changes only two coordinator files | *Inherited* (its git read). M16 is still QA-2's own post-commit read |
| Phases 9 and 10 (*executed* then) | M1–M15 on `main` `c8a5d57`; M9 shows QA-2 `claimed`, with QA-1 and AR-1 Done | Not repeated in phase 12, by rule. They predate both commits |
| Phases 8–10 (*executed* then) | The D copy at `/tmp/fitlog-qa2-script.9wBgD5/qa2-box3-proof.sh`, byte-identical to the block, SHA-256 `1e64c8653b662967285123bd5f0f7319fb5ddbd5326cc2614a6a8e8f0cfe92e5` | Not re-read in phase 12. Re-check it straight before any run (L4) |
| Phase 8 (*executed* then) | The historical patch's SHA-256 `4f9ed884360edfbb8f32142264c3ad068aeaaddb3ead298ff2f7fc2a9a382169` | Not re-read; its blob ID at commit 1 is above |
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
- **Low · F1 changed after its review.** L-2 and L-3 were folded in before the apply, so the
  ten-line bullet (`security-reviewer.md:30-39`) has had no independent read yet.
- **Low · P1 and P2 not re-run after F1.** Phase 12's P1 was denied, as phase 8's was. P3, P3b,
  P4 and P5 have never run.
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

In matrix order (stale-paths §18, as amended in §19). Each needs its own phase and permission:
1. **A fresh read-only review** of phase 12: both commits, F1's new text, and the compaction diff.
2. **Post-commit reads** M16–M18, M20 and M21; **the rebase** (`git rebase main`; on a conflict,
   `--abort` and stop); then M1–M15, M19 and the post-commit reads again. Codex moved these to a
   separate phase after the review.
3. **P1 and P2** on the post-F1 file.
4. **W1–W3** (W1 may need the package registry), then **W4–W6** in the DB lane, serialized
   separately; never stop, reset or reconfigure 55321.
5. **D**, once, **blocked** until Codex or the owner decides a route. Straight before it: the
   five-path drift check from `5fefc31` (exit 0 to proceed), and the exact SHA-256 and diff of the
   copy (L4). Then record the D pin.
6. **The three reviews** (`security-reviewer` with the override text) and **a fresh verifier**.
7. **Integration** under matrix step 14's three conditions: (a) Codex settles its own main-checkout
   files, preserving every file; (b) Codex's five-path pin check against the current `main` `H`
   just before launching `goal-integrator`, with `H` in the task as the expected `MAIN_BEFORE`,
   which the integrator refuses on if it differs; (c) the DB lane, and possibly the network.
8. **After the merge:** P3, P3b, P4 and P5 before each later `security-reviewer` launch, and later
   a docs change that retires the override once both conditions hold everywhere.
9. **T-7**, an optional Figma metadata read. **A push** only on the owner's explicit, specific
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
  change the skill for it.

## Requests for other lanes' files

- **Coordinator.** Decide the route for the one D run (matrix step 10).
- **Coordinator.** Put the override into every `/run-goal` and orchestrated `security-reviewer`
  launch until QA-2 is merged **and** the launching checkout is corrected; run and record all six
  checks before each launch.
- **Coordinator.** Before integration, meet matrix step 14 (a)–(c), and run D with
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
- **PROGRESS.md:19** stays unticked under its own rule.
- **Tracker appended handoffs** may re-base links, write colliding anchors as words and re-space
  run-together words, each with a dated note.

## Traps hit

The full list is in the previous version of this file. The ones that still apply:
- **An authorisation in the task is not a permission in the harness.** List every command a gated
  sequence needs, and stop on the first refusal: never swap in another tool or form.
- **A form permitted in one phase may be refused in the next** (P1 in phases 8 and 12; `shasum` in
  phase 11).
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
