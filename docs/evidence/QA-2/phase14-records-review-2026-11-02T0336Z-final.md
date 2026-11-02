# QA-2 phase 14 (records-only correction): independent read-only review

**Verdict: C 0 · H 0 · M 0 · L 2 (both introduced by this phase).** The records match the phase 14 final. P13-3 to P13-7 are now complete written plans, but none of them has been implemented or run. P13-1 and P13-2 are still open Mediums and are listed below as existing blockers, not as findings against this phase. QA-2 is **not Done**. I make no goal, box or integration recommendation while it is blocked.

I used only Read and Grep. I ran nothing, wrote nothing and used no sub-agents. Nothing was denied.

## Denied fixes are still unapplied (checked by reading the files)
- **The F2 sentence:** `.claude/agents/security-reviewer.md:42-43` still reads "Until then, a change that deletes consent events, even in the erasure job, is a finding." F1's exception is still at `:34`. The symmetric sentence was not applied, which matches the 11:05Z final (`:4`).
- **The integrate-goal and goal-integrator edits:** `integrate-goal/SKILL.md` has no ignored-file, `H_orig`, NFC or tolerated-set text. Its `MAIN_BEFORE` is still taken only "Before step 3" (`:39`). `goal-integrator.md:29` still says "Main must be clean." So the next skill-edit scope has not been applied.
- **The privacy rule holds in what I read:** PRD §16.1 (`PRD.md:1050-1053`) and DEC-04 ("no … staff health access", `:1893`) both stand. The denied F2 text (stale-paths `:3019-3026`) would treat deleting and keeping consent events alike, as an unresolved R-4 finding needing DEC-04's external review. It picks neither answer, which fits 003 R-4 (`:1239`, `:160`) and PRD §22.2 (`:1501-1502`). Nothing in the records gives gym staff access through consent.

## Each P13 item

| Item | Written plan | Implemented or run |
|---|---|---|
| **P13-3** | **Adequate**, with Low L-1 below. stale-paths `:3053-3098`: M22 lists ignored (`!!`) entries as well as untracked ones. Paths are compared after Unicode NFC normalisation and case folding, both ways by folder prefix, always (not only when `core.ignorecase` is true). Quoted paths are unquoted, and anything that fails to parse, or exits non-zero, is refused. M23 is `--name-only --no-renames <H>...<T>` with both hashes typed out (M22a and M22b record them), and is typed again as `<H>...<T′>` after the rebase. The fixed "48 paths" is withdrawn. The reads run before the verifier, from the branch's skill text, which fixes the ordering defect. | **UNRUN.** No skill carries any of it. |
| **P13-4** | **Adequate.** `:3100-3123` defines `H_orig` and the resume task carries three items. All three cases are covered: no fast-forward happened (`main` must equal `H_orig`); `main` equals the branch tip (the recorded `MAIN_BEFORE` must equal `H_orig`, and a missing value means refuse); `main` has moved past the tip (refuse, and Codex decides). It says plainly that nothing undoes an earlier fast-forward. Every gap fails closed. | **UNRUN.** It is in the next skill-edit scope only. |
| **P13-5** | **Adequate.** `:3125-3138`: straight before step 3, the integrator repeats M22a (`main` = `H`), M22 and M23 as `<H>...<T′>`, alongside the second `MAIN_BEFORE` check. On a resume it checks against `H_orig` (`:3114`). It is placed in the named skill-edit scope (`:3148`). | **Not implemented.** |
| **P13-6** | **Adequate.** The roles are correct. I read the start of `0935Z-collected.md`: it is phase 13's implementer final ("Phase 13 is finished…"). `1005Z-collected.md` is the review ("independent read-only review"). The records say this at stale-paths `:2954-2960` and handoff `:184-186`. Nothing is renamed, and the two new hashes are marked UNRUN, to be recorded at staging. | The re-taken inventory is the implementer's own *executed* claim. I did not check it. |
| **P13-7** | **Adequate.** `:3154-3174`: the drift check is a single `rtk proxy git diff --quiet 5fefc31 <M_D> -- <5 paths>`. The pin check uses the same form behind the `cd … && rtk proxy` prefix that the 10:05Z review itself accepted. Exits 0, 1 and other each have their own branch. The old `; echo $?` forms are kept, marked as superseded at `:2475-2477` and handoff `:313-316`. D's own run line stays unchanged and blocked. | **UNRUN.** It depends on the blocked D run. |

