I found nothing that has to change in the patch before your authorised apply. One Medium has to be fixed in the D script before its one-shot run, and the records have four Lows. QA-2 is not Done.

**Evidence limits.** Bash was denied on my first call (`rtk proxy git status`), and I didn't retry it. So I ran nothing, including `git apply --check`. Everything below comes from Read, Grep and Glob. The phase 4 `--check` pass is the implementer's executed result, which I inherited. Nothing was applied, written, committed or launched, and I started no `security-reviewer`.

## Findings

**1 · Medium · `docs/evidence/QA-2/stale-paths.md:652-661`, `:688-689` (residual noted at `:600-604`)**
- **Defect:** the script still doesn't stop before a clone for two sources: active hooks in git's built-in template folder, and an `includeIf` that only matches inside the new clone. Both are accepted as a residual, so the "fail closed before any clone" requirement isn't met.
- **Failure scenario:** `~/.gitconfig` gains `[includeIf "gitdir:/private/tmp/"]`, which sets `core.hooksPath` to a folder with a `post-checkout` hook. In `$D` there is no git dir, so all six pre-clone checks print `not set`. The clone at :689 then runs that hook before :693 can stop it, outside every guard.
- **Two smaller gaps:**
  - `GIT_CONFIG` isn't in the environment checks (:654-656). It changes what `git config` reads, but not what `git clone` reads, so it may hide the effective check at :660.
  - The clone's effective `core.hooksPath` is checked only in `$D/repo` (:693), not in `$D/origin.git`, where D17's receive hooks run.
