# QA-2 · Response to the 07:05Z independent review (correction phase 12, 27 October 2026)

Review: [final-2026-10-27T0705Z.md](final-2026-10-27T0705Z.md), with no Critical or High findings,
two Mediums and six Lows. Codex accepted it and gave correction phase 12 under AUTH-01: one
docs-and-commit phase, with no sub-agents, no rebase and no M, W or D execution. **QA-2 is not
Done.** Box 3 is open, and the D script has never run. Full record:
[stale-paths §19](stale-paths.md).

| Finding | Disposition | Where |
|---|---|---|
| **M-A** Integration step 14 can't run as written | **Resolved in the records.** Step 14 now has three conditions. (a) Codex settles its own main-checkout files, preserving every file, with no stash, reset, clean or delete. (b) Codex runs the pin check against the current `main` `H` just before launching the integrator, and passes `H` as the expected `MAIN_BEFORE`. The integrator refuses on a mismatch, before the fast-forward. (c) The DB lane (W5) and possibly the network (W1). integrate-goal is not edited: the expected hash goes in the task text | stale-paths §18 matrix step 14 |
| **M-B** M5 has no workable path | **Commit then cut**, as Codex ruled; no copy. Commit 1 keeps the full record. Commit 2 compacts the handoff to its current state, run-goal §9's sections and a pointer to the previous version | matrix steps 3 and 4; the compact handoff |
| **L-1** The override heading reads as "only until merged" | Fixed on the same line | `SESSION-PROMPT.md:16` |
| **L-2** F1 ignores `PRO_REQUIRED` first | Folded into F1: `PRO_REQUIRED` comes first on every AI entry point (003 §3.9, §4.14) | [followup-purpose-consent.patch](followup-purpose-consent.patch) |
| **L-3** F1's purposes are incomplete, and it misses the erasure exception | Folded into F1: every PRD §22.2 purpose, and only the erasure job may delete consent events (003 §3.3). Hunk recounted (`-27,6 +27,16`), `--check` passed, then **applied once** | the same patch; `security-reviewer.md:30-39` |
| **L-4** The D pin covers too narrow a scope | Five paths: `scripts/plan`, `.claude/skills`, GOALS, status and ACCEPTANCE. A new drift check from `5fefc31` runs before D | stale-paths §18 *The D pin rule*; §6.3 step 5 |
| **L-5** Stale inventory; the hashes unmet | A fresh `--no-optional-locks` inventory straight before staging. The blob IDs from `git ls-tree` after commit 1 are the anchor, labelled as the state at commit time | matrix step 4; the compact handoff |
| **L-6** The handoff still has phase 10 instructions | Superseded markers. The compaction removes them from the current file | handoff (commit 1) |

**P1 was denied** after the apply, so P2 was not attempted, and nothing stood in for either check.
**Not independent:** no sub-agent ran, by rule. A fresh review follows.