## Contradictions introduced by this phase

**L-1 · Low · `stale-paths.md:3071-3080` (owner: Codex, through the next QA-2 records phase)**
- M23's expected set is defined as the union of each commit's staged path set. M23 itself is a three-dot net diff. The two can differ:
  - a path changed and later reverted on the branch drops out of the net diff;
  - after the rebase, changes that `main` already has also drop out.
- "The next commit's own set" is singular, but the plan has at least two more commits ahead: the skill-edit route and the stage phase.
- The plan doesn't say what happens when M23's output differs from the expected set: refuse, or only record it.
- The collision check uses M23's actual output, so this doesn't open a safety gap. But the expected value can't be checked as written.
- **Fix:** state that a mismatch is a refusal that Codex rules on, and name every commit whose paths count.

**L-2 · Low · cross-references not updated (owner: Codex, same records phase)**
- §18 matrix steps 5 and 7 (`stale-paths.md:2404`, `:2406`) still say "M22 and M23 (§20)" "once the skill edit lands", with no phase 14 marker pointing to §21 or to M22a and M22b.
- Handoff `:306` repeats this.
- Handoff `:23` still says "Stale-paths §1–§20".
- §20's own marker (`:2861-2863`) and checkpoint step 72 (`checkpoint.md:404`) point to the right place, so this is cross-reference drift, not a conflicting rule.

I found no Critical, High or Medium contradiction introduced by this phase. The 11:05Z final, §21, the handoff and checkpoint steps 71 and 72 agree with each other on these points:
- the F2 Edit and `date -u` were both denied and not retried;
- 4 modified and 7 untracked files after the edits;
- `+6` for `security-reviewer.md`;
- nothing staged;
- `HEAD` still `7a01395`.

## Existing blockers (unchanged by this phase)
1. **P13-1 · Medium · open.** The live F2 text (`security-reviewer.md:42-43`) is one-sided against F1 at `:34`, so in practice it picks R-4's retention answer. Codex owns the writer route, needed before phase 13's files are committed. DEC-04 and R-4 stay unresolved: neither keeping nor deleting is chosen.
2. **P13-2 · Medium · integration blocker.** The committed integrate-goal precondition 2 still refuses on any untracked path. Step 3's `git merge --ff-only` can overwrite an ignored file at an incoming path (expected from git's documentation, not observed). The next skill-edit scope (`stale-paths.md:3140-3152`) needs Codex's writer route, then an independent review.
3. **The D run is blocked**, so box 3 can't close. Its drift and pin checks have never run.
4. **Nothing has run since the edits:** P1 and P2 on the post-F1 or post-F2 file; P3, P3b, P4 and P5; M1–M23, including M22a and M22b; W1–W6; the rebase; staging and commits; the three agent reviews; and the verifier.
5. **Hashes UNRUN** for `0935Z-collected`, `1005Z-collected` and the new `1105Z-collected` (all for the stage phase to record).
6. **Inventory already stale by one file.** The start-of-session git status shows `final-2026-10-27T1105Z-collected.md`, phase 14's own implementer final, saved after the phase. The handoff's 11-path inventory (`:176`) doesn't include it, and it repeats P13-6's naming problem: "-collected" on an implementer final. The planned re-take at staging covers this. It isn't a defect in phase 14's records.
7. **The privacy override** stays in every `security-reviewer` launch until QA-2 is integrated **and** the launching checkout is corrected.

## How I got each item
- **Inspected (Read and Grep):** both collected finals, the start of the 09:35Z final, stale-paths §18 (the matrix and *The D pin rule*) and §20–§21, the handoff, checkpoint steps 70–72, `security-reviewer.md`, `integrate-goal/SKILL.md`, `goal-integrator.md`, PRD §16.1, §22.2, §22.3 and DEC-04, 003 R-4, and GOALS QA-2.
- **Inherited and not checked by me:** every *executed* result in the phase 14 command record, every SHA-256, and the git-documentation behaviour of `--ignored=matching` and of merge overwriting ignored files.
- **UNRUN:** every proof, hash and command listed above.