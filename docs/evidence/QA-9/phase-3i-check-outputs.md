# QA-9 · Phase 3I outputs: the five-path records commit, and the disposable-clone floor proof, stopped at its first write

| Field | Value |
|---|---|
| What | The outputs of phase 3I: the five-path records commit `961e1f41104e414f045d5a9a42e8e9ca44acf083` on top of `c84bb4cd1639d528779c9cc52e8a1540d0ae1ebc`, and the start of the floor proof's disposable-clone sequence, which **stopped** when `mkdir` was denied |
| Who | The phase-3I implementer, a local Claude session under Codex's phase-3I brief (AUTH-01). Its session ID is probably `0f0d8065-eb22-409e-ae0b-fbe32927ecb9`. That is the last entry in a Glob of this worktree's Claude project folder, which the tool sorts by modification time, and it follows phase 3H's `6a4c540a…` there. That it is this session is **inferred, not confirmed**. **These are implementer runs, not independent evidence** |
| Node | `v22.23.1` (`rtk proxy node --version`, run 4), the `.node-version` pin. Nothing in this phase ran Node code apart from that version print |
| Timestamps | `rtk proxy date -u` was **denied** (run 21). The one timestamp is the records commit's own: committer and author time `2026-10-27T09:39:27+05:30`, which is **04:09:27Z** (run 22). The other runs have no recorded time. Runs 1–12 ran before the commit (run 13), and runs 14–25 after it |
| Result | Records commit as expected: exactly the five paths, staged `--check` clean, a clean tree after it, and `git diff --name-only c84bb4c HEAD` lists the same five. `main` stayed at `c8a5d57`. **The floor proof did not run.** The disposable folder was created and confirmed to be outside every repository. Then `mkdir` of its three subfolders was denied (run 20), and the sequence stopped there, as the brief requires |
| What is not proved | The `HEAD` = `main` gate, the 0 format files, the anchored floor and R19's `HEAD` = `main` state. **None of them was run** |
| Inspected, not executed | The floor file at `961e1f4`, read with `git show` (run 23): its values equal coverage-baseline.md §5. That is a reading, as the 0405 review's was at `c84bb4c`. It isn't the floor proof |
| Cuts | None. Every output below is whole, apart from run 20's and run 21's denial messages, of which the first sentence is quoted |
| Redaction | No output holds a key, token, password or personal data. Nothing was removed |
| Run numbers | The checkpoint's, under "Commands run in phase 3I" |
| Written | After the stop, uncommitted. This file is untracked |

## Runs 1–4: orientation

Run 1, `rtk proxy git status --porcelain=v1 -b -uall`:

```text
## codex/qa9-quality-ratchets
 M docs/plan/runs/QA-9/checkpoint.md
 M docs/plan/runs/QA-9/handoff.md
?? docs/evidence/QA-9/final-2026-10-27T0335Z.md
?? docs/evidence/QA-9/final-2026-10-27T0405Z.md
?? docs/evidence/QA-9/phase-3h-check-outputs.md
```

Run 2, `rtk proxy git log --format=%H%x20%s -4`:

```text
c84bb4cd1639d528779c9cc52e8a1540d0ae1ebc docs(QA-9): record phase 3G results and the 0305 review
557b779f9428b91158335b4370c071d2580d6994 test(QA-9): cover deterministic Git baseline histories
06c822050d7610223bf7b76fd76842a90368fcde test(QA-9): coverage ratchet, gate wiring, exact domain thresholds and Prettier on touched files
c8a5d57c3a0999760ad21fd1aca4899ca76b5adf docs(plan): reconcile three active local Claude lanes
```

Run 3, `rtk proxy git rev-parse main`: `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`. Run 4, `rtk proxy node --version`: `v22.23.1`.

## Runs 5–17: the five-path records commit

The record edits were made with the Edit tool before run 5. Run 5, `rtk proxy git diff --check`: no output. A Grep for trailing whitespace in the three untracked files found no match.

Run 6, `rtk proxy git status --porcelain=v1 -uall`: the same five paths as run 1. Run 7, `rtk proxy git add --` and the five paths, each named: no output.

Run 8, `rtk proxy git diff --cached --name-only`:

```text
docs/evidence/QA-9/final-2026-10-27T0335Z.md
docs/evidence/QA-9/final-2026-10-27T0405Z.md
docs/evidence/QA-9/phase-3h-check-outputs.md
docs/plan/runs/QA-9/checkpoint.md
docs/plan/runs/QA-9/handoff.md
```

Run 9, `rtk proxy git diff --cached --stat`:

```text
 docs/evidence/QA-9/final-2026-10-27T0335Z.md |  43 +++
 docs/evidence/QA-9/final-2026-10-27T0405Z.md |  62 ++++
 docs/evidence/QA-9/phase-3h-check-outputs.md | 404 +++++++++++++++++++++++++++
 docs/plan/runs/QA-9/checkpoint.md            | 158 ++++++++++-
 docs/plan/runs/QA-9/handoff.md               |  68 ++++-
 5 files changed, 717 insertions(+), 18 deletions(-)
```

