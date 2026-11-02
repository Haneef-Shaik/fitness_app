The bounded §3 phase is finished. On the disposable replay, the candidate migration is applied and the 27-check identity suite now passes (GREEN). This is partial evidence for `profile_read` on the replay only: it does not meet box 3 or the goal, nothing touched 55321, and B1 and B2 are still open.

**Pre-flight (all passed):**
- All 12 FINAL file hashes and the 4 pinned CLI hashes match. Both CLI `package.json` files read `2.121.0`.
- The nine `node --check` runs exit 0, and the pure tests give `# tests 282`, `# pass 282`, `# fail 0`.
- The replay's `state.json` was exactly as attempt 4 left it, with no lock and no halt.
- I recorded the exclusive-writer condition in the checkpoint before the first runner command.

**The four runner commands:** each ran as a background job with no timeout, was never signalled, and exited 0.

| Command | Expected | What happened |
|---|---|---|
| `add-candidate --evidence phase2-3-add` | candidate hash `ac262f39…bdc3` | Printed the full `ac262f39fc6962345f64982e36c6b2aa7f8f3418829fd653684002f2f2c1bdc3` |
| `migrate --evidence phase2-3-migrate` | both rechecks; only the candidate applied | Both `# rechecked … migration up` lines (24 pinned files). The only migration applied was `20261026040045_mb1_live_session_guard.sql` |
| `snapshot after --evidence phase2-3-after` | exactly `P2.profile_read.qual` and `P3 +20261026040045` change | Exactly those two. I also checked by hand against the `before` snapshot |
| `suite green --evidence phase2-3-green` | 27 ok, exit 0, `banned` | 27 ok in order, answer `banned`, `the green expectation is met` |

**After the run:**
- All 16 source and CLI hashes are unchanged.
- `state.json` shows candidate `applied`, the new `after` snapshot and a green suite entry. There is no lock, no `stopRecorded` or `m2Stopped`, and `sharedApplied` is false. The replay is still running.

**Things you should know:**
- **Secret scan:** the plan's §8 scan now prints one line, from the review copy `reviewer-final-2026-10-27T0005Z.md:106`. That line quotes the fake test value `sb_secret_fixture-must-never-print-0001`, not a real key. The four new runner files are clean. Before any commit, the review copy needs an exclusion like the one for review 39fe1fb5; I edited nothing.
- **Hidden output:** `migrate` hid 2 lines and I couldn't see what they were. They can't hide another migration being applied, because the runner checks the raw output for those lines.
- **Denied commands:** my first combined command (`git status`/`ls`/`date`) and a test run that wrote to a scratch file were both denied. I didn't retry either in that form. No git command ran, so the HEAD below comes from the session-start snapshot.
- **Review lows:** the review is accepted and its four low findings go to an MB-1 design and refactor phase, which must split the runner before any new runner edit. Clearing a recorded halt will need a fresh independent review plus a separately authorized read-only check of 55321.
- **Not done:** no subagent reviews (the brief forbids them), no code, test, SQL or config edits, and no commits.
- **Stale plan doc:** `phase2-plan.md` is now out of date against this run; I left it unedited because it is outside the docs the brief named.

I recorded the run in `phase2.md` (Attempt 5), `checkpoint.md` and `handoff.md`. The handoff is in `docs/plan/runs/MB-1/`.

```
GOAL: MB-1
BRANCH: codex/mb1-identity
HEAD: 2a95726
HANDOFF: docs/plan/runs/MB-1/handoff.md
BOXES: 0/4 Done-when boxes met
STATUS: partial
NOTES: Bounded §3 complete on disposable replay (4 runner cmds exit 0; GREEN 27 ok, banned); partial profile evidence only, not box 3; B1/B2 open; §8 scan hits fake fixture in review copy :106; nothing committed.
```
