# QA-2 phase 4 review (read-only): docs and the unapplied patch

Both earlier Highs and all six Lows are fixed in the docs and the unapplied patch. I found one new High, one Medium and three Lows. The new High: the docs say the privacy override can stop once the patch is "applied", but applying it in this worktree leaves every other checkout with the wrong security-reviewer text. QA-2 is not Done: box 1 is open, box 2 is met only in uncommitted files, and box 3 is open.

## What I checked myself

| Check | Result |
|---|---|
| `rtk proxy git apply --check --verbose docs/evidence/QA-2/claude-corrections-UNAPPLIED.patch`, run once from the worktree root, not applied | Eight "Checking patch …" lines, code-reviewer through run-plan, and no error. The tool reports non-zero exits and reported none. I didn't capture the clock time. This is the first run of the 16-hunk check by anyone other than the implementer. |
| File and hunk counts | Grep finds 8 `diff --git` and 16 `@@` lines (2+2+2+1+4+1+1+3), and no trailing spaces, tabs or CRs. I counted security-reviewer hunk 2 by hand: 18 context + 9 removed + 21 added, so old 27 and new 39. |
| Will it apply on `main`? | The main checkout's copies match the phase 3 old sides at the same line numbers: plan-orchestrator :37–45, run-plan :10–18, :39–72 and :131–138, security-reviewer :15–41. That makes a clean apply likely, not certain: I read the main checkout's working files, not `main`'s committed files, and ran nothing there. |
| Mode-check claim | Searching `scripts/plan/status.mjs` for `status\.mjs next\|cmd === "next"` finds nothing, as the patch says. The dispatch at :102–123 has no `next`. |
| Where the D script's status writes go | `ROOT` comes from the script's own location (`lib.mjs:11–12`), with no environment override. Both files import only Node built-ins. `setStatus` writes only status.json, activity.json and `.plan.lock` next to the script, and `.plan.lock` is gitignored (:35). The expected results for D1, D2, D6, D13 and D18 match the code's rules and its output format. |
| Did a D run reach live state? | Live `status.json:84–91` still shows QA-2 `claimed` by Codex since 2026-10-26T19:00Z. There is no MS-0 entry and no "box-3 proof" text in live status.json or activity.json, and no `/private/tmp/fitlog-qa2-box3.*` folder. That fits "not executed"; the missing folder is weak evidence. |
| High 2: where the override sits | The preamble (:10–43) is above the `---` line (:45). Its quote (:23–27) and step 5's quote (:71–75) are identical, and both match PRD §16.1 (:1050–1053). docs/23:275, docs/README:23 and plan/README:82 all point people to SESSION-PROMPT. The `security-reviewer` launch points (run-goal §7 at :122–127, goal-implementer at :36–38) pass no override, as the preamble says. |
| Box 2 | The ownership text is at docs/09:10–11 and :19–21, uncommitted. |
| M list is read-only | `build.mjs --check` exits at :70, before its only write at :80. The planner commands only read. |

**Commands I ran:** `git status` and `git log` at the start, then the one `git apply --check`. `git status` may have refreshed this worktree's index stat cache, the same caveat as M2; nothing staged changed. A `wc -l` was denied, and I didn't retry it. I read the main checkout's files and live status.json, and changed nothing.

## Earlier findings from the 00:05Z review

| Finding | State |
|---|---|
| High 1 (the D proof) | Fixed in the plan, not run. The script stops before any change it can't confirm is in the disposable clone (details below). |
| High 2 (who gets the override) | Fixed in the docs. It's above the line, says it reaches pasted sessions only, and the three records no longer claim more. The risk itself is still open: the main checkout's `security-reviewer.md:21` still has the consent bullet. New finding 1 is about when that risk ends. |
| Lows 1–6 | All fixed: SESSION-PROMPT :85–88; patch :84 "read or write"; the run-plan mode check plus the plan-orchestrator hunk; advisory mode changes no status; the check records attributed; M20 and M18 match verify-goal :27 and :29, and M2 has its caveat. |

**The D script itself.** It runs as one process with `set -euo pipefail`. The folder-name check also catches a failed `mktemp`. `guard` stops on a wrong directory, wrong top level, extra remote, or a fetch or push URL other than `$D/origin.git`, including URLs rewritten by `insteadOf`. It never runs inside `if`, `&&` or `||`. Every mutating step has a guard; D5 and D15 share one guard across two or three commands, with nothing in between that could change the result. I found no route to the live status.json, `main`'s refs or a real remote. Two edge cases are Lows 3 and 4.

## New findings

**1 · High · `docs/plan/SESSION-PROMPT.md:19–21, :42–43, :69–70`; `handoff.md:153–156, :208–210`; `checkpoint.md:88–91`; `stale-paths.md:152`**
- **Defect:** the override is needed "until the patch is applied" and "optional" after. But `git apply` here changes only this worktree's `.claude/`. The main checkout and every lane worktree keep the consent bullet until QA-2 is merged to `main` and they pick it up.
- **Failure scenario:** the coordinator applies the patch (resume step 2), then follows :208–210 and stops adding the override. MB-1 then runs `security-reviewer` in its own worktree (`codex/mb1-identity`, branched before QA-2), where :21 still says "gym staff see member content only with the member's consent". That reviewer passes a staff read gated on consent, which breaks PRD §16.1.
- **Fix:** change the stop condition in all of these places to: until QA-2 is merged to `main` **and** the `security-reviewer.md` in the checkout or worktree doing the launch no longer has the consent bullet. Add a read-only check before each launch (Grep that file for `only with the member's consent`). This is docs only.

