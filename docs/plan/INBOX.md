# Owner inbox — external dependencies only

## Local execution — 25 October 2026

Codex coordinates the authenticated local Claude workers. Cloud is a fallback if local execution
cannot work. Current handoff: [EXECUTION.md](EXECUTION.md). Status on the board remains authoritative;
prepared evidence is not a completed goal.

- **DEC-15 / OW-2:** answered 25 Oct 2026. The owner confirmed a fresh launch: "no existing users or
  data will be redirected" (tracker MIG-01). The DEC-15 ledger row reads `n/a`, and no migration goal
  is needed. Historical snapshots and volumes are preserved; no deletion or migration is authorised.
  Nothing more is needed from the owner on DEC-15. The
  [dependency register](../evidence/OW-2/dependency-register.md) independently passed all OW-2 boxes
  and was integrated on local main (`b4771d0`); OW-2 is Done.
- The register maps all DEC-01–DEC-17 rows to their goals and gates. External accounts, legal review,
  licensing, device tests and pilot evidence remain open until actual proof is supplied.

## Delegated technical decisions — 26 October 2026

The owner explicitly delegated final product and engineering decisions to Codex (tracker AUTH-01).
Codex approved architecture record 003 under ARCH-01, the independent verifier passed all four AR-1
boxes, and AR-1 was integrated on local `main` at `73e3f63`. AR-1 is Done. No personal architecture
approval is requested.

The integration gates all passed: 185 tests in `pnpm check`; 39 guard tests and the four backend
integration and isolation suites; all 8 persisted schemas matching; the exact shared TypeScript/SQL
fixture; a 15-migration replay with a strict empty schema diff; and both platforms' JavaScript
exports. [Final verdict](../evidence/AR-1/verdict-attempt-1.json),
[integration proof](../evidence/AR-1/integration-gates.md).
Codex chooses and assigns the next dependency-ready work to Claude. External proofs in the table
below remain real-world requirements; no account, licence, device or pilot result is invented by
delegation.

