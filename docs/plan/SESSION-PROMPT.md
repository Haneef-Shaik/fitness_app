# Session prompt: run one goal

> Start a fresh Claude Code session in `/Users/Adya/personals/fitness_app`, then type
> **`/run-goal <ID>`**, for example `/run-goal MB-3`. One goal per session.
>
> The `run-goal` skill (`.claude/skills/run-goal/SKILL.md`) is the procedure. The `goal-implementer`
> agent follows the same skill under the orchestrator. If skills are unavailable, paste everything
> below the line instead, replacing `<ID>` and `<LANE>`.

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
6. **Run the standard gates:** `pnpm check`; `pnpm backend:test` (local Supabase) if the backend,
   domain or data layer changed; the native export if the app changed.
7. **Write the handoff** in `docs/plan/runs/<ID>/handoff.md`, in the skill's format.
8. **Close.**
   - Set the goal to review: `status.mjs set <ID> review`.
   - Have it verified (`verify-goal`).
   - Merge it to `main`.
   - Set it Done: `status.mjs set <ID> done --ref <commit>`. This refuses while a need is open.
   - Append the handoff to the tracker's handoff log, and commit `status.json` and `activity.json`.
9. **Report** what was built, the evidence for each box, what is now ready, and what the next session
   must know.

A goal is **Done** only when every Done-when box has checkable evidence, the verifier passed, and it
is merged to `main`. A milestone is declared only by the procedure in `docs/23` §8.
