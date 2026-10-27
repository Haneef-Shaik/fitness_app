# QA-9 · Phase 3F outputs: the nine-path stage, and the `--check` that stopped the commit

| Field | Value |
|---|---|
| What | The outputs of phase 3F's staged-set checks, run on the index after `git add` of the nine paths the phase-3E review names. `HEAD` is `4a7ee21`, one commit ahead of `main@2a95726` |
| Who | The phase-3F implementer, a local Claude session under Codex's phase-3F brief (AUTH-01). **These are implementer runs, not independent evidence** |
| Node | `v22.23.1` (`rtk proxy node --version`, run 8), the `.node-version` pin. No Node gate ran in this phase |
| Result | **Stopped before the commit.** `git diff --cached --check` exited 2 with 31 trailing-whitespace lines, all inside the verbatim outputs of phases 3D and 3E. The brief says to stop on a gate failure, so there was no commit and no `pnpm check`. The nine paths stay staged |
| Run numbers | The checkpoint's, under "Commands run in phase 3F" |
| Written | After the stop, uncommitted. This file is untracked and not in the staged set. *(3G: Codex's brief after the stop adds this file to the second local commit's eleven paths. See ratchet-enforcement.md §16)* |

## Run 12: `rtk proxy git diff --cached --stat`, as expected

```text
 .../QA-9/implementer-final-2026-10-27T0035Z.md     |   33 +
 .../QA-9/implementer-final-2026-10-27T0105Z.md     |   38 +
 docs/evidence/QA-9/phase-3d-check-outputs.md       | 1031 ++++++++++++++++++++
 docs/evidence/QA-9/phase-3e-check-outputs.md       |  224 +++++
 docs/evidence/QA-9/ratchet-enforcement.md          |  335 ++++++-
 .../QA-9/reviewer-final-2026-10-27T0135Z.md        |   88 ++
 docs/plan/runs/QA-9/checkpoint.md                  |  225 ++++-
 docs/plan/runs/QA-9/handoff.md                     |  133 ++-
 packages/domain/src/contract.test.ts               |  802 +++++++++++++--
 9 files changed, 2785 insertions(+), 124 deletions(-)
```

## Run 13: `rtk proxy git diff --cached --numstat`, as expected

`contract.test.ts` is at 713 insertions and 89 deletions, as the review expects.

```text
33	0	docs/evidence/QA-9/implementer-final-2026-10-27T0035Z.md
38	0	docs/evidence/QA-9/implementer-final-2026-10-27T0105Z.md
1031	0	docs/evidence/QA-9/phase-3d-check-outputs.md
224	0	docs/evidence/QA-9/phase-3e-check-outputs.md
325	10	docs/evidence/QA-9/ratchet-enforcement.md
88	0	docs/evidence/QA-9/reviewer-final-2026-10-27T0135Z.md
213	12	docs/plan/runs/QA-9/checkpoint.md
120	13	docs/plan/runs/QA-9/handoff.md
713	89	packages/domain/src/contract.test.ts
```

## Run 14: `rtk proxy git diff --cached --check`, exit 2, not as expected

Git printed each finding as a location line, followed by the offending added line. The 31 location lines follow, verbatim. The added lines after them are left out. Each is a Node coverage-table row that ends in `| ` when its uncovered-lines column is empty, such as `ℹ  index.ts              | 100.00 |   100.00 |  100.00 |`. Quoting them exactly would copy the trailing space into this file.

```text
docs/evidence/QA-9/phase-3d-check-outputs.md:112: trailing whitespace.
docs/evidence/QA-9/phase-3d-check-outputs.md:114: trailing whitespace.
docs/evidence/QA-9/phase-3d-check-outputs.md:116: trailing whitespace.
docs/evidence/QA-9/phase-3d-check-outputs.md:120: trailing whitespace.
docs/evidence/QA-9/phase-3d-check-outputs.md:123: trailing whitespace.
docs/evidence/QA-9/phase-3d-check-outputs.md:1007: trailing whitespace.
docs/evidence/QA-9/phase-3d-check-outputs.md:1009: trailing whitespace.
docs/evidence/QA-9/phase-3d-check-outputs.md:1011: trailing whitespace.
docs/evidence/QA-9/phase-3d-check-outputs.md:1012: trailing whitespace.
docs/evidence/QA-9/phase-3d-check-outputs.md:1014: trailing whitespace.
docs/evidence/QA-9/phase-3d-check-outputs.md:1015: trailing whitespace.
docs/evidence/QA-9/phase-3d-check-outputs.md:1018: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:37: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:39: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:41: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:45: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:48: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:93: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:95: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:97: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:98: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:100: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:101: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:104: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:168: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:170: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:172: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:173: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:175: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:176: trailing whitespace.
docs/evidence/QA-9/phase-3e-check-outputs.md:179: trailing whitespace.
```

**What it means.**
- **Where:** 12 lines in phase 3D's outputs and 19 in phase 3E's. All 31 are inside a ```` ```text ```` fence, in the domain coverage table (for example `phase-3e-check-outputs.md:37–48`, read in this phase).
- **Not phase 3F's:** none of the three records phase 3F edited is flagged. Run 9, `git diff --check` of the tracked edits before staging, was clean.
- **Not code:** no test, source or config line is flagged.
- **The trailing spaces are Node's,** in the verbatim output the two implementers copied. Removing them would change that verbatim evidence, so phase 3F didn't remove them. *(3G: Codex then chose to remove them, trailing spaces only, with a note in each file's header. The line numbers above are from before those header rows were added.)*
- **Compared with `4a7ee21`:** phase 3D recorded that commit's `--check` as clean. This would be the first QA-9 commit to carry whitespace findings.

## Run 15: `rtk proxy git status --short`, as expected

```text
A  docs/evidence/QA-9/implementer-final-2026-10-27T0035Z.md
A  docs/evidence/QA-9/implementer-final-2026-10-27T0105Z.md
A  docs/evidence/QA-9/phase-3d-check-outputs.md
A  docs/evidence/QA-9/phase-3e-check-outputs.md
M  docs/evidence/QA-9/ratchet-enforcement.md
A  docs/evidence/QA-9/reviewer-final-2026-10-27T0135Z.md
M  docs/plan/runs/QA-9/checkpoint.md
M  docs/plan/runs/QA-9/handoff.md
M  packages/domain/src/contract.test.ts
```

Runs 16 (`git diff --stat`, no output, so nothing was left unstaged) and 17 (`git log --oneline -2`, `4a7ee21` then `2a95726`) confirmed the stop state before this file was written.
