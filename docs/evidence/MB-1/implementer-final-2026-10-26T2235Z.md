# Collected bounded implementation final

Collected by Codex 2026-10-26T22:32:38.450234+00:00 from local Claude session `158c1cfc-a266-491e-b054-8d63fde9a232`.
This is the implementer report, not an independent verdict. Worker stopped before fresh review.

The correction phase is finished: both findings of the 2026-10-26T2000Z review are fixed and tested. No MB-1 Done-when box is met, and phase 1H still needs its own independent review before any runner or database step. Nothing ran against the database, Supabase, Docker, the CLI or `/tmp/fitlog-mb1-replay-20261026`, and nothing was committed.

**Finding 1, the M2 stop:**
- A complete M2 run whose banned check passed now records the STOP whatever GoTrue answered: `ended`, an unrecognised answer, no answer, or an answer that doesn't match the reference. This includes runs whose output is withheld for a secret-shaped line; that output is still never printed.
- Once M2 has passed, `suite m2` is refused, so M2 counts only its first pass or its stop.
- Any recorded stop blocks `shared-apply`, even after a pass. All 39 orders of up to three M2 runs are tested, in a new test file, `mb1-replay-order.test.mjs`.

**Finding 2, replay `start` and `migrate`:**
- Both now recheck, immediately before the CLI starts and with no await in between:
  - no `SUPABASE_*` variable and no `.env` file;
  - the owned directory (`checkOwnedDir`);
  - the manifest's pins, which must still be the ones read when the command began.
- After `migrate`, the same checks run again. A change there is a STOP saved in `state.json` as `stopRecorded`. Every later command is then refused until you review it and remove that record by hand, as with the lock.
- The tests change the replay config's port to 55322, and seven other things, both during the last check before the CLI and while `migrate` runs, using the mocked executor only.

**Tests:**
- **Baseline:** 120 pass before any edit.
- **RED:** the two changed or new test files first failed to load. With only the two new exports stubbed in, 64 of 75 MB-1 tests passed and 11 failed, each for the intended reason. One of them shows the review's exact hole: `shared-apply` ran to exit 0 on a state holding both a pass and a stop.
- **GREEN:** 75/75. The full `rtk proxy node --test scripts/backend/*.test.mjs` gives **128 pass, 0 fail**, and all nine `node --check` pass.
- **Mutations:** I broke each of the new guards on purpose, 15 in all, and each made a named test fail. One case (M) fails first only on its message, because another guard still refuses the same input.
- **Changed assertions:** a few existing assertions were updated, and each is stricter than before.
- **Hashes:** before and after hashes are in `phase1h.md` §6 and `handoff.md`. `verify-identity.mjs`, its test, the candidate (`ac262f39…bdc3`) and `config.toml` match phase 1G's. The handoff itself hashes to `bb6243e9…28d7`.

**Denied, recorded and not worked around:** a compound `cd … &&` command, `rtk git status`, `rtk proxy date` and `rtk proxy shasum`. Because `date` was denied, the record has no clock times. `rtk proxy sha256sum`, `git status`, `node --test` and `node --check` were allowed. I did not run the Python launcher at the end of your brief, because it would start another agent. The live replay state was not re-observed; the new rules leave its §3 path unchanged apart from two recheck lines that `migrate` now prints.

**Open, all low (`phase1h.md` §7):**
- A run that stops partway after the banned check passed still records no stop, because both the review and your brief said "complete".
- There is no recheck after `start`.
- `diff`, `lint`, `migrations` and `stop` still read the replay config only at the dispatch-time checks.
- A recorded STOP also blocks the read-only `shared-snapshot before`.
- If the live `migrate` writes anything under the replay other than `supabase/.temp` or `.branches`, the new check will halt the replay.

The code changes are in `mb1-replay.mjs`, `mb1-replay-evidence.mjs` and `mb1-replay-order.mjs`, with their tests. The docs are `phase1h.md`, `handoff.md`, `checkpoint.md` and `phase2-plan.md`. `mb1-replay.mjs` is at 788 lines, under the 800 limit.

```
GOAL: MB-1
BRANCH: codex/mb1-identity
HEAD: 2a95726
HANDOFF: docs/plan/runs/MB-1/handoff.md
BOXES: 0/4 Done-when boxes met
STATUS: partial
NOTES: Phase 1H pure-code fix of review 2026-10-26T2000Z's two lows (128/128 pure tests, 15 mutations, hashes in phase1h §6); uncommitted, its independent review is owed before any replay/DB step; B1/B2 open, nothing Done.
```