*(QA-2, 27 October 2026: moved here from below the archived snapshot, with its run-together words
separated and lightly reworded for readability, for example "ADR003" now reads "architecture record
003" and "the table above" reads "the table below". No fact, figure or link is changed.)*

**Updated:** 11 October 2026 after owner-delegated product decisions. Current source: PRD v2.1 and
PROD-01–PROD-12. The trainer role/private gym health access is removed; routine product questions
are resolved. Statuses remain in status.json and were not changed by the documentation edit.

## Current actions

| Task | External proof needed | Milestone / goal |
|---|---|---|
| Platform/accounts | Actual hosts/identity/storage/SMTP/regions/keys/backups, not a claimed legacy deployment. The architecture and API contract are already frozen (AR-1 Done; record 003), so no owner action is needed for them | M1; OW-2/OW-3/PL goals |
| Brand/store/signing | Final cleared name/fonts/assets, store accounts/signing and reviewer evidence | M2/M5; DEC-01/16, OW-4/DS-6 |
| Phone and approved utility messaging | +91 OTP delivery, required registrations/templates, explicit real-send budgets | M4/M6; OW-5/OW-11 |
| Member Pro | Actual localized price/SKUs/trial/store sandbox and webhook tests | M4; OW-7/G15 |
| Legal/qualified review | Real terms/privacy/gym notice/DPA/financial retention/tax/estimate review; adult only and private personal fitness are selected | M5/M6; OW-6/DEC-03/04/14 |
| Content/AI/device evidence | Licensed seed/font content, measured AI quality/cost caps, supported-device/release accessibility and performance proof | M3–M5; DEC-08/12/16 |
| Pilot field work | Five signed India gyms,≥50 eligible adults/gym,≥20 baseline expiry cases, frozen metric protocol and reviewed actual registers | M6; OW-9/OW-10 |
| Pilot gate | Ten weeks; per-gym40% link/25% logging/minimum samples,≥5 percentage-point renewal gain in≥3/5,≥2 willing owners, verified security/cost | M7; OW-12 |
| P2 providers/licenses | Actual collections/calling approvals; barcode/map/media licenses when due. No PT/coaching/trainer scope | M7–M9; DEC-10/11/16 |

Each external decision (DEC-01–DEC-17) now has a row in [ACCEPTANCE.md](ACCEPTANCE.md) naming its
owner goal and the milestone gate that waits on it (25 October reconciliation).

OW-1 records selected Momentum direction, not a request to choose UI again. OW-2 is actual external
launch readiness. Read current owner packs, PRD27 and tracker; do not answer historical Q21–Q33 or
follow deleted code paths as current tasks. No provider, message or purchase was provisioned here.

## Historical inbox snapshot — 10 October 2026

The former inbox is retained below solely as historical context. Its goal counts, main-branch state,
question numbers, vendor estimates, approvals/defaults and deleted document/code paths are not live
instructions. Current actions above and PRD v2.1 override them.

<details>
<summary>Archived pre-decision inbox</summary>

# Owner inbox

**Updated:** 10 Oct 2026, by owner-concierge, after the orchestrator's first advisory cycle.
**Where things stand:**
- 94 goals: 0 done, 0 running, 4 ready, 90 blocked.
- All four ready goals are yours, so no agent has anything to start.
- `main` is clean at `d08a4d1`. No STOP file.

**The short version.** Answer the two decision packs, OW-1 and OW-2. That takes one sitting of
about 35 minutes. All 90 blocked goals wait on at least one of the two. Answering them opens these
next:
- agent goals: QA-1 and DS-6;
- your goals: OW-3, OW-4, OW-5 and OW-8.

**One thing to know.** The orchestrator still runs in *advisory mode*: O2 is not built yet, so it
reports what it would start and starts nothing (ORCHESTRATOR.md §11). After OW-1, QA-1 is ready. Run
it yourself in a session with `/run-goal QA-1` until O2 exists.

---

## 1 · Do these first

### OW-1 · Choose the UI direction (84 goals wait on it)

**What to do**
1. Open `docs/plan/owner-packs/OW-1.md`.
2. Read the five questions:
   - Momentum;
   - the Coach OS parts;
   - no green;
   - navigation;
   - the volt lime accent.
3. Write **go** at the top, or change any **Answer:** line.
4. Tell a session "OW-1 is answered". It writes decision **D47** into `docs/09-PROJECT-TRACKER.md`
   §6, which supersedes D9.
5. Read the D47 row once.

**When it is done:** D47 is in the charter with one line per question. Then you tick the goal:
`node scripts/plan/status.mjs set OW-1 done --who You`, or the board
(`node scripts/plan/serve.mjs`, then http://127.0.0.1:4317). A session can write D47 for you, but
ticking Done is yours.

**Default if you say "go":**
- Momentum;
- keep only three Coach OS rules on `main` (48 dp targets, Reduce Motion on press, the default stack
  animation); the rest stays on branch `codex/coach-os-redesign`;
- no green anywhere;
- Today · Train · Food · Progress · Gym, with a floating action button;
- volt lime `#C6F432`.

**What it opens:** QA-1, the first agent goal (a clean `main`), then MS-0. With OW-2 it also opens
DS-6.

### OW-2 · Make the launch decisions (66 goals wait on it)

**What to do**
1. Open `docs/plan/owner-packs/OW-2.md`.
2. Read its ten questions:
   - the host;
   - email;
   - barcode;
   - launch scope;
   - the name;
   - point-in-time recovery (PITR);
   - the Sentry region;
   - photo backups;
   - the paid tier (D33 closes L6);
   - Android and iOS together or not.
3. Write **go** at the top, or change any **Answer:** line.
4. Start the name search in Q5 today. It takes 1–2 weeks to be sure, and the icon waits on the name.
5. Tell a session "OW-2 is answered". It records the answers:
   - in `docs/PRD.md` Phase 0;
   - the real decisions also in charter §6, as D48 onwards.

**When it is done:** every Phase 0 row in docs/11 has an answer. Then you tick it:
`node scripts/plan/status.mjs set OW-2 done --who You`, or the board.

**Default if you say "go":**
- Render, with Supabase in the same region near India;
- Resend for email;
- barcode in v1.1;
- nothing more moves into the launch;
- "FitLog" if the search is clear;
- PITR on for production once there are users;
- Sentry in the US region;
- accept the photo-backup gap for v1;
- D33 closes L6;
- Android and iOS together.

**What it opens:**
- OW-3, the platform accounts;
- OW-4, the store accounts;
- OW-5, DLT and Meta, which takes weeks;
- OW-8, the beta testers;
- DS-6, together with OW-1.

### OW-9 · Field validation for gyms, G12 (31 goals wait on it)

This is field work, not a decision. It takes three weeks or more, and every gym goal waits on it.
Start the slow parts now.

**What to do** (docs/PRD.md §4 G12)
1. **Book counsel this week.** Getting started takes 2–4 weeks (docs/PRD.md §9). Ask them to cover:
   - the invite and consent flow;
   - the gym terms and data processing agreement (DPA);
   - the enrolment notice;
   - minors (Q28, Q33);
   - a written opinion on AI calling.
2. **Interviews:**
   - 20–30 gym owners and 30–50 members;
   - use the questions in `docs/PRD.md` §14.6;
   - ask what they did last month, not whether they would use it;
   - keep the notes in `docs/research/R4-validation/` (local files only).
3. **Recruit five gyms** in one cluster (R3 §11.3). Sign the pilot terms and record each gym's
   baseline: last year's renewals and joiners.
4. **Run a two-gym concierge pilot**, using today's FitLog and a sheet (docs/PRD.md §4 G12 step 5).
5. **Pre-sell Owner Pro** at the indicative price (docs/PRD.md §9).
6. **Answer Q21–Q33**, or accept their defaults in writing. They are in docs/PRD.md §17, "Open
   questions"; docs/23 §11 says §16, which is the risks section.

**When it is done:** the interview notes, the counsel memo (with the copy marked "approved"), five
signed gyms with baselines and the pre-sell results are all in `docs/research/`. Then:
`node scripts/plan/status.mjs set OW-9 done --who You`.

**Default if you say "go":** there is no default for field work. If you want, the next inbox run
can prepare an interview template and a one-page brief for counsel as owner packs.

**What it opens:** OW-10, the go/no-go memo. That also needs AI-2, the food-AI accuracy test, which
an agent runs after QA-1 and OW-3.

### OW-13 · Skim the drafted exercise instructions (14 goals wait on it)

238 "How to do it" texts were drafted and spot-checked, but nobody has read them all (docs/11
Phase 6).

**What to do**
1. Open the files in `services/api/app/seed/exercise_library/`:
   - `barbell.py`, `dumbbell.py`, `machine.py`, `cable.py`, `bodyweight.py`, `kettlebell.py`,
     `band.py`, `cardio.py` and `other.py`;
   - skip `history.py`, which holds the older exercises.
2. Read each `instructions` text. Each should be 2–4 plain sentences: the set-up, the movement, and
   one cue that prevents the most common mistake.
3. Write any fixes as one list: the exercise name, what is wrong, and the fix. A good place is
   `docs/plan/owner-packs/OW-13-corrections.md`.

**When it is done:** the list exists for S4, or "no changes" is recorded in the tracker
(`docs/09`). Then: `node scripts/plan/status.mjs set OW-13 done --who You`.

**Default if you say "go":** no default. A human read is the whole point. If time is short, read
`barbell.py` and `dumbbell.py` (the most used) and record honestly "spot-checked barbell and
dumbbell, no changes".

**What it opens:** QA-5, the store forms, together with its other needs.

---

## 2 · Decisions

### The launch and UI decisions (OW-1, OW-2)

Every question, with its options, recommended default and one-line consequences, is in the two packs:
- `docs/plan/owner-packs/OW-1.md`: 5 questions;
- `docs/plan/owner-packs/OW-2.md`: 10 questions.

Each has an **Answer:** line to fill in.

### Orchestrator setup (ORCHESTRATOR.md §12, O0)

These do not block any goal on the board. They must be answered before the orchestrator can run on
its own (phase O5). Answer them by telling any session; it writes them into ORCHESTRATOR.md §12.

**1. How agents sign in to Claude**

| Option | Consequence |
|---|---|
| **A. A subscription token** (`claude setup-token`, then `CLAUDE_CODE_OAUTH_TOKEN`) | **Suggested default.** No per-token bills. When a usage limit is hit, the run pauses and resumes by itself (§5, §8). |
| B. An API key (`ANTHROPIC_API_KEY`) | It never pauses, but every token is billed. |

- *Why A:* until the O5 pilot measures real costs, there is no honest cost estimate (§10), and a
  subscription caps the spend.
- *Not from the docs:* the design doc lists both options without picking one; this default is the
  concierge's suggestion.

**2. Pushing `main` to GitHub**

| Option | Consequence |
|---|---|
| A. The integrator pushes after each merge | GitHub CI checks everything, but code is published continuously. The repo is public. |
| **B. `main` stays local until you push** | **Recommended.** Matches your "nothing goes to the cloud without me" rule (§7 calls this an owner gate). You push by hand when you want CI. PL-1 needs at least one push to get a green run. |

**3. How many goals at once, and a daily spend cap**

| Option | Consequence |
|---|---|
| **A. 3 at once** | **Recommended.** It is the design default (§4, §10). Early waves have up to seven lanes ready, so raise it after O5 if your machine copes. |
| B. More than 3 | Faster, but more merge conflicts and a higher spend before costs are measured. |

- **Daily cap:** no doc sets a number.
- *Suggested default (not from the docs):* **$100 a day**. That is about three M goals at the §10
  caps of S $10, M $30 and L $90.

**4. Where it runs**

| Option | Consequence |
|---|---|
| **A. This Mac, kept awake** (`caffeinate`) | **Suggested default** while O5 runs, because you watch the pilot anyway. |
| B. A dedicated always-on machine, such as a Mac mini | §5 calls this "best" for long unattended runs. Move to it before switching on continuous mode. |

---

## 3 · Escalations

None. No goal has run yet, so triage has handed nothing to you.

---

## 4 · Waiting on the outside world

Nothing is waiting yet: none of the long-lead items has started. These are the waits ahead, and why
OW-2 → OW-5 and OW-9 should start early:

| Wait | Goal | How long | Since |
|---|---|---|---|
| Counsel engagement | OW-9 | 2–4 weeks (docs/PRD.md §9) | not started |
| DLT registration (entity, sender, OTP template) with MSG91 | OW-5, after OW-2 | 1–2 weeks | not started |
| Meta Business verification and the WhatsApp number | OW-5, after OW-2 | 1–3 weeks, then a review per template | not started |
| Name and trademark search | OW-2 Q5 | 1–2 weeks | not started |
| Play closed test (12+ testers, 14 continuous days) | QA-6, recruit in OW-8 | 14 days | not started |
| First iOS App Review | QA-6 | days to weeks | not started |
| Gym pilot | OW-12 | 10 weeks | not started |

</details>
