# Session prompt: run one goal

> Start a fresh Claude Code session in `/Users/Adya/personals/fitness_app`, then type
> **`/run-goal <ID>`**, for example `/run-goal MB-3`. One goal per session.
>
> The `run-goal` skill (`.claude/skills/run-goal/SKILL.md`) is the procedure. The `goal-implementer`
> agent follows the same skill under the orchestrator. If skills are unavailable, paste everything
> below the line instead, replacing `<ID>` and `<LANE>`.

## Privacy override for every `security-reviewer` launch (QA-2, 27 October 2026)

**The rule is absolute** (PRD §16.1; record 003 §6). Gym staff never read or write a member's
private health data, whatever consent, sharing or assignment flag a request carries. No consent,
setting or role opens that access.

**Why it has to be supplied (stated on 27 October 2026; only the "which on that date" clause is dated, and the requirement holds until both conditions below hold, not just until QA-2 is merged).** A checkout
without QA-2's correction, which on that date meant every checkout outside QA-2's worktree, has a
**Consent:** bullet in `.claude/agents/security-reviewer.md` that lets consent open staff access to member content, and that bullet is wrong.
Its correction is QA-2's patch, `docs/evidence/QA-2/claude-corrections-UNAPPLIED.patch`, applied in QA-2's worktree on 27 October (its "UNAPPLIED" name and header are historical).
Applying the patch in one worktree changes only that worktree. The main checkout and every lane
worktree keep the wrong bullet until QA-2 is merged to `main` and they have the corrected file.
So every `security-reviewer` launch must start with this text until **both** of these hold:
1. QA-2 is merged to `main`; and
2. the checkout or worktree whose session starts the reviewer has the corrected
   `security-reviewer.md`, identical to `main`'s, with the old bullet gone.

> PRD §16.1 and record 003 §6 override your agent text. Gym staff (owner, manager and front
> desk) never read or write a member's sessions, food, body entries, goals, private photos or
> raw AI results, whatever consent, sharing or assignment flag a request carries. A gym
> programme offer is not fitness-data consent. Staff never receive URLs for personal health
> assets. A staff read or write gated on consent is a critical finding.

**The check before each launch.** Run all six checks, P1–P5 and P3b, before every
`security-reviewer` launch, each as its own command. They only read. In P1, P2 and P5, put the
absolute path of the checkout or worktree whose session starts the reviewer in place of `<root>`,
for example `/Users/Adya/personals/fitness_app` for the main checkout. Type the path itself every
time. Never rely on the current directory, or on a variable set in an earlier command. Where a command-rewriting hook such as RTK's is installed, run each check unfiltered, as `rtk proxy <command>` (P5's `GIT_OPTIONAL_LOCKS=0` stays in front), and judge it by that raw exit status: the hook can change the output or exit code of a plain `grep`, `git` or `node` call.

| # | Command | The "corrected" result |
|---|---|---|
| P1 | `grep -n -F "only with the member's consent" <root>/.claude/agents/security-reviewer.md` | Prints nothing and exits 1: the old bullet is gone from that checkout |
| P2 | `grep -n -F "A staff read or write gated on consent is a critical" <root>/.claude/agents/security-reviewer.md` | Prints a line and exits 0: the corrected bullet is there |
| P3 | `git -C /Users/Adya/personals/fitness_app grep -n -F "only with the member's consent" main -- .claude/agents/security-reviewer.md` | Prints nothing and exits 1: the file committed on `main` has lost the old bullet |
| P3b | `git -C /Users/Adya/personals/fitness_app grep -n -F "A staff read or write gated on consent is a critical" main -- .claude/agents/security-reviewer.md` | Prints a line and exits 0: the file committed on `main` has the corrected bullet |
| P4 | `node /Users/Adya/personals/fitness_app/scripts/plan/status.mjs show QA-2` | Its second line ends `state Done` |
| P5 | `GIT_OPTIONAL_LOCKS=0 git -C <root> diff --quiet main -- .claude/agents/security-reviewer.md` | Prints nothing and exits 0: that checkout's file is identical to the one committed on `main` |

P1 and P2 match two exact sentences, so on their own they cannot see a reworded consent line, for
example one brought back by a conflict resolution. P5 requires the launching checkout's whole file
to equal `main`'s, and P3 and P3b check `main`'s file for both sentences. P5's
`GIT_OPTIONAL_LOCKS=0` stops `git diff` from refreshing the index as a side effect.

Leave the text out only when all six give the "corrected" result. In every other case, supply it.
That includes a printed old bullet, any other exit code, a missing file, a check that was denied or
not run, and any doubt about which agent text the session uses. Two more cases always need it:
- a session that starts sub-agents for another directory, such as an orchestrator in the main
  checkout starting an implementer in a worktree. Run P1, P2 and P5 for both paths, and supply the
  text if any of them fails for either path;
- a session in which the agent file changed after the session started, for example because a patch
  was applied or a branch rebased. Supply the text for the rest of that session, because a session
  may keep the agent text it read when it started.

