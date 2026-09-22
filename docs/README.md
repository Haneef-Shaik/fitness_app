# Volt — Fitness & Nutrition Tracking Platform

> **Source of requirements:** `../fitness_nutrition_tracking_BRD_data_model.docx` (BRD v1.0)
> This repository turns that BRD into a specified, designed and partly built product.

**Status → [09-PROJECT-TRACKER.md](09-PROJECT-TRACKER.md)** · **Next tasks → [TODO.md](TODO.md)**
The tracker is the only place that claims current status; everything else describes intent.

---

## Start here

| If you want to… | Open |
|-----------------|------|
| See the current status | [Project Tracker](09-PROJECT-TRACKER.md) |
| Pick up the next task | [TODO.md](TODO.md) |
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
| 05 | [Design System](05-DESIGN-SYSTEM.md) | Tokens, charts, typography, motion, accessibility. |
| 06 | [Edge Cases & States](06-EDGE-CASES.md) | Every failure, empty, conflict, boundary and recovery case. |
| 07 | [Traceability Matrix](07-TRACEABILITY.md) | BRD requirement → screen → API → acceptance criterion. |
| 08 | [Project Charter](08-PROJECT-CHARTER.md) | Why the project exists, non-goals, definition of done, **decision log**. |
| 09 | [Project Tracker](09-PROJECT-TRACKER.md) | **Live status** — milestones, blockers. |
| 10 | [Execution Goals](10-EXECUTION-GOALS.md) | **How the work is sequenced** — eleven goals, each with an entry gate and an explicit handoff to the next. |
| — | [prompts/](prompts/) | **Goal prompts** — one paste-ready prompt per goal, G0…G10. |
| — | [TODO.md](TODO.md) | **Active work** — the current milestone's tasks in execution order. |
| — | [wireframes/](wireframes/) | Page-by-page: layout, every control, every state. |
| — | [design/](design/) | The UI as running code — 103 screens, 12 domains. |

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
infra/                docker-compose: dev Postgres + ephemeral test Postgres
```

**Why the domain logic exists twice:** the logger computes volume, estimated 1RM and personal-record
candidates locally, because a set commit never waits for the network. The server recomputes them
authoritatively when a session is finished. Two languages means two implementations — so both suites
run the same vectors in `contracts/vectors/domain.json`. If they ever disagree, CI fails rather than
a user watching their session summary change after it syncs.

## Running it

All paths are from the **repository root**, not this folder.

```bash
# 1. database
docker compose -f infra/docker-compose.yml up -d db

# 2. API  →  http://localhost:8000/v1/docs
cd services/api && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

# 3. app
cd apps/mobile && pnpm start     # QR code for Expo Go on a phone
cd apps/mobile && pnpm web       # or open http://localhost:8081
```

**Demo account** — `demo@volt.app` / `voltdemo1234`, onboarding pre-completed so it opens
on the dashboard. Recreate it any time (idempotent):

```bash
cd services/api && uv run python scripts/seed_demo.py
```

### Tests

```bash
cd packages/domain && npx vitest run   # TypeScript domain
cd services/api    && uv run pytest    # Python domain + API integration
```

The API tests need the ephemeral test database:
`docker compose -f infra/docker-compose.yml up -d db-test`

---

## Decisions and conventions

**The decision log lives in [08-PROJECT-CHARTER.md §6](08-PROJECT-CHARTER.md#6-decision-log)** —
D1 through D10, each with a date and rationale. It is the single canonical list; this file does not
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
