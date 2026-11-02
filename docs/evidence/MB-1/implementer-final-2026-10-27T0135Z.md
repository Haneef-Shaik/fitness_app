The M1 block ran on the disposable replay and every step met its expected result. All six commands exited 0, with no refusal, STOP, problem or NOT met line. This is partial `profile_read` evidence on the replay only: no Done-when box is met, and B1, B2, the 55321 apply and the rest of box 3 are still open.

**What I ran and saw before the first runner command:**
- **Hashes:** the 12 reviewed files and the 4 CLI files all match the recorded values. Both CLI `package.json` files read 2.121.0.
- **Syntax:** all nine `node --check` runs exited 0.
- **State:** `state.json` was exactly as required: candidate `applied`, active `null`, mutations `[]`, ban `banned`, sharedApplied `false`. There was no `stopRecorded`, `m2Stopped` or `sharedApplyAttempted`, and no lock.
- **Exclusive writer:** recorded in `checkpoint.md` before the first runner command.

**The six runner commands** (each a background job, no timeout, never signalled):

| Step | Result |
|---|---|
| `mutate m1` | `sql/m1.sql` matches its pinned hash; `ALTER POLICY` |
| `snapshot m1` | read-only; the only change from `after` is `P2.profile_read.qual`, also checked by hand |
| `suite m1` | 90 s gate passed (3527 s since the last suite). Exactly RED's five profile checks failed, each `HTTP 200, 1 row(s)`; answer `banned`; the m1 expectation is met |
| `restore-m1` | sent the pinned candidate `ac262f39…bdc3` |
| `snapshot restored` | no change from `after`, also checked by hand |
| `suite green` | 27 ok, `banned`, the green expectation is met; the file is byte-identical to attempt 5's GREEN |

- **90 s gate before GREEN:** too soon at 44, 68, 79, 81 and 85 s, so I waited without starting the runner. It ran at 91.99 s. Two readings (79 and 81 s) were first misstated as 86 and 88 s; I caught it before any runner command.
- **After the run:** all 16 source and CLI hashes are unchanged. `state.json` shows active `null`, `restoredProof` true, mutations `["m1"]`, and new `m1` and `green` suites, both ok under `banned`. There is no lock and no stop key, and nothing touched 55321. The replay is still running.

**Review 0105Z's two lows (docs only):**
- **Secret scan:** the §8 scan now prints five lines in three files, not one or two. I kept the command, the patterns and the single exclusion unchanged. Its allowed output is now an exact list in `phase2-plan.md` §8: file, line, token and file hash. Every hit is the committed fake test fixture or the bare prefix in prose; no line holds a key. Any later report saved into `docs/evidence/MB-1` that spells the fixture out needs its own exact row before a commit.
- **Suite spacing:** the 90 s gate before every suite is now written into the plan's rules.

**Not run or not changed:**
- **Your claims, not re-run here:** I did not run the 282 pure tests or recheck all 37 handoff hashes. I re-hashed only the 16 sources and CLI files, the 6 new evidence files, the three files the scan hits and the edited docs.
- **Out of scope:** M2, M3, §5, §6, any git command, and the subagent reviews (no subagents, per the brief).
- **Untouched:** no code, test, SQL or config edits; nothing staged or committed. The four design lows stay with the split-first refactor phase.
- **Denied commands:** a plain `ls` and a compound `git` command, both without `rtk`, were denied and not retried.

**Files changed:**
- six new runner evidence files: `docs/evidence/MB-1/phase2-4-m1-*.txt`;
- `docs/plan/runs/MB-1/phase2.md` (Attempt 6), `checkpoint.md`, `phase2-plan.md` and `handoff.md`.

```
GOAL: MB-1
BRANCH: codex/mb1-identity
HEAD: 2a95726
HANDOFF: docs/plan/runs/MB-1/handoff.md
BOXES: 0/4 Done-when boxes met
STATUS: partial
NOTES: M1 block only on disposable replay: 6 runner cmds exit 0 (M1 met, restore proved, GREEN 27 ok banned); partial profile evidence only; B1/B2/55321 apply/box 3 open; §8 exact 5-line inventory in phase2-plan; nothing committed.
```
