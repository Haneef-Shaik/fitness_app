SF-7b's code and tests are done for all four lows, and the full suite passes (301/301). But the mutation runs were blocked, so I couldn't show that the L3 test catches the old bug by behaviour. That leaves the phase blocked rather than ready for verification. No Done-when box is met and nothing is Done.

**What changed (all fixture-tested):**
- **L1:** `shared-snapshot`, `shared-apply` and `shared-suite` now refuse, before any child process runs, a `DOCKER_HOST` that isn't `unix:///…`. The value is never printed. Tested with tcp, ssh, empty, `unix://` with no path, npipe, an upper-case scheme and a leading space. Under `tcp://`, every replay command (including `stop` and `teardown`) still runs as before.
- **L2:** both `docker inspect` calls now say `--type container`. Every 55321 snapshot runs `docker exec` on the database container ID the binding check proved, not its name. If the container is replaced between that check and the exec:
  - `shared-snapshot` fails and records nothing;
  - `shared-apply` stops before `migration up`, with no attempt recorded;
  - after `migration up` it is a STOP.

  Replay snapshots still use the container name.
- **L3:** a staged `migration list` that prints a valid table but exits 1, exits 2 or never finishes is refused before any attempt. The same table at exit 0 still applies. The code was already right, so the new test passed in RED; this was a missing test.
- **L4:** the STOP after `migration up`, and the refusal of any later apply, now point to SF-2's manually authorized read-only path. That path is not written yet. Neither message advises a runner read any more. A test shows that once the container is recreated, `shared-snapshot after`, `shared-apply` and `shared-suite` are all refused.

**Tests (Node v22.23.1):**
- **RED:** run on the 7 affected files: 45 tests, 15 failing, each for its intended reason.
- **GREEN:** 44/45 at first. One existing phase 1F test found the 55321 read by the container's name, so its hook stopped firing once the read went by ID. That was the only test edit made after the code: it now looks for the proven ID, with the same intent. Then 45/45.
- **Final full run, once:** `1..152`, `# tests 301`, `# pass 301`, `# fail 0` (296 + 5 new). I checked all 18 test files for side effects first: they write only to temp folders and use stand-ins for pnpm, psql, Supabase and Docker.

**Not run:** the mutations. Setting up their scratch copy needed `mkdir -p` and six `cp` commands, and all seven were denied. I stopped there, with no in-place edits and no other way of writing the copy. So the R-exit kill by behaviour that you asked for is **not shown**. The only argument for it is by reading: the exit-0 control shows the same table goes on to record an attempt, so without the exit check the failing cases would do the same. `sf7b.md` §4 lists the eight planned mutations and which tests should catch each.

**Still open:**
- M1 needs its own read-only live read: the binding, the Docker context's endpoint, and what listens on 55321/55322.
- L1 checks the scheme only. A `DOCKER_CONTEXT`, the current `~/.docker` context, or another runtime's unix socket is not refused.
- SF-1 to SF-6, B1, B2, box 3 and any shared apply.
- One stale comment of SF-7's in `live.mjs:143-149` (comment only; noted in the handoff, not edited after the final run).

**Records:**
- New record: `sf7b.md`.
- New resume point in `checkpoint.md`.
- `handoff.md` rewritten for this phase. Overwriting it first dropped the SF-7 and SF-0 patch-hash tables, its only record of them; I restored them verbatim.
- The 0905Z review (`c68e01d5…`) is untouched.
- §8 still shows exactly its five inventory lines.
- All 13 changed or new files are under 400 lines.

```
GOAL: MB-1
BRANCH: codex/mb1-identity
HEAD: 2a95726 (uncommitted working tree; nothing staged or committed)
HANDOFF: docs/plan/runs/MB-1/handoff.md
BOXES: 0/4 Done-when boxes met
STATUS: blocked
NOTES: SF-7b L1-L4 fixed test-first (final pure run once: 301/301); scratch mutations denied (mkdir/cp) so R-exit's behavioural kill is unshown; M1 and the live read, SF-1–6, B1, B2 open; no Done claim.
```