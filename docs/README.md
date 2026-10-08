# FitLog — Fitness & Nutrition Tracking Platform

> **Source of requirements:** `../fitness_nutrition_tracking_BRD_data_model.docx` (BRD v1.0)
> This repository turns that BRD into a specified, designed and partly built product.

**Plan and goal status → [23-MASTER-PLAN.md](23-MASTER-PLAN.md)** (local board: `node scripts/plan/serve.mjs`) ·
**Evidence → [09-PROJECT-TRACKER.md](09-PROJECT-TRACKER.md)**
Since 7 Oct 2026 `docs/plan/status.json` owns goal status and the tracker owns the evidence behind it
(docs/23 §8); everything else describes intent.

---

## Start here

| If you want to… | Open |
|-----------------|------|
| See the whole plan, what is ready and who is on what | [Master plan](23-MASTER-PLAN.md) → the local board: `node scripts/plan/serve.mjs` ([how](plan/README.md)) |
| Start a goal in a fresh session | [plan/SESSION-PROMPT.md](plan/SESSION-PROMPT.md) |
| See the evidence behind a status | [Project Tracker](09-PROJECT-TRACKER.md) |
| Pick up the next task | [TODO.md](TODO.md) |
| Get the app published | [Launch Plan](11-LAUNCH-PLAN.md) |
| Know what to build next, and what to hand the next person | [Execution Goals](10-EXECUTION-GOALS.md) |
| Understand why this exists and what "done" means | [Project Charter](08-PROJECT-CHARTER.md) |
| See the actual UI | [design/index.html](design/index.html) — open in a browser |
| Know what the product does | [PRD](01-PRD.md) |
| Build a screen | [Screen Architecture](04-SCREEN-ARCHITECTURE.md) → [wireframes/](wireframes/) → [design/](design/) |
| Build an endpoint | [System Architecture](02-SYSTEM-ARCHITECTURE.md) |
| Run it | [§ Running it](#running-it) below |

---

## The one-paragraph version

A longitudinal fitness data platform, not a workout logger. Two write-heavy domains — **training**
(Program → Plan Day → Session → Set) and **nutrition** (Meal → Meal Item → Confirmed Nutrition) —
joined by **body metrics** and **goals**, read through an analytics layer. Planned training is stored
separately from performed training so editing a plan never rewrites history. AI is an *estimation
layer* for food: its raw output is persisted separately from user-confirmed nutrition, and only
confirmed values drive analytics. The client is **native iOS and Android**, because the hardest UX
constraint in the product is **logging a set in under three seconds, one-handed, mid-workout**.

---

## Documents

| # | Document | Answers |
|---|----------|---------|
| 01 | [PRD](01-PRD.md) | What are we building, for whom, and what is "done"? |
| 02 | [System Architecture](02-SYSTEM-ARCHITECTURE.md) | Services, data flow, AI pipeline, schema, security, scaling. |
| 03 | [Frontend Architecture](03-FRONTEND-ARCHITECTURE.md) | App shell, routing, state, data layer, offline, performance. |
| 04 | [Screen Architecture](04-SCREEN-ARCHITECTURE.md) | The 103-screen inventory, navigation graph and route table. |
| 05 | [Design System](05-DESIGN-SYSTEM.md) | Tokens, charts, typography, motion, accessibility. **Visual direction superseded by 15.** |
| 15 | [UI Redesign](15-UI-REDESIGN.md) | **The visual rebuild** — what the review found, the "Kinetic Performance" direction, tokens, primitives, screen status, how to review and merge. |
| 16 | [PRD v2 — FitLog for Gyms](16-PRD-GYMS.md) | **What v2 adds:** the gym-owner platform, the member's gym surfaces, phone sign-in, Hindi, Pro gating all AI. Requirements, journeys, acceptance criteria AC-13…AC-28, open questions Q21–Q33. |
| 17 | [Gyms implementation plan](17-GYMS-IMPLEMENTATION-PLAN.md) | **How v2 gets built:** architecture (data model, policy, jobs, integrations, app structure), goals **G12–G30** in the [10](10-EXECUTION-GOALS.md) anatomy, sequencing and kill switches, owner tasks. |
| 21 | [UI rethink — The Logbook](21-UI-LOGBOOK-RETHINK.md) | **A second full UI direction in Figma (2 Oct 2026):** paper ground, two inks (black = confirmed, cobalt = anything the coach proposes), mono numerals; all 150 inventory screens plus states, the coach flows, components, variables and a motion spec; page 16 is a clickable prototype of seven flows. Proposal, not live. |
| 22 | [UI direction 3 — Momentum](22-UI-MOMENTUM.md) | **An expressive, platform-native direction in Figma (4 Oct 2026):** Material 3 Expressive on Android and the iOS 26 idiom on iPhone, one loud element per screen, one accent (volt lime, chosen by a colour-blind separation test) plus neutrals, violet only for the AI coach, research-backed reward moments (weekly streaks, records, gym challenge), Dark and Light variables, keyframed motion, and every other screen in the inventory (owner and trainer workspaces included) on pages 06–15; every screen page is a clickable prototype (33 flows). Proposal, not live. |
| 23 | [Master plan](23-MASTER-PLAN.md) | **The plan from today to a finished FitLog (7 Oct 2026):** 94 goals in [plan/GOALS.md](plan/GOALS.md) across 10 milestones (ground truth → platform → Momentum → store launch → gym pilot → Phase 2 → depth → exercise media last), 8 parallel session lanes plus the owner, and a local dependency board whose statuses live in `plan/status.json`. |
| 06 | [Edge Cases & States](06-EDGE-CASES.md) | Every failure, empty, conflict, boundary and recovery case. |
| 07 | [Traceability Matrix](07-TRACEABILITY.md) | BRD requirement → screen → API → acceptance criterion. |
| 08 | [Project Charter](08-PROJECT-CHARTER.md) | Why the project exists, non-goals, definition of done, **decision log**. |
| 09 | [Project Tracker](09-PROJECT-TRACKER.md) | **Live status** — milestones, blockers. |
| 10 | [Execution Goals](10-EXECUTION-GOALS.md) | **How the work is sequenced** — eleven goals, each with an entry gate and an explicit handoff to the next. |
| 11 | [Launch Plan](11-LAUNCH-PLAN.md) | **Everything between the release gate and a published app** — gaps, accounts, hosting, store builds, content, beta. |
| 12 | [Deployment runbook](12-DEPLOYMENT.md) | **Hosting it** — Supabase, the container host, secrets, migrations, backups and the restore drill, rollback. |
| 13 | [Store listing & compliance](13-STORE-LISTING.md) | **Submitting it** — listing copy, Data Safety, Health apps declaration, App Privacy labels, reviewer notes. |
| 14 | [Supabase](14-SUPABASE.md) | Database, storage and auth on Supabase: decisions, phases, what was proven locally |
| — | [prompts/](prompts/) | **Goal prompts** — one paste-ready prompt per goal, G0…G10. |
| R3 | [Gyms as the distribution channel](research/R3-gym-b2b2c-strategy.md) | **Strategy research (2 Oct 2026)** — should FitLog reach members through free gym software? Market, competitors, gaps, features, growth loop, pricing, GTM for India, risks, and the pilot that decides it. Short versions: [executive summary](research/R3-executive-summary.md) · [presentation](research/R3-presentation.html) (open in a browser). Evidence in [research/R3-evidence/](research/R3-evidence/README.md). |
| — | [TODO.md](TODO.md) | **Active work** — the current milestone's tasks in execution order. |
| — | [data-sources.md](data-sources.md) | Where every seeded food and exercise comes from, the licences, and the attribution owed. |
| — | [wireframes/](wireframes/) | Page-by-page: layout, every control, every state. |
| — | [design/](design/) | The UI as running code — 103 screens, 12 domains. |
| — | [screenshots/](screenshots/README.md) | **Every screen of the real app** — 170 captures of a release build of `main` (2 Oct), with the defects they show. |

### Wireframe volumes

| File | Screens |
|------|---------|
| [00 — Conventions](wireframes/00-CONVENTIONS.md) | How to read them; shared shell, spec template |
| [01 — Auth & Onboarding](wireframes/01-AUTH-ONBOARDING.md) | A-01 … A-10 |
| [02 — Dashboard](wireframes/02-DASHBOARD.md) | B-01 … B-05 |
| [03 — Workout Planning](wireframes/03-WORKOUT-PLANNING.md) | C-01 … C-09, D-01 … D-05 |
| [04 — Workout Logger](wireframes/04-WORKOUT-LOGGER.md) | E-01 … E-13 |
| [05 — History & Analytics](wireframes/05-HISTORY-ANALYTICS.md) | F-01 … F-07, G-01 … G-07 |
| [06 — Nutrition](wireframes/06-NUTRITION.md) | H-01 … H-18 |
| [07 — Body & Goals](wireframes/07-BODY-GOALS.md) | I-01 … I-06, J-01 … J-04 |
| [08 — Profile & Settings](wireframes/08-PROFILE-SETTINGS.md) | K-01 … K-11 |
| [09 — System States](wireframes/09-SYSTEM-STATES.md) | L-01 … L-08 |

### Design file

[`design/index.html`](design/index.html) — open it in any browser. Self-contained, no build step,
no server, no account. All 103 screens across 12 domains, with a board view and a prototype view.
The workout logger's **E-03 is live** — the steppers work, the delta against last time computes,
and the rest timer runs. [design/README.md](design/README.md) explains the direction and the
measured contrast evidence.

---

## The codebase

```
contracts/vectors/    the cross-language contract — both test suites load this
packages/domain/      TypeScript domain rules (offline logger)
services/api/         FastAPI service; app/domain/ is the authoritative implementation
apps/mobile/          Expo app (iOS + Android)
infra/                docker-compose: the ephemeral test Postgres (and a plain dev Postgres)
supabase/             the local Supabase stack's config and FitLog's auth email templates
```

**Why the domain logic exists twice:** the logger computes volume, estimated 1RM and personal-record
candidates locally, because a set commit never waits for the network. The server recomputes them
authoritatively when a session is finished. Two languages means two implementations — so both suites
run the same vectors in `contracts/vectors/domain.json`. If they ever disagree, CI fails rather than
a user watching their session summary change after it syncs.

## Running it

All paths are from the **repository root**, not this folder.

```bash
# 1. Supabase: database, sign-in, photo storage (Docker) — docs/14
pnpm supabase start
eval "$(scripts/supabase-env.sh)"    # its URLs and keys, for everything below

# 2. migrations and the food/exercise catalog — direct, never through the pooler
DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:54322/postgres bash scripts/migrate.sh

# 3. API  →  http://localhost:8000/v1/docs
cd services/api && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

# 4. app
cd apps/mobile && pnpm start     # QR code for Expo Go on a phone
cd apps/mobile && pnpm web       # or open http://localhost:8081
```

Sign-up confirmation emails and reset codes go to Mailpit, <http://127.0.0.1:54324>; Studio
(the database, the auth users) is <http://127.0.0.1:54323>. Links in those emails open the app
(`fitlog://`), so they work in a release build, not in Expo Go — confirm an address by opening
its link on the laptop, then log in.

**Demo account** — `demo@fitlog.app` / `fitlogdemo1234`, onboarding pre-completed so it opens
on the dashboard. It is created in the local Supabase Auth, confirmed. Recreate it any time
(idempotent):

```bash
cd services/api && uv run python scripts/seed_demo.py
```

### Tests

```bash
cd packages/domain && npx vitest run   # TypeScript domain
cd services/api    && uv run pytest    # Python domain + API integration
```

The API tests need the ephemeral test database:
`docker compose -f infra/docker-compose.yml up -d db-test` — plain Postgres with a minimal
`auth` schema the suite creates; tokens are signed by a test key. The same suite runs on
Supabase's own Postgres too (docs/14).

### Hosting it

**[12-DEPLOYMENT.md](12-DEPLOYMENT.md)** — the runbook: Supabase (Postgres, photo storage, sign-in), the
API and worker as two services from one Docker image, migrations as a release step, GitHub
environments, crash reporting, backups and the restore drill, rollback.

---

## Decisions and conventions

**The decision log lives in [08-PROJECT-CHARTER.md §6](08-PROJECT-CHARTER.md#6-decision-log)** —
D1 through D30, each with a date and rationale. It is the single canonical list; this file does not
repeat it, because a decision table maintained in two places drifts.

The ones that shape the most reading:

- **Native iOS + Android via React Native (Expo)**; web deferred, not cancelled *(D1)*
- **Python 3.13 + FastAPI**, contract shared via OpenAPI, domain formulas implemented twice and
  pinned by shared test vectors *(D3a–D3c)*
- **Only confirmed nutrition counts.** Estimated values never look like confirmed ones *(D5)*
- **Iris** is the only accent, chosen by colour-vision-deficiency measurement *(D9)*

Out-of-MVP scope — water tracking, social features, coach accounts, payments — is listed in
[charter §3 Non-goals](08-PROJECT-CHARTER.md#3-non-goals).

### Reading conventions

| Marker | Means |
|--------|-------|
| **`[ASSUMPTION]`** | Extends the BRD; confirm before building on it |
| **`[P2]`** | Phase 2 — must not block MVP, and is never half-built |
| **Screen IDs** `A-01`…`L-08` | Stable across every doc, the design file and the code |
