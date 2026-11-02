I fixed the 09:05 review's two record lows and wrote the `backend:test` readiness record. My conclusion is that `backend:test` should not run on the shared 55321 stack yet: as written, the test scripts can't prove they cleaned up after themselves, or that they reached the right stack. Nothing ran against Docker, Supabase, a database or the network. No gate, test, commit or rebase ran, nothing was denied, and QA-9 is not Done.

**The two lows**
- **Low 1:** both 09:05 files are now named, with their hashes and the current file list, in the checkpoint and handoff. The stale "only these files are uncommitted" lines are tagged where they stand. Neither 09:05 file was edited, and their hashes match before and after:
  - `final-2026-10-27T0905Z.md` is phase 3M's own final report, saved in the 08:35 cycle under a 09:05 name (`fa75b065…`);
  - `final-2026-10-27T0905Z-collected.md` is the 09:05 review (`1b3a3705…`).
- **Low 2:** a note beside that report in the checkpoint's file index says QA-9 runs its own `backend:test`, serialised with MB-1's database lane, not inside it. The report's line 23 says otherwise and is left as written.

**The decision on the test scripts** (`phase-3n-readiness.md` §1, from reading them)
- **What they get right:** they only write to temporary folders, so no tracked file changes. Every delete is filtered by IDs the run created, so unrelated rows aren't touched.
- **What they can't prove:**
  - a failed delete only prints a "needs attention" line and the run still exits 0;
  - the deletes of the test gyms and one health-data table are never checked;
  - nothing checks afterwards that no test rows remain;
  - a hung request has no timeout, and killing it skips the cleanup;
  - reading `supabase status` can print part of its output, which holds keys, if it crashes;
  - the stack is picked by container name and a configured URL, not a proven identity;
  - every run reuses the same email and gym names, so its rows can't be told from earlier runs'.

  A before-and-after count could detect most of these. It couldn't undo rows left by a kill or stop a key fragment printing, and nobody may clean the shared stack by hand. So a fix comes first.
- **The fix lane:** I named it "backend harness: provable cleanup and a bound target", with six fixes, each test-first. It belongs to S8 (`verify.mjs`) and S2 (the gym and freeze scripts); you'd assign `local-stack.mjs` and the root `backend:test` line. It should merge with MB-1's existing requests for the same files. QA-9 changes none of them. Once the fix lets the target be injected, you could run QA-9's check on a throwaway copy of the stack instead of 55321.

**The refined 3N plan, for after the fix lands** (readiness §2–§4)
- What every step writes and needs, taken from the scripts. Nothing that prints keys was read.
- MB-1's identity check (its open M1 finding), run once in the window, must prove the local Docker endpoint, the typed container IDs and the processes listening on 55321 and 55322. QA-9 keeps no second copy of those commands.
- QA-9's own read-only checks before and after: the file list, which must name every report saved after this phase with its hash; refs; hashes; container IDs and start times; and the database's migration list.
- A count of rows before and after, for each test namespace: test users, profiles, gyms, every gym table (receipts and freezes included), and each workout and health-data table. Every table's total is counted too.
- A cleanup failure counts as a failure even if the run exits 0. No manual cleanup, re-run or seeding. I don't know how clean 55321 is today, so the first count is recorded, not judged.

**What actually ran:** only read-only Git and hash commands, numbered runs 1–13 in the checkpoint, plus one last whitespace check after the final edit. The 285-test local CI proof is inherited from phase 3L. MB-1's identity check, the counts and the gate have not been run by anyone in QA-9.

**Not done:** subagent reviews (the brief forbade them; I self-reviewed instead) and the pasted Python launcher, which would have started other sessions. You now need to review the decision and the plan; the next window is ready only after that.

```
GOAL: QA-9
BRANCH: codex/qa9-quality-ratchets
HEAD: 8b29511381c35b936eb2fe14a148cd21f4dedfed
HANDOFF: docs/plan/runs/QA-9/handoff.md
BOXES: 2/3 Done-when boxes met
STATUS: blocked
NOTES: Phase 3N-prep, records and plan only, uncommitted (2 records edited, new phase-3n-readiness.md; both 0905 finals unchanged fa75b065/1b3a3705); 0905 review accepted (17), Low 1 and Low 2 fixed; decision: backend harness can't prove its cleanup or target, so the named S8/S2 fix lane comes before any 55321 write; refined 3N plan (MB-1 M1 read once, checks before and after, per-namespace counts, cleanup failure counts even at exit 0, no manual cleanup) awaits Codex review; no gate, live command or Done.
```