- **Live today?** I found no source on this machine. `~/.gitconfig` has no `include`, `includeIf`, `core`, `init` or `filter` section. There is no XDG or `/etc` gitconfig. Apple's built-in config sets only `init.defaultBranch`, and its template `hooks/` folder holds only `*.sample` files. So today it fails closed by luck, not by design. I couldn't confirm which git binary or environment Codex will use.
- **Fix:** keep the detection, and change only the two setup clones (they aren't skill commands):
  ```
  mkdir "$D/no-hooks"
  git -c core.hooksPath="$D/no-hooks" clone --template= --bare --no-hardlinks --single-branch --branch main "$MAIN_CHECKOUT" "$D/origin.git"
  git -c core.hooksPath="$D/no-hooks" clone --template= --no-hardlinks "$D/origin.git" "$D/repo"
  ```
  - `--template=` copies no template from any source.
  - `-c` config applies to that one process only, outranks every config file (including any `includeIf`), and isn't written into the clone.
  - Also stop on `GIT_CONFIG`, add `git -C "$D/origin.git" config --includes --get core.hooksPath` to the post-clone checks, and update "What makes it safe" (:597).
  - If you want detection only: stop when `git config --get-regexp '^includeif\.'` exits 0. Only `--template=` closes the built-in template gap reliably.

**2 · Low · `docs/plan/runs/QA-2/checkpoint.md:54-58` (step 14) and `:17-21`**
- **Defect:** step 14 still says `/run-goal` and orchestrated launches need the override "until the patch is applied", with no correction marker. The entry gate still says nobody re-read the main checkout.
- **Failure scenario:** a resuming session reads the checkpoint first, as run-goal §2 says. It takes step 14 as the rule and stops adding the override to MB-1's launch after the apply.
- **Fix:** add a phase 4 D7 marker to step 14. Record in the entry gate that Codex confirmed this cycle that QA-2 is `claimed`. I read the same in live `status.json:84-91`, with QA-1 and AR-1 `done`.

**3 · Low · `SESSION-PROMPT.md:41-42` (P1, P2)**
- **Defect:** P1 and P2 match two exact sentences, so they can't see a reworded consent line that still allows staff access.
- **Failure scenario:** a conflict resolution in a lane worktree keeps the new bullet and also brings back "staff may view member sessions with consent". All four checks pass, and the override is dropped while the agent text still allows a consent gate.
- **Fix:** add a check that the launching checkout's copy is identical to `main`'s:
  - `GIT_OPTIONAL_LOCKS=0 git -C <root> diff --quiet main -- .claude/agents/security-reviewer.md` must exit 0;
  - plus a P3b: `git -C /Users/Adya/personals/fitness_app grep -n -F "A staff read or write gated on consent is a critical" main -- .claude/agents/security-reviewer.md` must exit 0.

**4 · Low · `stale-paths.md:714-716` (D2b), `:775-778` (D13b)**
- **Defect:** both run after a step that already set the same status (claimed → claimed, done → done). `lib.mjs:431` and `:435` skip the needs and Done checks for that, so the result each skill describes is never exercised for these forms (for run-goal :193-194, "It refuses while a need is open").
- **Failure scenario:** the verifier applies "runs means the result the skill describes". Because the script runs only once, fixing this needs another supervised run.
- **Fix:** reorder using skill forms only: D1, D2b, D1 again, D2. After D13, run D6's form again, then D13b (in review → done). Or label both rows "parse and write only" for the verifier.

**5 · Low · `stale-paths.md:708`, `:739` vs `:825-826`**
- **Defect:** D1 and D6b type `node scripts/plan/status.mjs`, where run-plan :44 and :96 write a bare `status.mjs`. The table still says "Each now matches its skill line".
- **Fix:** add one sentence to the table that states this expansion.

## What checked out

- **The five 01:05Z findings:**
  - High 1 is fixed in SESSION-PROMPT, the handoff and stale-paths. Only the checkpoint residue in finding 2 is left.
  - Medium 2: M21, D19's milestone commit, D2b and D6b are in place.
  - Low 3 is fixed apart from finding 1.
  - Low 4: literal paths, `test -f`, and no log file if the script is missing.
  - Low 5: "today" is left only in the header, which `git apply` ignores, and `cmd === "next"` has 0 hits in `scripts/plan`.
- **P1–P4 against the actual files:**
  - Both copies of `security-reviewer.md:21`, in this worktree and in the main checkout, contain the old bullet. They use a straight apostrophe, so P1 and P3 will match.
  - `status.mjs:70` prints `… · state <label>`, so P4's "ends `state Done`" is right.
  - `show` is read-only; only `setStatus` and `appendActivity` write.
  - There is no `~/.claude/agents`, so no user-level agent overrides the project file.
  - Cross-directory sub-agent launches are covered at :49-51 and :70-72 (`goal-implementer` has `isolation: worktree` and the `Agent` tool).
  - The two quotes, :27-31 and :106-110, are identical.
- **Exact skill forms:**
  - M21 matches run-goal :124.
  - D2b matches run-plan :77, and D6b matches run-plan :96 (apart from finding 5).
  - D13b matches run-goal :193.
  - D19 matches integrate-goal :95-97 and :100, and D18 matches :95.
  - D2, D3, D4 and D6 match run-goal :37, :43, :42 and :189.
  - W1–W3 and W5 match integrate-goal :53-55.
  - No command in the four skills is uncovered.
- **The patch:** I recounted the four hunks changed in phase 4 by hand. Their line counts match the headers (`-37,9 +37,11`, `-10,9 +10,15`, `-41,32 +47,34`, `-131,8 +139,9`), and their old sides match the worktree files.
- **Refs and status:** git metadata (`packed-refs`) shows `main` = `c8a5d57`, the branch = `5fefc31`, and the main checkout on `main`. Live status has PL-1 and QA-9 `claimed`, so D18 is expected to be refused.

## Ruling

- **Before the protected apply:** no correction is needed. Re-run `git apply --check` right before applying, as resume step 2 says.
- **Before the D proof:** fix finding 1. Fix findings 4 and 5 now too if you want them, because the script runs only once.
- **Records:** fix findings 2 and 3 before anyone relies on the checkpoint or on P1–P4 to drop the override. Until then, every `security-reviewer` launch, MB-1's included, still needs the override text.
