I ran the M3 block on the disposable replay. All six authorized commands met their expectations, each runner exit 0, with no refusal, STOP, problem or NOT-met line. This is partial `profile_read` evidence on the replay only. Box 3 is not met, the goal is not Done, and M2, §5, B1, B2 and the 55321 apply are still open.

**Pre-flight (I ran these before the first runner command):**
- The 12 FINAL and four CLI hashes equal the handoff's table, and both CLI `package.json` files read `2.121.0`.
- All nine `node --check` runs exited 0.
- `state.json` was exactly the coordinator's stated state, and there was no lock. A `.*` Glob shows the hidden sentinel, so "no lock" is a real result.
- None of the six evidence names existed.
- I recorded the exclusive writer in `checkpoint.md` before `mutate m3`.

**The six commands (background jobs, one at a time, no timeout, never signalled):**

| Step | Result |
|---|---|
| `mutate m3` | `16a9542b…bb50`, `CREATE FUNCTION`, 0 lines withheld |
| `snapshot m3` | only `P1.fn_definition_md5` changed (`e446cfc1…` to `4ad75fcd…`); I also checked this by hand against `after` |
| `suite m3` (gate: 3474.86 s) | exactly `a deletion-pending account reads no profile` failed, `HTTP 200, 1 row(s)`, exact summary, `banned`, `the m3 expectation is met` |
| `restore-member-active` | `37d4e00b…c904`, `CREATE FUNCTION`, 0 lines withheld |
| `snapshot restored` | no change from `after`; byte-identical to M1's restored file |
| `suite green` (waited at 53.85–82.85 s, ran at 92.85 s) | 27 ok, `banned`; byte-identical to both earlier GREENs (`8d94be72…6d05`) |

The contingency was not needed.

**After the run:**
- All 16 sources and CLI files hash unchanged.
- Final state: mutations `["m1","m3"]`, active and proven `null`, restoredProof `true`, sharedApplied `false`. No stop keys, no lock.
- The replay is still running. 55321 received no SQL and no Supabase command.

**Records:**
- The §8 scan prints exactly its five inventory lines and six tokens, so the inventory is unchanged.
- The new reviewer copy 0205Z (`f52210f4…34f8`) and report copy 0135Z (`c5f39490…5d7f`) are clean and need no row.
- Review 0205Z's lows (SF-1 extended to the M2 stop, and SF-5) stay assigned to the split-first refactor and were not edited.
- I updated `phase2.md` (attempt 7, A7.1–A7.8), `checkpoint.md`, the status row in `phase2-plan.md`, and `handoff.md`. Nothing is committed or staged.

**What I did not verify or run:**
- The pure tests did not run here; the 282/282 pass comes from review 0205Z. I also did not re-check the coordinator's 45-hash and session/lane claims.
- No process check ran, because none was authorized.
- No subagent reviews ran, because the brief forbids them.
- My first command (`rtk proxy ls`) was denied. I did not retry it and used Glob instead.
- I did not run the launcher script that came with the brief, because it starts other lanes' sessions.

**Next, needing its own authorization:** M2 under `banned`. Read `state.json` immediately after `suite m2`, then do the restore and GREEN. That M2 phase must state the M2 rule in its own text.

```
GOAL: MB-1
BRANCH: codex/mb1-identity
HEAD: 2a95726
HANDOFF: docs/plan/runs/MB-1/handoff.md
BOXES: 0/4 Done-when boxes met
STATUS: partial
NOTES: Bounded M3 block complete on disposable replay (6/6 met, exit 0, GREEN 27 ok banned, mutations [m1,m3], no lock/halt, sources unchanged, §8 inventory unchanged); M2/§5/§6/B1/B2 open, nothing committed.
```
