# Handoff — OW-2 · Register every external launch dependency        attempt 1 · `v2/develop` (uncommitted working tree) · HEAD not read

**Outcome claimed.** None. The dependency register is drafted for review. OW-2 is **not** Done and
is not claimed, because DEC-15 has no dated owner answer.

Prepared on 25 Oct 2026 by a bounded documentation worker under Codex orchestration. The run made
no git operations, ran no commands, contacted no external service and delegated nothing. It wrote
only two files:
- [`docs/evidence/OW-2/dependency-register.md`](../../../evidence/OW-2/dependency-register.md)
- this handoff.

It did not edit GOALS.md, ACCEPTANCE.md, status.json, the tracker, the PRD or any owner pack.

## Done when

| Box | Met | Evidence |
|-----|-----|----------|
| `docs/evidence/OW-2/dependency-register.md` gives every DEC row in [ACCEPTANCE.md](ACCEPTANCE.md) its current state and the proof that will close it | **Not claimed.** Drafted, not verified | Register §1 lists all 25 DEC ledger rows (DEC-01 to DEC-17, including every split row) with gate, decider, writer, current state and closing proof. §2 gives each DEC its missing proof, next action and what stays blocked. goal-verifier has not checked it. |
| DEC-15 is answered: no legacy-user cutover (its ledger row set to `n/a · <reason>`), or a migration goal is added to this plan | **No** | There is no dated owner or technical-lead answer. PRD §27 selects "no automatic old-data migration" as a rule, but that does not say whether actual existing users will be redirected. The ledger row is still `open`, and no migration goal exists. Register §2 (DEC-15) and §3 hold the facts and the answer form. |
| No entry claims an approval, account or licence without dated proof | **Not claimed.** Drafted to satisfy, not verified | Register §6 says every "External proof on record" line is "None", a candidate, or uncommitted local work. The dated items it cites are product rules, owner choices (TECH-01, accent, media-last, the audience answer), and none of them is an approval, account or licence. A verifier must confirm this independently. |

**Unmet: box 2.** Boxes 1 and 3 still need independent verification. OW-2 must not be marked Done.

## Acceptance evidence

| Ledger row | Run (build or environment, date) | Result | Evidence | Row written here? |
|------------|----------------------------------|--------|----------|-------------------|
| DEC-15 (MS-5) | None. Documentation only, 25 Oct 2026 | `open` | Register §2 DEC-15 and §3 | No. OW-2 is the only prover and the writer, but there is no dated owner answer to write |
| DEC-02 (MS-1) | None. Documentation only, 25 Oct 2026 | `open` | Register §2 DEC-02 and §4 | No. OW-3 writes it |

All other DEC rows are written by other goals, and all remain `open`.

## Gates

| Gate | Command | Result |
|------|---------|--------|
| Plan check | `node scripts/plan/build.mjs --check` | Not run. Commands were out of scope, and GOALS.md and ACCEPTANCE.md are unchanged |
| Standard gates | `pnpm check` | Not run. No code changed |

## Inherited and used

| From | Claim | Held? |
|------|-------|-------|
| Tracker PROD-02 (11 Oct 2026) | India is the first public launch; members ship before gyms | Yes, as a selected rule. It is not external proof |
| Tracker TECH-01 (17 Oct 2026) | The owner confirmed Expo + TypeScript | Yes, as an owner choice |
| Architecture 002 (19 Oct 2026) | Supabase is local only; production region, providers and accounts are open | Yes. Not contradicted anywhere |
| OW-1 (`claimed`, another worker) | An owner-dated Momentum tracker entry | Not relied on. Its box is still open |
| Archived OW-2 pack and inbox (10 Oct 2026) | Provider and region recommendations | Recorded as unanswered candidates only. The pack's "go" line is blank |

## Mutation checks

Not applicable. This is a documentation-only owner goal with no guard to break.

## Review findings left open

No reviewer agents ran (delegation was out of scope). The goal-verifier should check the register
against ACCEPTANCE.md row by row.

## Left undone, and why

- **DEC-15 answer.** Only the owner and the technical lead can give it. Register §3 has the three
  questions and both answer forms.
- **The DEC-15 ledger row, a tracker decision entry and the OW-2 status.** These were out of scope for
  this run, and there is no answer to record.
- **Commit.** Git was out of scope.
- **Reading `/private/tmp/fitlog-before-reset-20261011-195638/` and the local Supabase volumes.** These
  are outside the repo. Whether they still exist matters only if DEC-15 Answer B is possible.

## Found for other goals

The details are in register §5. None was fixed here.

- **G-1 · DEC-01.** No owner-lane card holds the trademark search and clearance; DS-6 only records it.
- **G-2 · DEC-12.** No owner-lane card holds obtaining the reference Android device and a real iPhone.
- **G-3 · DEC-02, DEC-08.** Provider contracts and the AI vendor DPA are in no Done-when box.
- **G-4 · DEC-05.** Real-send budgets are in no Done-when box.
- **G-5 · DEC-05 (MS-6) deadlock.** OW-11's box needs the row to pass, but G23 alone writes it and G23
  needs OW-11.
- **G-6 · DEC-02, DEC-07 (MS-6).** The writers OW-3 and OW-10 have no box that sets the row.
- **G-7 · DEC-14.** It is unsettled whether the row may be `n/a` if estimates stay off at launch.
- **G-8 · DEC-17.** The writers G24 and AP-3 do not need their co-provers G29.app and AP-5.

## Requests for other lanes' files

None are required for OW-2. Gaps G-1 to G-8 need card or ledger edits by whoever owns GOALS.md and
ACCEPTANCE.md.

## Decisions forced (for the tracker decision log)

- **DEC-15 (owner + technical lead).** Either "no legacy-user cutover", with a date and what was
  checked, or "cutover", with a migration goal added. Not recorded; the answer is blank.
- **DEC-09 photo policy (owner).** Either a nightly object copy or an explicitly accepted gap. This
  does not block OW-2, but PL-5 needs it before MS-1.

## Traps hit

- **The archived owner packs look like defaults.** The 10 Oct OW-2 pack lists recommendations (Render,
  Resend, Sentry US, "likely Singapore", PITR later, accept the photo gap). Its "go" line and every
  answer except Q7 are blank, and the 11 Oct pack supersedes it. They are recorded as candidates, not
  preferences.
- **Q7's answer is not a region choice.** "our target udience is India/US and Europe all" is
  long-term audience intent. PRD §27 says it is not proof of any hosting or legal decision.
- **"No automatic migration" is not "no cutover".** The PRD rule is about import behaviour. DEC-15's
  ledger row turns on whether real users are redirected, which only the owner can state.

## Exact blockers

1. **DEC-15 has no dated owner and technical-lead answer.** OW-2 box 2 is unmet, so OW-2 cannot be
   Done. That keeps OW-3, OW-4, OW-5, OW-6, OW-8, DS-6 and MS-0 blocked on the board.
2. **Boxes 1 and 3 are unverified.** goal-verifier must check the register against ACCEPTANCE.md and
   confirm that no entry claims unproven approval.
3. **External proof is absent for every DEC row.** All 25 rows stay `open`. This does not block OW-2,
   but it blocks the gates named in register §1. The long lead times that can start now are:
   - DEC-07 field work (OW-9 has no prerequisites);
   - DEC-01 name search and clearance;
   - DEC-04 counsel engagement.

   DEC-05 DLT and Meta verification can start once OW-2 is Done.