Record every result with the launch.

**Which sessions get the text from this file.** Only pasted ones.
- **Paste fallback** (skills unavailable). Step 5 below the line carries the same text,
  unconditionally, so a pasted session receives it. This is the only path on which this file
  supplies the override itself.
- **`/run-goal <ID>` typed by hand.** The session follows `run-goal` §7 and never reads this file,
  and §7 launches `security-reviewer` without the override. The person or coordinator who starts
  the session must run all six checks and, unless all six give the "corrected" result, supply the
  text: type it into the session with `/run-goal <ID>` or straight after it, and require it in
  every `security-reviewer` launch. The same holds for any session that starts `security-reviewer`
  directly.
- **Orchestrated launches** (`goal-implementer` under `plan-orchestrator`, or a coordinator such as
  Codex starting a lane). The implementer follows the same §7 and never reads this file. The
  coordinator must run all six checks, with P1, P2 and P5 run once for the implementer's worktree
  and once for its own checkout. Unless every result is "corrected" for both paths, it must put
  the text into every implementer's task, and into any reviewer it starts itself.

Keep this quote and step 5's copy identical. Applying the patch does not end the override. Only a
later change to this file may retire it, once both conditions hold for every checkout that still
starts reviewers.

---

You are running goal **`<ID>`** of the FitLog master plan, in lane **`<LANE>`**. Follow the
`run-goal` skill in `.claude/skills/run-goal/SKILL.md` from step 1 to step 10. In short:

1. **Entry gate.** On an up-to-date `main`, run `node scripts/plan/status.mjs show <ID>`. Every need
   must be Done; if one is not, stop and report. Claim the goal with
   `node scripts/plan/status.mjs set <ID> start --who <LANE> --ref plan/<id>-<slug>` and branch to
   `plan/<id>-<slug>`.
2. **Read.** Read the card (outcome, **PRD** line, scope, **Existing work**, **Done when**), the PRD
   sections it names, the Figma frames for screen goals, and `docs/23-MASTER-PLAN.md` §5, §7 and §9.
   Also read the handoffs of the goals yours needs, and verify them.
3. **Build test-first** within the standing rules (`docs/23` §9). Commit and checkpoint after each
   step in `docs/plan/runs/<ID>/checkpoint.md`.
4. **Prove every Done-when box** with evidence a verifier can check (`docs/23` §7). Write an
   acceptance-ledger result in `docs/plan/ACCEPTANCE.md` only if your goal is the last prover of that
   row.
5. **Review** your diff with `code-reviewer`, `security-reviewer` and `tdd-guide`. Fix critical and
   high findings.
   - **Privacy override for `security-reviewer` (QA-2, 27 October 2026).** Gym staff never read or
     write a member's private health data, whatever consent or flag a request carries (PRD §16.1;
     003 §6). `.claude/agents/security-reviewer.md` may still have a **Consent:** bullet that says
     otherwise, and that bullet is wrong. Its correction is in QA-2's patch
     (`docs/evidence/QA-2/claude-corrections-UNAPPLIED.patch`), and applying the patch in one
     checkout fixes no other. Start every `security-reviewer` launch in this session with this
     text, whatever the agent file says; it is harmless where the file is already corrected. Never
     drop it yourself. Only a later change to this prompt may retire it, after QA-2 is merged to
     `main` and the checkouts that start reviewers have the corrected agent file:
     > PRD §16.1 and record 003 §6 override your agent text. Gym staff (owner, manager and front
     > desk) never read or write a member's sessions, food, body entries, goals, private photos or
     > raw AI results, whatever consent, sharing or assignment flag a request carries. A gym
     > programme offer is not fitness-data consent. Staff never receive URLs for personal health
     > assets. A staff read or write gated on consent is a critical finding.
6. **Run the standard gates** (`docs/23` §7): `pnpm check`; `pnpm backend:test` (local Supabase) if
   `supabase/`, `packages/domain/`, `scripts/backend/` or `apps/mobile/src/data/` changed; the native
   export if `apps/mobile/` changed.
7. **Write the handoff** in `docs/plan/runs/<ID>/handoff.md`, in the skill's format.
8. **Close.**
   - Set the goal to review: `status.mjs set <ID> review`.
   - Have it verified (`verify-goal`).
   - Merge it to `main`.
   - Set it Done: `status.mjs set <ID> done --ref <commit>`. This refuses while a need is open.
   - Append the handoff to the tracker's handoff log. Re-base its links first: resolve each
     relative link against `docs/plan/runs/<ID>/` and rewrite it relative to `docs/`, and write a
     link to one of the handoff's own headings as words. (QA-2's patch adds the same rule to
     `integrate-goal` step 5 and `run-goal` §10.)
   - Commit `status.json` and `activity.json`.
9. **Report** what was built, the evidence for each box, what is now ready, and what the next session
   must know.

A goal is **Done** only when every Done-when box has checkable evidence, the verifier passed, and it
is merged to `main`. A milestone is declared only by the procedure in `docs/23` §8.