Run 10, `rtk proxy git diff --cached --numstat`:

```text
43	0	docs/evidence/QA-9/final-2026-10-27T0335Z.md
62	0	docs/evidence/QA-9/final-2026-10-27T0405Z.md
404	0	docs/evidence/QA-9/phase-3h-check-outputs.md
152	6	docs/plan/runs/QA-9/checkpoint.md
56	12	docs/plan/runs/QA-9/handoff.md
```

The two `final-…` files are added whole, at 43 and 62 lines, the same counts Read showed before any edit in this phase. Neither was edited. `phase-3h-check-outputs.md` is 404 lines: the 402 that Read showed before this phase, plus the module-count note's one line and one blank line. Its "Written" tag changed a line already counted.

Run 11, `rtk proxy git diff --cached --check`: no output, so clean. Run 12, `rtk proxy git status --porcelain=v1 -uall`:

```text
A  docs/evidence/QA-9/final-2026-10-27T0335Z.md
A  docs/evidence/QA-9/final-2026-10-27T0405Z.md
A  docs/evidence/QA-9/phase-3h-check-outputs.md
M  docs/plan/runs/QA-9/checkpoint.md
M  docs/plan/runs/QA-9/handoff.md
```

Run 13, `rtk proxy git commit -m "docs(QA-9): record phase 3H results and the 0405 review"`:

```text
[codex/qa9-quality-ratchets 961e1f4] docs(QA-9): record phase 3H results and the 0405 review
 5 files changed, 717 insertions(+), 18 deletions(-)
 create mode 100644 docs/evidence/QA-9/final-2026-10-27T0335Z.md
 create mode 100644 docs/evidence/QA-9/final-2026-10-27T0405Z.md
 create mode 100644 docs/evidence/QA-9/phase-3h-check-outputs.md
```

No hook output. There was no amend, and there's no attribution trailer, like the three commits before it.

Run 14, `rtk proxy git log --format=%H%x20%P%x20%s -5`:

```text
961e1f41104e414f045d5a9a42e8e9ca44acf083 c84bb4cd1639d528779c9cc52e8a1540d0ae1ebc docs(QA-9): record phase 3H results and the 0405 review
c84bb4cd1639d528779c9cc52e8a1540d0ae1ebc 557b779f9428b91158335b4370c071d2580d6994 docs(QA-9): record phase 3G results and the 0305 review
557b779f9428b91158335b4370c071d2580d6994 06c822050d7610223bf7b76fd76842a90368fcde test(QA-9): cover deterministic Git baseline histories
06c822050d7610223bf7b76fd76842a90368fcde c8a5d57c3a0999760ad21fd1aca4899ca76b5adf test(QA-9): coverage ratchet, gate wiring, exact domain thresholds and Prettier on touched files
c8a5d57c3a0999760ad21fd1aca4899ca76b5adf 5fefc31d6d87fab87289c3732888302171f595d4 docs(plan): reconcile three active local Claude lanes
```

Each commit has one parent, so there's no merge commit. Run 15, `rtk proxy git status --porcelain=v1 -b -uall`: `## codex/qa9-quality-ratchets` only, so the tree is clean. Run 16, `rtk proxy git rev-parse main`: `c8a5d57c3a0999760ad21fd1aca4899ca76b5adf`, unchanged.

Run 17, `rtk proxy git diff --name-only c84bb4cd1639d528779c9cc52e8a1540d0ae1ebc HEAD`:

```text
docs/evidence/QA-9/final-2026-10-27T0335Z.md
docs/evidence/QA-9/final-2026-10-27T0405Z.md
docs/evidence/QA-9/phase-3h-check-outputs.md
docs/plan/runs/QA-9/checkpoint.md
docs/plan/runs/QA-9/handoff.md
```

So the new tip differs from `c84bb4c` by those five Markdown files only. No code, test, config, floor or dependency file changed.

## Runs 18–20: the disposable clone, stopped at its first write

Run 18, `rtk proxy mktemp -d -t fitlog-qa9-floor`:

```text
/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6
```

That is the owned disposable folder's literal path. Run 19, `rtk proxy git -C /var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6 rev-parse --show-toplevel`, exit 128:

```text
fatal: not a git repository (or any of the parent directories): .git
```

So the folder is outside every Git repository.

Run 20, `rtk proxy mkdir` with three literal paths inside that folder (`…/empty-template`, `…/empty-hooks` and `…/tmp`), meant to hold an empty Git template, an empty hooks directory and the gate's `TMPDIR`. **Denied** in dontAsk mode. The message's first sentence:

```text
Permission to use Bash has been denied because Claude Code is running in don't ask mode.
```