**2 · Medium · `stale-paths.md:380–383` (the box 3 reading), `:401–422` (M list), `:641–647` (D19)**
- **Defect:** the box 3 plan leaves out two commands the skills use today:
  - `git diff main...HEAD` (run-goal:124);
  - the milestone commit `git add … && git commit -m "docs(MS-n): milestone declared"` (integrate-goal:100).

  It also doesn't say how run-plan's live-mode commands count. Those are :77 (`set <ID> start … --ref orchestrator --note "attempt <n>"`) and :96 (`set <ID> review --ref <branch> --note …`); D2 and D6 use different flags.
- **Failure scenario:** the coordinator runs M, W and the one-time D script exactly as planned. The verifier finds these commands with no recorded run and no recorded exclusion. Box 3 stays open, and the D script has to be edited and run again in another supervised phase.
- **Fix:**
  - Add M21: `git diff main...HEAD` in the worktree, after the commit.
  - In the D19 branch, add the integrate-goal:100 command as written, keeping its exit code.
  - Either add run-plan's exact `set` forms to the D script, or list them as covered by D2 and D6 with the reason, for the verifier to rule on.

**3 · Low · `stale-paths.md:546` vs `:550–552` (and the claim at :487–489)**
- **Defect:** the non-bare clone checks out files before the script looks for `core.hooksPath` and active hooks.
- **Failure scenario:** if the global config sets `core.hooksPath` or `init.templateDir` with a `post-checkout` hook, that hook runs at :546. Only then does :550 stop the script, so "no hook can run outside the clone" isn't true for that one hook.
- **Fix:** before the first clone, stop if `git config --global --get core.hooksPath`, `--system --get core.hooksPath` or `--get init.templateDir` returns anything.

**4 · Low · `stale-paths.md:462–465` ("How to run")**
- **Defect:** step 2 relies on the shell variable `$S` set in step 1. That is the carried-shell-state problem High 1 removed.
- **Failure scenario:** if the steps run as separate tool calls, `$S` is empty and step 2 becomes `bash "" > ".log"`. The run fails and leaves an untracked `.log` in the current directory, because `*.log` isn't gitignored. If that directory is the main checkout, run-plan §1 treats `main` as red, and integrate-goal's precondition that the main checkout is clean apart from the two status files fails.
- **Fix:** print the absolute path in step 1, then use that literal path in step 2, with a `test -f` first.

**5 · Low · patch :254–262, :285, :292, :318 (run-plan hunks 1–3)**
- **Defect:** the new text says "every cycle today" and "it does not exist today, so never run it" with no condition. That is the "today goes stale" trap the handoff itself names (:290–291). Also, the switch to live mode triggers on any text match of `status\.mjs next`, not only on the command's dispatch line.
- **Failure scenario:** after O2 adds `next`, live-mode §3 says both "never run it" and "take its answer as final". Or an O2 commit adds a usage line before the `cmd === "next"` branch exists: sessions switch to live mode, step 2's reset runs, and `next` exits 1.
- **Fix:** replace "today" with "while `status.mjs` has no `next` command (see *Modes*)", and make live mode depend only on the `cmd === "next"` line. This changes the patch, so make the edit before the authorised apply and re-run `--check`, or record it for O2.

## Implementer claims I did not verify
- That 11 hunks are byte-identical to the 15-hunk version (I have no copy of the old version).
- That the check ran twice in phase 3; I repeated it once, on the final file.
- That `main` is `c8a5d57`, one commit ahead of this branch.
- Codex's pass on the 15-hunk version.
- That after applying, S1, S5 and S6 leave only `verify-goal:40`.
- Any behaviour of the D script. I reasoned from its text and ran nothing.

## Box 3: how I'd recommend the verifier read it

Box 3 is met when, for docs/23 §7 and every command in the four skills **as they will stand on `main` after QA-2 merges, with the patch applied**, the record holds:
- the exact text that ran, with placeholders filled, no added flags, and `; echo $?` only to show the exit code;
- its exit code and result line.

Where each kind of command runs:
- read-only commands: in the main checkout on `main`;
- the §7 gates: on the QA-2 branch after it is rebased onto `main`;
- mutating commands: once, in the one-process disposable clone of `main`.

What counts:
- **"Runs" means the result the skill describes.** A documented refusal counts. So does a command that only parses because the proof can't create the state it needs, such as `rebase --abort` with no rebase in progress. Record which.
- **`status.mjs next --slots`** is outside the box only because the applied patch labels it future-only and keeps it out of command blocks. It is never run.
- **Run-plan's live-mode commands** exist today, so they stay in scope.
- **"Not run, by policy"** (for example W6 on the shared stack) leaves the box open, unless the verifier accepts a stated substitute and that decision is logged.
- **Before the patch is applied and committed**, the box can't be met, whatever has run, because run-plan :13 and :53 still tell sessions to run `next`.

## Recommended next step
1. **Now, with no file change:** keep putting the override into every `security-reviewer` launch, MB-1's included, until QA-2 is on `main` and that lane's own `security-reviewer.md` has lost the consent bullet (finding 1).
2. **One bounded docs-and-patch phase** with no M/W/D commands and no `.claude/` writes: fix findings 1–4, optionally fix finding 5 in the patch, and re-run `git apply --check`.
3. **Then, as your separate authorised step:** run `--check` again, apply the patch, re-run S1, S5 and S6 over `.claude/`, and update the records.
4. **Then, in order:** commit, rebase, the M list, the W gates, the D script once, the three reviews, and a fresh verifier.

I applied nothing, ran no proof commands, and claim no box as Done.

| Box | State |
|---|---|
| 1 | Open (the patch is not applied) |
| 2 | Met in the working tree only, uncommitted |
| 3 | Open (no commands run; needs the verifier's ruling) |
