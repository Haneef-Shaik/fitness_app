# CT-1 M1 independent local Claude final

Session 76f2aad6-cdbd-460c-ba7a-7cde8e34ef26; collected 2026-11-01T16:47:03.005054+00:00. Full result text follows unchanged.

**Verdict: COMPLETE, source-only. C0 / H0 / M0 / L0 introduced.** I found no material defects in the M1 cross-version correction. This only says the source change is sound. M1 is not closed at runtime, and CT-1, box 3 and the goal are not accepted.

I used Read 12 times and Grep 10 times, with no errors or denials. I ran, imported and edited nothing.

## What I checked

**Scope.** For all four scripts, the "after" side of `/tmp/fitlog-ct1-m1-review-20261101-diff.txt` matches the working tree line for line. The handoff and checkpoint sections are present (`handoff.md:9`, `:56`, `:130`, `:185`; `checkpoint.md:45`, `:65`, `:81`). I couldn't check the "before" side myself: the directories are untracked and I didn't compute hashes. `build-seed.test.mjs:33` builds its expected SQL at runtime, so it is not stale. No trigger on `public.exercises` and no committed generated seed file could pin the old SQL text.

**1. The id-wide check comes before the lookup and the insert.**
- It sits at `seed.mjs:66-69`, the first statement inside the loop. The `(id, version)` lookup is at `:73` and the insert at `:92`.
- It filters only on `m.id` and `owner_id is not null`, with no version filter. That closes the real gap: the schema's only key is `primary key(id,version)` (`20261017161031_member_core.sql:47`).
- `FOUND` is read straight after the `SELECT INTO` and is reset by the lookup, so it can't carry over between records. When nothing is found, `member_version` is set to null and never used.
- No variable or column names clash: every column is qualified, and no column is called `member_version`.

**2. It fails closed on member rows that already exist.**
- Any member row on that id stops the whole `DO` statement with errcode 23505, whatever its version (lower, higher or the same) and even if it is archived. Nothing is written.
- The error names the lowest version the member holds.
- The same-version backstop at `:75-77` is still there.

**3. Payload, drift and insert-only behaviour are unchanged.**
- `rows`, `payload` and its sha256 are unchanged.
- The drift comparison, `continue`, the single insert with `owner_id` null, and the absence of `on conflict` are all unchanged.
- The new SQL text and header line contain none of the words the existing static scan forbids (`seed.test.mjs:65`).
- Version bumps still work: a catalogue row at `(id,1)` plus the seed at `(id,2)` with no member row still inserts.

**4. The fourth run, `crossVersion`, is wrapped in rollback like the others.**
- It runs: open, setup SQL, the member row planted at `(PROBE_ID, 2)`, then the probe seed with the probe first, then rollback (`verify-seed.mjs:58`).
- The planted row satisfies the foreign key to profiles, the check constraints and the column defaults. psql runs as postgres, so row security doesn't apply.
- Before the fix, this run would have exited 0. It is called between conflict and drift (`:76-78`).
- Twice and drift behave as before. The same-version conflict run still passes its `version 1` pattern, but it is now caught by the new check rather than the backstop. Handoff mutation note 4 records this accurately.

**5. Error detection is exact.**
- `MEMBER_HELD_OTHER_VERSION` (`verify-seed.mjs:25`) is the full message with the probe id substituted. `PROBE_ID` is defined before it, so it is set in time.
- Matching with `includes` on the full text, including " version 2 is held…", correctly rejects version 20, another id, version 1 and the drift error.
- The SQL source contains only the `%` placeholders, so psql echoing the statement can't produce a false match.
- L1, the broader `MEMBER_HELD`/`DRIFTED` patterns, was left untouched, as scoped.

**6. The tests are consistent with the code.**
- **Fake runner:** `kindOf` tests for "Claimed later catalogue version" before "Claimed catalogue key", and neither run's input contains the other's marker.
- **Fake-runner cases:** the four-run order, the version-2-only plant and probe-at-version-1 payload (`:85-98`), a run that exits 0, the near-miss errors, three "other reason" failures, and the new result line. All agree with the code, including the format of `psqlFailure` (`local-stack.mjs:54-57`).
- **Static test (`seed.test.mjs:83-95`):** it matches the check exactly, so deleting the check or scoping it to the seed's version (mutation 8) turns it red. It confirms the order loop → check → lookup → insert and that the backstop is still present. Reporting `rec->>'version'` instead of the member's version would fail both the static match and the version-1 near-miss.

## The concurrency limit, stated plainly

- **Covered:** member rows that are already committed when a record's check runs, at any version.
- **Same-version race:** this still fails closed, through the backstop or the primary key's unique violation (the raw `exercises_pkey` message rather than the seed's own error).
- **Still open:** under READ COMMITTED, a member insert at a *different* version that is uncommitted at check time and commits before the seed does isn't seen. The catalogue and member rows then sit side by side.
- **Not a race, but also open:** after the seed, members can still insert a catalogue id at any version, because the insert policy only checks `owner_id`.

Closing either gap needs the member-side guard in MB-2 (QA-1 F-6), a schema guard or a table lock. That is a prerequisite before box 3 can be accepted. The handoff and checkpoint say this honestly.

**One thing to know (no action needed for M1):** the database runs no longer exercise the same-version backstop at runtime. It is covered by the static test only. This is already documented.

## Minimal follow-ups (none done here)

1. **Runtime gates, all still unrun and open:** the frozen install, `node --test scripts/content/*.test.mjs`, `build-seed.mjs check`, mutation checks 1–8 (with note 4 as revised), and the four rolled-back `verify-seed.mjs` runs on a target the coordinator chooses. I'm not suggesting any other way to run them; the earlier denied sequences stay stopped.
2. **MB-2 member-side guard (QA-1 F-6) or a schema guard,** to close the cross-version race and later member claims.
3. **Still open and out of scope, as named:** M2 (unilateral/bilateral multiplier, band semantics), M3 (wiring the tests into `test`/`backend:test`), L1–L9, OW-13 qualified review, and QA-5/DEC-16 legal evidence.

I make no integration, ledger or Done claim.
