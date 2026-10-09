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
4. Tell a session "OW-1 is answered". It writes decision **D47** into `docs/08-PROJECT-CHARTER.md`
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
   - in `docs/11-LAUNCH-PLAN.md` Phase 0;
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

**What to do** (docs/17 §4 G12)
1. **Book counsel this week.** Getting started takes 2–4 weeks (docs/17 §9). Ask them to cover:
   - the invite and consent flow;
   - the gym terms and data processing agreement (DPA);
   - the enrolment notice;
   - minors (Q28, Q33);
   - a written opinion on AI calling.
2. **Interviews:**
   - 20–30 gym owners and 30–50 members;
   - use the questions in `docs/research/R3-gym-b2b2c-strategy.md` §14.6;
   - ask what they did last month, not whether they would use it;
   - keep the notes in `docs/research/R4-validation/` (local files only).
3. **Recruit five gyms** in one cluster (R3 §11.3). Sign the pilot terms and record each gym's
   baseline: last year's renewals and joiners.
4. **Run a two-gym concierge pilot**, using today's FitLog and a sheet (docs/17 §4 G12 step 5).
5. **Pre-sell Owner Pro** at the indicative price (docs/16 §9).
6. **Answer Q21–Q33**, or accept their defaults in writing. They are in docs/16 §17, "Open
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
| Counsel engagement | OW-9 | 2–4 weeks (docs/17 §9) | not started |
| DLT registration (entity, sender, OTP template) with MSG91 | OW-5, after OW-2 | 1–2 weeks | not started |
| Meta Business verification and the WhatsApp number | OW-5, after OW-2 | 1–3 weeks, then a review per template | not started |
| Name and trademark search | OW-2 Q5 | 1–2 weeks | not started |
| Play closed test (12+ testers, 14 continuous days) | QA-6, recruit in OW-8 | 14 days | not started |
| First iOS App Review | QA-6 | days to weeks | not started |
| Gym pilot | OW-12 | 10 weeks | not started |
