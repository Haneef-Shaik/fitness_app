# QA-2 · Response to the 06:05Z independent review (correction phase 11, 27 October 2026)

Review: [final-2026-10-27T0605Z.md](final-2026-10-27T0605Z.md), with no Critical or High findings,
five Mediums and six Lows. Phase 11 was Codex's docs-only answer to it, one bounded phase under
AUTH-01. It ran no M, W, D or P command, made no `.claude/` edit, no commit, stage or rebase, and
made no status, GOALS, ledger, `main` or ref change. **QA-2 is not Done.** Box 3 is open, and the D
script has never run. Full record: [stale-paths §18](stale-paths.md).

| Finding | Disposition | Where |
|---|---|---|
| **M1** Box 3 can't close under the current rules | **Resolved in the records.** There is now a remaining-proof matrix with each step's phase, what it needs and who decides it. Routine local commands, the commit, the rebase and the gates are Codex's decision. DB work (W4–W6) is serialized separately. D stays **blocked** after repeated permission denials, with no bypass. An external push needs explicit, specific authorisation. No permission changed | stale-paths §18 *The remaining-proof matrix*; checkpoint *Next step* |
| **M2** No purpose-consent check in the reviewer | **A named follow-up, F1, to apply before integration** (Codex). It is a separate, additive, **unapplied** patch for one `security-reviewer` bullet: separate, append-only AI, gym-link, utility and challenge purpose consents; `CONSENT_REQUIRED`; and no staff private access. `git apply --check` passed on this worktree's corrected file. The historical patch was not touched | [followup-purpose-consent.patch](followup-purpose-consent.patch); stale-paths §18 |
| **M3** No rule for re-running D if `main` moves | **Resolved in the records.** Run D after the commit and the rebase. Pin the `main in the clone:` hash from its log. At integration, re-run D only if `git diff --quiet <pin> <base> -- scripts/plan .claude/skills` exits 1. D was not executed | stale-paths §6.3 "How to run" step 5; §18 |
| **M4** M2's result understated | **Relabelled** "ran; run-plan §1 red condition holds (coordinator state)". No record claims that `main` is green | stale-paths §6.3 M2 row and *Results so far*; §17 *What M2 shows* |
| **M5** The handoff is too large for the tracker | **Not done: blocked.** The history move, `rtk proxy cp -n … handoff.md … history.md`, was denied. Under the phase rule a denied write ends its sequence, with no other writer, so `history.md` does not exist and the handoff was not compacted. It must be compacted before the commit | stale-paths §18; checkpoint *Next step* |
| **L1** "On `main`" versus live files | Fixed. Committed `main` names the branch only in `EXECUTION.md:115`. The status files that name it are live and uncommitted | checkpoint :6; handoff *Traps* |
| **L2** SESSION-PROMPT :16–19 goes false after the merge | Fixed in place, on the same four lines, so no cited line moved. The text is now dated ("stated on 27 October 2026; it holds until QA-2 is merged") and describes any checkout without the correction | `docs/plan/SESSION-PROMPT.md:16-19` |
| **L3** Raw exit codes under a rewriting hook | Fixed in place on :37: run each P check unfiltered, as `rtk proxy <command>`, and judge it by its raw exit status. P5's `git --no-optional-locks` alternative was considered and not taken, with the reason in §18 | `SESSION-PROMPT.md:37`; stale-paths §18 |
| **L4** Hash check and run line are separate commands | Fixed: re-check the exact hash and the diff in the same terminal straight before step 4; on any difference or refusal, do not run | stale-paths §6.3 "How to run" step 4 |
| **L5** The patch's "UNAPPLIED" header goes to `main` | Kept byte for byte, as Codex ruled. It is labelled historical, and the commit-body note text is ready. F1 keeps its state out of its name and header | stale-paths §4 and §18 |
| **L6** Final inventory | Full inventory of the 17 collected finals, the phase 11 files and the goal's diff | stale-paths §18 *Inventory*; handoff *Files* |

**Raw-final hashes: not read.** `rtk proxy shasum -a 256` was denied, first over the 17 finals and
the patch in one command, then in phase 10's single-file form. Under the phase rule the hash
sequence ended there, and no other hash tool was tried. There are no fresh SHA-256 values for the
finals, or for `claude-corrections-UNAPPLIED.patch`, whose last recorded value is phase 8's
`4f9ed884…a382169`. What phase 11 can show is narrower: no Write or Edit in this session touched
any of the 17 finals or that patch.

**D, inspected, is not D executed.** The 06:05Z reviewer's reading of the script (no way out of
`$D` found) is *inspected* evidence. It does not close box 3's executed proof, and no QA-2 record
claims that it does.

**Not independent.** No sub-agent ran, by rule. A fresh review follows.