The brief says that when a runtime rule denies a command or a protected write, the sequence stops and is reported, with no replacement writer and no bypass. So **the clone sequence stopped here.** These were not run: the clone, `main` = `HEAD` in the clone, the install, `pnpm check` and the hash records. The three subfolders weren't made any other way: not with the Write tool, Git or Node. No other command form was tried in their place.

Afterwards, a Glob of the folder found **no file**. It stays in place, as the brief requires: nothing in it was deleted, and nothing was written to it after `mktemp`.

## Runs 21–25: after the stop

Run 21, `rtk proxy date -u +%Y-%m-%dT%H:%M:%SZ`: **denied**, with the same first sentence as run 20. Not retried.

Run 22, `rtk proxy git log -1 --format=%H%x20%cI%x20%aI`:

```text
961e1f41104e414f045d5a9a42e8e9ca44acf083 2026-10-27T09:39:27+05:30 2026-10-27T09:39:27+05:30
```

Run 23, `rtk proxy git show 961e1f41104e414f045d5a9a42e8e9ca44acf083:scripts/quality/coverage-floor.json`:

```text
{
  "source": "docs/evidence/QA-9/coverage-baseline.md, measured 26 October 2026 at 2a95726",
  "mobile": {
    "collectCoverageFrom": ["src/**/*.{ts,tsx}", "!src/**/__tests__/**"],
    "global": { "statements": 12.23, "branches": 10.57, "functions": 10.23, "lines": 18.67 }
  },
  "domain": { "lines": 91.42, "branches": 86.90, "functions": 90.59 }
}
```

**Against coverage-baseline.md §5, read with Read:** mobile statements 12.23, branches 10.57, functions 10.23 and lines 18.67; domain lines 91.42, branches 86.90 and functions 90.59. **All seven values are equal.** This compares values, not bytes: §5 is a Markdown table, and the floor is JSON. The `collectCoverageFrom` scope against §1 wasn't re-read in this phase. Quality test 2 holds both to the floor, and the 0405 review read them equal at `c84bb4c`. That is inherited.

Run 24, `rtk proxy git status --porcelain=v1 -b -uall`: `## codex/qa9-quality-ratchets` only. Run 25, `rtk proxy git rev-parse main HEAD`:

```text
c8a5d57c3a0999760ad21fd1aca4899ca76b5adf
961e1f41104e414f045d5a9a42e8e9ca44acf083
```

So this repository's `main` is still `c8a5d57`, and `HEAD` is the new records commit. Outside the clone, the two differ, as they should.

## What the next floor-proof phase needs

Each of the following is a forecast or a reading. None was run.

- **The folder:** reuse `/var/folders/0s/4k0smcx56zl9hdj404qnz2s80000gp/T/fitlog-qa9-floor.dGGhev2tS6`, which holds no file and is owned. Or make a new one with `mktemp`.
- **The empty template and hooks need one of these. Codex makes the routine choice.** Either:
  - an allowed `rtk proxy mkdir` of the three literal subfolders; or
  - Git's own forms, which need no folder: `git clone --template=` (empty, so no template is copied) and `-c core.hooksPath=/dev/null`, with `TMPDIR` set to the disposable folder itself.

  Phase 3I didn't switch to the second form after the denial. Under the brief, that switch is Codex's decision, not a workaround.
- **The clone:** `git clone --no-hardlinks --branch codex/qa9-quality-ratchets <this worktree> <folder>/clone`, then check that `HEAD` is the exact tip. Then `git -C <folder>/clone checkout -B main <tip>`. No fetch.
- **The install must not run Supabase's install script.** `pnpm-workspace.yaml` lists `supabase`, `esbuild` and `unrs-resolver` under `onlyBuiltDependencies`. In a fresh `node_modules`, pnpm may run `supabase`'s `postinstall`, which downloads the Supabase CLI binary over the network, unless pnpm reuses a cached build from its store. That would break the brief's "no Supabase, no network, no download" rule. **Recommended:** `pnpm -C <clone> install --frozen-lockfile --offline --ignore-scripts`. A Grep of the three `package.json` files found no install or prepare script and no patched dependency, so this skips only those three dependency builds. That `pnpm check` needs none of them is an inference from reading the scripts, not a run. Record it as a difference from CI's install.
- **The gate:** `env TMPDIR=<folder> pnpm -C <clone> check`, once. From reading `touched-format.mjs:98` and `:155-156`, the format step should select **0 files**, labelled `Base: main@961e1f41104e` with no `from` clause, since the fork point is the tip and holds the rule. The 0405 review forecasts the guard naming `main` as the same commit as `HEAD`, with no "floor is not anchored" line. Also expected: 285 tests, domain branches at least 272/313, lines at least 533/583 and functions at least 106/117.
- **If the tip moves first,** for example by committing these records, use the tip current then. The label's commit ID changes with it.
