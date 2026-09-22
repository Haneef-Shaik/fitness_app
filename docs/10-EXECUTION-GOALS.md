# Execution Goals
## Volt — the handoff chain from here to release

**Last updated:** 2026-09-22 (G0 closed) · **Head:** `e514838` · **Status of record:** [09-PROJECT-TRACKER.md](09-PROJECT-TRACKER.md)

> **What this document is.** Eleven **goals**, in order, each one a **contract**: what it inherits,
> what it must produce, how to produce it in *this* codebase, how you know it is finished, and
> exactly what it hands to the goal after it.
>
> **What it is not.** It is not a status page — the tracker owns that. It is not a task list —
> [TODO.md](TODO.md) owns the current milestone's granular steps. This document owns the **shape of
> the work and the joins between its parts**, which is the thing that normally goes missing and the
> thing that costs the most when it does.
>
> **How to run one.** Each goal has a ready-to-paste prompt in [prompts/](prompts/) — `G0.md` …
> `G10.md`. A prompt carries this document's contract for that goal — entry gate, scope, mechanics,
> verification, handoff — into a form a fresh session can act on.

---

## 0 · Why goals, not tasks

A task list answers *what is next*. It does not answer **what the next person needs to know**, and on
a project where the work is handed between sessions, agents or people, that gap is where the damage
happens. Three failures this project has already survived make the case:

| What happened | What a task list would not have caught |
|---|---|
| A test asserted the outcome of a call it never checked succeeded — the route 500'd and the test **passed** | "Write a test for AC-12" was ticked. The handoff "AC-12 is *proven*" was false |
| `local_date` was specified as a Postgres generated column; `AT TIME ZONE` is `STABLE`, not `IMMUTABLE`, so it cannot be | The schema task carried an assumption the next task inherited silently |
| A densify walked rows through values their neighbours held; it passed on the order the ORM happened to emit `UPDATE`s in | Green tests were handed forward as "correct", when they were **lucky** |

So every goal below ends with a **handoff record** — a small, explicit set of claims the next goal is
entitled to rely on. **A claim in a handoff record must be something you ran, not something you
believe.** That is the whole method.

---

## 1 · The anatomy of a goal

Every goal in §5 has the same seven parts, and none of them is optional.

| Part | Answers | Rule |
|------|---------|------|
| **Outcome** | What is true afterwards that is not true now | One sentence, in the product's terms, not the code's |
| **Inherits** | Which earlier handoffs this goal stands on | Named `H<goal>.<n>`, with what each one guarantees |
| **Entry gate** | May this goal start? | A **runnable check**. If it fails, the previous goal is not finished |
| **Do** | The scope | Ordered. Anything not listed is out of scope and goes to the backlog, not into the goal |
| **How** | The mechanics, in this repo | Real paths, real commands, the pattern already in use. No generic advice |
| **Done when** | Verification | Each line independently checkable by someone who was not here |
| **Hands off** | The contract forward | Artefact + the claim it carries. This is the only thing the next goal may assume |

Plus **Traps** — the specific way this goal goes wrong, written before it does.

---

## 2 · The chain at a glance

| Goal | Outcome | Proves | Blocked by | Size |
|------|---------|--------|-----------|------|
| **G0** | The client spec describes the platform we actually chose | — | — | S |
| **G1** | The app talks to the API through **generated** types, cached reads and a tested harness | — | G0 | M |
| **G2** | A user can browse the catalog and build a program on a phone | makes **AC-01** reachable | G1 | M |
| **G3** | **A user can log a workout, offline, one-handed** | makes **AC-02 · AC-04** reachable | G2 | **L — the product** |
| **G4** | The critical path is proven on a real device, not asserted | **AC-01 · AC-02 · AC-04** · DR4 | G3 | M |
| **G5** | A user can find and compare past sessions | **AC-03 · AC-05** | G4 | M |
| **G6** | Training data becomes trend, not archive | **AC-06** | G5 | M |
| **G7** | A user can log food and see the day move | **AC-07** | G5 · **Q1** | L |
| **G8** | AI estimates food without ever becoming the record | **AC-08 · AC-09 · AC-10** | G7 | L |
| **G9** | The dashboard tells the truth about today | **AC-11** | G6 · G8 | M |
| **G10** | It is shippable: observable, accessible, exportable, fast | NFR sign-off | G9 | M |

**AC-12 is already proven** and is *not* a goal here — it is an invariant every goal must not break
(see §6).

---

## 3 · The handoff ledger

The cumulative set of things later goals are entitled to assume. **A goal may only rely on rows above
its own line.** Fill the *Recorded* column when the goal closes — an unfilled row means the handoff
did not happen, whatever the tracker says.

| ID | Artefact | The claim it carries | From | Recorded |
|----|----------|---------------------|------|----------|
| H·0 | `contracts/vectors/domain.json` | Both languages compute the same numbers; 11 mutations proved the guards | *done* | ✅ 21 Sep |
| H·0 | `services/api` + 3 migrations | 43 operations, 83 integration tests, plan tree ≠ performed tree | *done* | ✅ 21 Sep |
| **H0.1** | `docs/03` §2–§4, §9, §11 | The client spec names the packages the app actually uses | G0 | ✅ 22 Sep |
| **H0.2** | `docs/03` §5.3 + **D14** | Where a draft and an outbox entry live on a phone, and their schema | G0 | ✅ 22 Sep |
| **H0.3** | **D15** — Maestro on Expo Go | A runner that works **without** a local Xcode/Android SDK | G0 | ✅ 22 Sep |
| **H0.4** | **D16** — device budget | The performance budget is measurable on a phone | G0 | ✅ 22 Sep |
| **H1.1** | `packages/api-types` | Client types are **generated** from the server's OpenAPI and drift-gated in CI | G1 | ⬜ |
| **H1.2** | `queryKeys.ts` + invalidation map | Every cached read has one key and one documented invalidator | G1 | ⬜ |
| **H1.3** | `DataBoundary` | Loading / empty / filtered-empty / error are one component, not per-screen improvisation | G1 | ⬜ |
| **H1.4** | Mobile test harness | `pnpm --filter @volt/mobile test` runs and gates coverage | G1 | ⬜ |
| **H2.1** | Screen kit | Virtualised list, filter row, detail scaffold, bottom sheet | G2 | ⬜ |
| **H2.2** | Exercise picker | Multi-select picker the **logger reuses** for add/swap | G2 | ⬜ |
| **H2.3** | `/exercises/{id}/history`, `/stats` | The two endpoints D-02 needs now exist | G2 | ⬜ |
| **H3.1** | Session draft store | Pure reducers; add/edit/delete/reorder/densify unit-tested | G3 | ⬜ |
| **H3.2** | Outbox | FIFO per aggregate, idempotent replay, terminal 4xx surfaced — **reused by G7/G9** | G3 | ⬜ |
| **H3.3** | Recovery protocol | Local draft vs `GET /workout-sessions/active` reconciled deterministically | G3 | ⬜ |
| **H3.4** | Session mutation endpoints | `PATCH|DELETE /session-exercises/{id}`, reorder, `PATCH /workout-sessions/{id}` | G3 | ⬜ |
| **H4.1** | E2E suite | AC-01, AC-02, AC-04 and the offline flow run in CI | G4 | ⬜ |
| **H4.2** | Device-verified build | Runs on a physical phone over LAN; DR4 closed | G4 | ⬜ |
| **H4.3** | Measured p95 | tap → set rendered, on hardware, with the number written down | G4 | ⬜ |
| **H5.1** | Cursor pagination convention | One shape for every list endpoint after this | G5 | ⬜ |
| **H5.2** | Session comparison primitive | Reused by G6's charts | G5 | ⬜ |
| **H6.1** | Chart kit | Series palette, axis, tooltip, empty state — obeys [05 §3](05-DESIGN-SYSTEM.md) | G6 | ⬜ |
| **H6.2** | Analytics read model | Aggregations that do not scan every set on every request | G6 | ⬜ |
| **H7.1** | Food resolver interface | Provider-agnostic — **Q1 can be answered late without a rewrite** | G7 | ⬜ |
| **H7.2** | Meal aggregate | Denormalised macros; only `confirmed = true` reaches analytics | G7 | ⬜ |
| **H8.1** | Append-only analysis tables | The raw AI result is never mutated by a correction | G8 | ⬜ |
| **H8.2** | AI gateway | Strict JSON schema, timeout, containment — **training never depends on it** | G8 | ⬜ |
| **H9.1** | `GET /dashboard` | One call, one local date, three domains | G9 | ⬜ |
| **H10.1** | Release gate | Observability, a11y, perf, export/delete all evidenced | G10 | ⬜ |

---

## 4 · Where the codebase actually is

Measured on 2026-09-22 at `5e42626`, not recalled.

### 4.1 What is real and working

| Layer | State | Evidence |
|-------|-------|----------|
| **Shared domain** | `packages/domain` (TS) and `app/domain` (Python) implement the same 6 formula families | **48 + 133 tests**, pinned by `contracts/vectors/domain.json`, **11 mutation checks** |
| **API** | **43 operations / 32 paths** — auth, profile, goals, catalog, plan tree, sessions, sets, records | **83 integration tests**; `ruff` clean; `alembic check` clean |
| **Schema** | 3 migrations, reversible round-trip tested; plan tree and performed tree are separate by construction | `test_migrations.py` |
| **Mobile** | Expo SDK 52 · RN 0.76.9 · React 18.3.1 · expo-router. **6 of 103 screens**: A-01…A-04, A-07, B-01 | runs end to end in a browser against the live API |
| **Design** | **103 screens specified, 112 rendered** across 12 domain files, both themes | `docs/design/index.html` |
| **CI** | 3 jobs — TS domain, Python domain + migrations + API, cross-language contract | `.github/workflows/ci.yml` |

**The server half of the product's critical path is done.** What remains on the critical path is
almost entirely **client**.

### 4.2 Three findings that change the plan

These came out of this analysis and are the reason **G0 exists and comes first**.

#### Finding 1 — `docs/03-FRONTEND-ARCHITECTURE.md` still describes the platform we rejected

D1 changed the client to **React Native (Expo)**. The frontend spec was never rewritten, and it is
not a cosmetic mismatch — it specifies **browser-only APIs for the most important component in the
product**:

| `docs/03` says | On React Native | Severity |
|----------------|-----------------|----------|
| §2 "Local persistence: **IndexedDB via Dexie**" · §5.1 "Zustand + **Dexie**" · §5.3 "written to **IndexedDB** on every committed change" | **IndexedDB does not exist.** The session-draft durability layer has no implementation path as written | 🔴 **blocks G3** |
| §2 Framework "**Next.js** App Router, installed as a **PWA**" · §3 structure `src/app/(auth)/login/page.tsx` | The app is `expo-router`; the structure is already different in the repo | 🟠 misleads every screen goal |
| §2 "**Tailwind**" + "**shadcn/ui** (Radix)" | Neither exists in RN. The repo hand-rolled `src/ui/index.tsx` | 🟠 |
| §2 / §11 E2E "**Playwright**" | Cannot drive a native app | 🔴 **blocks G4** |
| §9 budget in **LCP / INP / gzip bundle / Server Components** | Not measurable on a phone; the one budget that matters (**tap → set rendered < 100 ms**) survives | 🟠 |
| §4.1 "≥1024 px **left navigation rail**" · §4.3 "the **browser** back button" | Desktop and web concepts on a phone-only client | 🟡 |

It leaks outward too: [01-PRD](01-PRD.md) §Offline and R4, and [06-EDGE-CASES](06-EDGE-CASES.md)
**O2, O12, O13** (O13 is literally *"private/incognito browsing with no IndexedDB"*).

**Why this is first.** G3 builds the durability layer. Building it against a spec that names a
browser database is the single most expensive mistake available on this project right now.

#### Finding 2 — seven endpoints are declared in `docs/02` §7 but do not exist

Verified by diffing the live OpenAPI against the declared surface:

| Declared, missing | Needed by | Lands in |
|---|---|---|
| `GET /exercises/{id}/history` | **D-02** exercise detail | **G2** |
| `GET /exercises/{id}/stats` | **D-02** | **G2** |
| `PATCH /session-exercises/{id}` · `DELETE /session-exercises/{id}` | **E-02** swap / remove mid-session | **G3** |
| `PUT /workout-sessions/{id}/exercises/order` | **E-02** reorder | **G3** |
| `PATCH /workout-sessions/{id}` | session notes | **G3** |
| `GET /dashboard` | **B-01** — currently the built dashboard must be fanning out | **G9** |

Each is now an explicit **server pre-step inside the goal that needs it**, rather than a surprise
discovered mid-screen.

#### Finding 3 — the mobile app has none of the substrate the spec assumes

`apps/mobile/package.json` has **no** server-state library, **no** client store, **no** local
database, and `"test": "echo \"no mobile tests yet\""`. The house rule is **TDD with an 80% floor**;
the client currently has **zero** tests while the server has 133. G1 exists to close that before the
logger is written, not after.

### 4.3 The honest scoreboard

| | |
|---|---|
| Acceptance criteria proven | **1 of 12** (AC-12) |
| Screens built | **6 of 103** |
| Client test coverage | **0%** |
| Server test coverage | 133 tests, not yet gated at a percentage |
| Decisions blocked on the user | **Q1** nutrition provider (gates G7, G8 — ~40% of screens) · **Q9** minimum age (gates A-07 copy) |

---

## 5 · The goals

---

### G0 · Make the client spec describe the client we are building

**Outcome.** Anyone opening `docs/03` reads the platform that is actually in `apps/mobile`, and the
durability layer for the logger has a **named, available implementation** before anyone writes it.

**Inherits.** Nothing. This goal exists because of **Finding 1**.

**Entry gate.** None — start here.

**Do.**
1. Rewrite `docs/03` **§2 stack**, **§3 project structure**, **§4.1/4.3 shell & navigation**,
   **§9 performance budget**, **§11 testing strategy** for React Native + Expo.
2. **Decide and record the persistence mechanism** for the session draft and the outbox.
3. **Decide and record the E2E runner**, under the constraint that there is **no local Xcode or
   Android SDK** (DR4) — so it must drive **Expo Go**, not a custom native build.
4. Correct the leaks: `01-PRD` §Offline + R4; `06-EDGE-CASES` **O2, O12, O13**.
5. Add the resulting decisions to the [charter](08-PROJECT-CHARTER.md) decision log as **D14–D16**.

**How.**

*Persistence.* Three candidates, and the constraint decides it:

| Option | Transactions | In Expo Go? | Verdict |
|--------|-------------|-------------|---------|
| `AsyncStorage` | ✗ key-value, no atomic multi-write | ✓ | **No** — an outbox needs atomic dequeue |
| `react-native-mmkv` | ✗ key-value | **✗ native module → needs a dev build** | **No** — DR4 says we test on Expo Go |
| **`expo-sqlite`** | ✓ real transactions, queryable, WAL | ✓ ships in the Expo runtime | **Recommended** |

Confirm `expo-sqlite` is present in the installed SDK before writing the decision down — *verify,
do not assume*. Then specify the schema in `docs/03` §5.3, something close to:

```sql
-- session_draft: exactly one row; the whole draft as JSON, rewritten per committed change
CREATE TABLE session_draft (id INTEGER PRIMARY KEY CHECK (id = 1),
                            revision INTEGER NOT NULL, updated_at TEXT NOT NULL, json TEXT NOT NULL);
-- outbox: one row per pending write, ordered, idempotent on client_id
CREATE TABLE outbox (id INTEGER PRIMARY KEY AUTOINCREMENT,
                     aggregate_id TEXT NOT NULL, method TEXT NOT NULL, path TEXT NOT NULL,
                     body TEXT NOT NULL, idempotency_key TEXT NOT NULL UNIQUE,
                     attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at TEXT NOT NULL,
                     state TEXT NOT NULL DEFAULT 'pending', last_error TEXT);
CREATE INDEX ix_outbox_ready ON outbox (aggregate_id, id) WHERE state = 'pending';
```

The draft is one JSON blob because it is **read and written whole**; the outbox is rows because it is
**dequeued in order and partially**. That asymmetry is the design, and it belongs in the doc.

*E2E.* **Maestro** — YAML flows, drives Expo Go over the LAN, no native toolchain. Detox and
Playwright both require a build this machine cannot produce.

*Performance budget.* Replace the web metrics with what a phone can answer:

| Metric | Budget | Measured by |
|--------|--------|-------------|
| **tap → set rendered (p95)** | **< 100 ms** | `performance.now()` around the reducer + a post-commit frame callback, logged in dev builds |
| cold start → dashboard interactive | < 2.5 s mid-tier Android | manual stopwatch + `expo-router` mount log |
| JS bundle | tracked, not capped yet | `npx expo export` output size |

*O13 rewrite.* "Private browsing with no IndexedDB" becomes the real phone cases: **iOS purging app
storage under pressure**, and **Android "Clear data"**. Both mean the same product behaviour — the
draft is gone, say so plainly and start clean.

**Done when.**
- [x] `bash scripts/check-client-spec.sh` exits **0** — it asserts that `docs/03` contains no
      occurrence of the rejected web stack, and that no specification document still names the
      browser database. **Seen to fail** on a deliberate reintroduction, then pass again
- [x] `docs/03` §5.3 contains the SQLite schema above and says why draft-as-blob / outbox-as-rows
- [x] `D14` persistence · `D15` E2E runner · `D16` revised performance budget are in the charter
- [x] `expo-sqlite`'s availability in this SDK was **checked**, and the check is noted in D14

**Hands off.**

| ID | Artefact | Claim |
|----|----------|-------|
| **H0.1** | `docs/03` §2–§4, §9, §11 | Every named package in the spec is installable in this app |
| **H0.2** | `docs/03` §5.3 + D14 | The draft and outbox have a schema and a real database to live in |
| **H0.3** | D15 | The E2E runner works with **no local native toolchain** |
| **H0.4** | D16 | The budget is measurable on a device |

**Traps.**
- Rewriting §2 and leaving §3's `page.tsx` tree — the structure section is the one people copy from.
- Recording `expo-sqlite` as a decision **without checking** it is in SDK 52. That is precisely the
  `local_date`-generated-column mistake, repeated.
- Deleting the web spec instead of **replacing** it. §4.1's ≥1024 px rail is not wrong forever —
  it is Phase 2. Move it, do not lose it.

---

### G1 · Give the client a spine: generated types, cached reads, a test harness

**Outcome.** Every screen goal after this writes **feature code only** — never a fetch wrapper, never
a hand-typed response shape, never its own loading state, and never an untested component.

**Inherits.** `H0.1` (what to install), `H0.3` (which test tools).

**Entry gate.** `bash scripts/check-client-spec.sh` exits 0.

That script is G0's gate, kept in one place because it names the packages it forbids — any document
that inlines it fails its own check. It exempts this file, `docs/prompts/` and the tracker, which
quote the rejected platform **on purpose**: §4.2 below is the record of why G0 existed.

**Do.**
1. **`packages/api-types`** — generated from `http://localhost:8000/v1/openapi.json`, with a **CI
   drift gate**.
2. **TanStack Query** provider + the **query-key registry** and **invalidation map** from `docs/03`
   §6.1–6.2.
3. **`DataBoundary`** — the four-state surface from §6.4.
4. **Test harness** — `jest-expo` + `@testing-library/react-native`, wired into CI with a coverage
   gate.

**How.**

*Types.* `openapi-typescript` against the running server, output checked in. The gate mirrors the
habit already in this repo — `alembic check` and the contract job:

```yaml
- name: API types are in sync
  run: |
    uv run uvicorn app.main:app --port 8000 & sleep 4
    pnpm dlx openapi-typescript http://localhost:8000/v1/openapi.json -o packages/api-types/schema.d.ts
    git diff --exit-code packages/api-types/schema.d.ts   # a stale type is a failed build
```
This closes **D3b**, which has been carried since M1. With **43 operations** the manual alternative
is no longer honest.

*Query keys.* One registry, so invalidation is greppable rather than guessed:
```ts
export const qk = {
  activeSession:        ()               => ['session', 'active'] as const,
  session:              (id: string)     => ['session', id] as const,
  previousPerformance:  (exId: string)   => ['previous-performance', exId] as const,
  records:              (exId: string)   => ['records', exId] as const,
  exercises:            (f: Filters)     => ['exercises', f] as const,
  programs:             ()               => ['programs'] as const,
} as const;
```
And an **invalidation map** next to it: `finish session → [activeSession, session(id), records(*), history]`.
Write the map as a table in `docs/03` §6.2, then implement against it — not the other way round.

*`DataBoundary`.* Four states, and **filtered-empty is not empty** — different copy, different
action. That distinction is a rule in the design system and a common bug elsewhere; putting it in one
component is how it stays true across 97 remaining screens.

*Tests.* The server has 133 tests and the client has none. Start the harness with the pieces that are
pure and already exist — `src/lib/api.ts` envelope unwrapping, 401 refresh, LAN host derivation —
so the first client tests cover the code most likely to break silently.

**Done when.**
- [ ] `pnpm --filter @volt/mobile test` runs and passes in CI
- [ ] Deleting a field from a Pydantic schema makes the **types job fail**, and you have seen it fail
- [ ] `DataBoundary` has a test per state, including filtered-empty ≠ empty
- [ ] One existing screen (B-01) is migrated onto the query layer, proving the substrate on real code
- [ ] Coverage gate set and enforced; the starting number is written into the tracker

**Hands off.**

| ID | Artefact | Claim |
|----|----------|-------|
| **H1.1** | `packages/api-types` | Client and server cannot silently disagree about a payload |
| **H1.2** | `queryKeys.ts` + invalidation map | Every cached read has one key and a documented invalidator |
| **H1.3** | `DataBoundary` | No screen re-implements loading, empty, filtered-empty or error |
| **H1.4** | jest-expo harness + gate | A screen goal that ships untested code fails CI |

**Traps.**
- Generating types and then hand-writing "nicer" ones beside them. There must be **one** source.
- A coverage gate set to today's number and never raised — record the number and the intent.
- Migrating all six existing screens. Migrate **one**. Prove the spine, then move.

---

### G2 · Catalog and planning on a phone

**Outcome.** A user can search the exercise catalog, open an exercise, create a custom one, and build
a multi-day program with prescriptions — **AC-01 becomes reachable**.

**Inherits.** `H1.1` types · `H1.2` keys · `H1.3` boundary · `H1.4` harness.

**Entry gate.** `pnpm --filter @volt/mobile test` passes, and B-01 renders through the query layer.

**Do.** [TODO §5](TODO.md) — **D-01, D-02, D-03, C-02, C-03, C-05, C-06, C-07** (8 screens), plus the
**server pre-step**.

1. **Server pre-step:** `GET /exercises/{id}/history` and `GET /exercises/{id}/stats` (**Finding 2**).
2. **D-01** library — search, muscle/equipment filters, virtualised list.
3. **D-02** detail — PRs, e1RM trend, recent sessions, **never-performed** state.
4. **D-03** custom exercise — the primary-muscle requirement enforced *in the UI*, not only the API.
5. **C-02 / C-03** programs list and detail.
6. **C-05** plan day editor — reorder, live set-count-per-muscle summary.
7. **C-06** exercise picker sheet — multi-select, "create from query" when the search is empty.
8. **C-07** prescription editor — **fields driven by the exercise's tracked fields**.

**How.**

*The two endpoints first.* `/history` returns that exercise's completed sessions with their sets;
`/stats` returns the four records plus an e1RM series. Both are read-only aggregations over tables
that already exist — build them with the same envelope, the same `authorize()` policy call, and the
same "assert every mutating call" test discipline as `sessions.py`.

*Tracked fields.* `Exercise` already carries `tracks_load / tracks_reps / tracks_duration /
tracks_distance`. **C-07 must render from those flags**, not from a hardcoded load+reps form — a
plank has no load and a run has no reps. This is the field-shape contract the logger inherits, so
getting it right here is what stops E-03 needing a special case per exercise type.

*Reuse.* Build **C-06 as a standalone sheet** taking `{ selected, onChange, allowCreate }`. G3 needs
exactly this for "add exercise" and "swap exercise" mid-session. Building it screen-local here means
building it twice.

*Lists.* `FlashList` or `FlatList` with a stable `keyExtractor` and fixed row height — the catalog is
29 seeded exercises today and unbounded once users add their own.

**Done when.**
- [ ] The 8 screens match [wireframes/03](wireframes/03-WORKOUT-PLANNING.md) and
      [wireframes/04](wireframes/04-WORKOUT-LOGGER.md) including **every empty and error state**
- [ ] The two new endpoints have integration tests that assert status **and** payload
- [ ] C-07 renders correctly for a bodyweight exercise, a timed exercise and a distance exercise
- [ ] A program with 3 days and ≥2 exercises per day can be built **entirely on a phone screen**
- [ ] Component tests exist for the picker's multi-select and the filtered-empty state

**Hands off.**

| ID | Artefact | Claim |
|----|----------|-------|
| **H2.1** | Screen kit | Virtualised list, filter row, detail scaffold and bottom sheet are solved |
| **H2.2** | Exercise picker | The logger's add/swap is a prop change, not a new component |
| **H2.3** | `/exercises/{id}/history`, `/stats` | D-02's data exists server-side |

**Traps.**
- Hardcoding load+reps in C-07 — it will surface as a logger bug in G3, where it is far more costly.
- Skipping D-02's **never-performed** state. It is the state a new user sees for every exercise.
- Letting the picker keep its own selection state on the screen. The logger needs it controlled.

---

### G3 · The logger — **this is the product**

**Outcome.** A user starts a workout, logs every set one-handed **with the network off**, kills the
app mid-session, relaunches, resumes, finishes — and the server ends up holding exactly what the
phone showed, **with no duplicates**.

**Inherits.** `H0.2` durability contract · `H1.1`–`H1.4` spine · `H2.2` picker.

**Entry gate.** `docs/03` §5.3 has the SQLite schema, and `expo-sqlite` is installed and opening a
database in the app.

**Do.** [TODO §6](TODO.md) — **E-01, E-02, E-03, E-04, E-08, E-09, E-10, E-11**, the store, the
outbox, and a **server pre-step**.

1. **Server pre-step:** `PATCH|DELETE /session-exercises/{id}`, `PUT /workout-sessions/{id}/exercises/order`,
   `PATCH /workout-sessions/{id}` (**Finding 2**).
2. **Draft store** — Zustand, **pure reducers**, persisted to SQLite **on every committed change**.
3. **Outbox** — FIFO per aggregate, exponential backoff with jitter, terminal 4xx surfaced.
4. **E-01** start · **E-02** exercise list · **E-03 set logger** · **E-04** rest timer ·
   **E-08** summary · **E-09** discard · **E-10** recovery · **E-11** PR celebration.

**How.**

*Reducers before UI.* The store is where the correctness lives, and it is pure — so it is testable
without rendering anything. Write these tests first: append set · edit set · delete set **and
re-densify** · reorder exercises · prefill next set from the last · merge a recovered draft. The
server's `densify_set_indices` already exists as the reference behaviour; the client must agree.

*The commit path is the product.* From `docs/03` §5.2, and it is non-negotiable:
```
tap ✓ → validate locally (@volt/domain setValidity)   ~0 ms
      → reducer returns a NEW draft, UI updates        ~0 ms   ← the user is already done
      → write draft to SQLite                          ~2 ms
      → enqueue POST /session-exercises/:id/sets with Idempotency-Key = set.clientId
      → start rest timer, prefill the next set
                    └── background: flush → 200 synced │ 5xx/offline retry │ 4xx failed, inline
```
**The UI never awaits the network.** The only visible difference between online and offline is the
per-set sync dot.

*Idempotency is already guaranteed server-side* — `uq_set_client_id`, and a replay returns **200 with
the same row id** rather than 201. The client's contract is simply: **generate `clientId` once, at
commit, and never regenerate it on retry.** Test that a replayed flush produces one row.

*Recovery.* On launch, read the local draft **and** `GET /workout-sessions/active`:

| Local | Server | Action |
|-------|--------|--------|
| none | none | normal start |
| draft | none | E-10 → Resume / Finish / Discard |
| none | active | adopt the server session |
| both, same id | — | **replay the outbox**; sets are idempotent, so replay is safe |
| both, different id | — | the one with **more sets** wins; the other is offered as discard |
| draft > 24 h old | — | prompt before resuming |

*Finish.* E-08 renders **from the draft**, client-side, so it is instant — then reconciles with the
server's `/finish` response. The server computes volume, e1RM and PRs **inside the finish
transaction**, so the numbers agree by construction. They come from the same vectors.

*E-11 waits.* The PR celebration appears **after** the summary. Interrupting someone mid-set to
congratulate them is the worst thing this screen could do.

**Done when.**
- [ ] Reducer unit tests cover add / edit / delete+densify / reorder / prefill / recovery-merge
- [ ] **Airplane mode**: log a full session, kill the app, relaunch, resume, finish, restore network —
      server state matches the phone, **zero duplicate sets**
- [ ] A replayed outbox flush creates no duplicates (asserted, not assumed)
- [ ] A terminal 4xx appears **inline on the set**, never as a modal, and is never silently dropped
- [ ] The rest timer counts from a **target timestamp** and survives backgrounding
- [ ] E-03 controls are **56 px**; the commit path never awaits a promise that touches the network
- [ ] Every one of the 13 E-domain states in [wireframes/04](wireframes/04-WORKOUT-LOGGER.md) renders

**Hands off.**

| ID | Artefact | Claim |
|----|----------|-------|
| **H3.1** | Draft store | Pure, unit-tested reducers that agree with the server's densify behaviour |
| **H3.2** | Outbox | Generic and idempotent — **G7 meals and G9 body metrics reuse it unchanged** |
| **H3.3** | Recovery protocol | Local and server state reconcile deterministically, with the table above |
| **H3.4** | Session mutation endpoints | E-02 can swap, remove and reorder |

**Traps.**
- Awaiting the POST "just for the first set". Once the commit path can await, it will.
- Regenerating `clientId` on retry — this silently defeats every idempotency guard in the system.
- Persisting on an interval instead of per commit. The crash you are protecting against happens
  between intervals.
- Building the outbox inside the session feature. **G7 and G9 need it**; put it in `src/lib/offline`.
- Treating the rest timer as a counter. Backgrounding freezes timers — store the **target instant**.

---

### G4 · Prove the critical path on hardware

**Outcome.** AC-01, AC-02 and AC-04 stop being claims. **DR4 closes.**

**Inherits.** `H3.1`–`H3.4` · `H0.3` E2E runner.

**Entry gate.** G3's airplane-mode check passes on the simulator/web target.

**Do.** [TODO §7](TODO.md).
1. E2E **AC-01** — build a Chest workout with ≥2 exercises and target sets/reps.
2. E2E **AC-02** — record every set; `set_index` dense; loads and reps match.
3. E2E **AC-04** — start the same plan day again; previous performance shows before any input.
4. E2E offline — log in airplane mode, kill, relaunch, restore, assert server state.
5. **Measure p95 tap → set rendered on a real device.**
6. Run the whole thing **on a physical phone via Expo Go over LAN** — DR4.
7. Update the tracker; replace `TODO.md` with G5's tasks.

**How.** Maestro flows in `apps/mobile/.maestro/`, one per AC, named for the AC. Seed with
`scripts/seed_demo.py` so the flows start from a known state. Assert against the **API**, not only
the UI — an E2E that only reads the screen it just wrote cannot see a write that never landed.

For p95: instrument the commit path behind `__DEV__`, log 100 commits, take the 95th. **Write the
number down in the tracker** whether or not it meets budget — an unmet budget that is known is a
decision; an unmeasured one is a risk.

**Done when.**
- [ ] Three AC flows plus the offline flow run in CI
- [ ] The app has been driven on a physical device and the LAN host derivation confirmed working
- [ ] p95 recorded in the tracker's quality snapshot
- [ ] Tracker shows **4 of 12** acceptance criteria proven

**Hands off.** `H4.1` E2E suite · `H4.2` device-verified build · `H4.3` the measured number.

**Traps.** Asserting only what the UI shows. Running the flows only on web, where offline behaves
differently and the keyboard does not exist. Declaring the p95 "fine" without the number.

---

### G5 · Retrieval — find the past without knowing its date

**Outcome.** A user answers *"what did I do last chest day?"* without remembering when it was —
**AC-03** and **AC-05**.

**Inherits.** `H4.1` E2E suite · `H1.2` query keys · `H2.1` screen kit.

**Entry gate.** 4 of 12 ACs proven and recorded.

**Do.** `GET /history/workouts` (filters + cursor pagination) · `GET /history/previous-occurrence`
(the muscle-group rule) · `GET /history/compare` · screens **F-01…F-07** · the AC-03 timezone matrix.

**How.** The resolution rule is **normative and already written** — [PRD §7.2](01-PRD.md): most
recent `completed` session containing an exercise whose `exercise_muscles` row is that group (or a
descendant) with `role = 'primary'`, ordered by `completed_at DESC`; **if nothing matches, widen to
`('primary','secondary')` and the UI must say it widened.** The muscle tree is self-referencing, so
"or a descendant" is a recursive CTE — write it once, test it against a grandchild group.

AC-03 is a **unit matrix, not an E2E**: sessions started at 23:40 across ≥5 timezones including both
DST directions, asserted against `contracts/vectors/domain.json`'s existing `local_date` vectors.
The vectors are already there — this goal consumes them rather than inventing new ones.

Cursor pagination: opaque cursor over `(started_at, id)`. **Settle the shape here** — every list
endpoint after this one copies it.

**Done when.** AC-03 matrix green · AC-05 returns the right session and **states when it widened** ·
F-01…F-07 render including filtered-empty ≠ empty · **6 of 12** ACs proven.

**Hands off.** `H5.1` cursor convention · `H5.2` comparison primitive (G6's charts reuse it).

**Traps.** Widening silently. Paginating by offset — history grows and offsets drift under inserts.

---

### G6 · Analytics — turn the archive into a trend

**Outcome.** Volume, e1RM, muscle balance, frequency and adherence are visible and **agree with the
logger's numbers** — **AC-06**.

**Inherits.** `H5.1` pagination · `H5.2` comparison · `H1.3` boundary.

**Do.** `/analytics/workouts`, `/muscle-volume`, `/exercises/{id}`, `/personal-records`, `/frequency`,
`/adherence` · screens **G-01…G-07** with charts.

**How.** Every number here already has a definition in `app/domain/training.py` and a vector in
`contracts/`. **Do not re-derive any of them in a SQL aggregate** — that is how AC-06's "matching
across all three screens" fails. Where an aggregate must run in SQL for performance, add a test that
asserts the SQL result equals the domain function over the same rows.

Muscle volume is **primary ×1.0, secondary ×0.5** (D7) and must recurse the group tree exactly as
G5's rule does — share the CTE.

Charts follow [05-DESIGN-SYSTEM §3](05-DESIGN-SYSTEM.md): fixed series order never cycled, **slot 7
is a spacer and not assignable** (assignable ceiling is 6), one axis and never two, legend always
present for ≥2 series, and **a regression is never red** — a lighter week is information.

**Done when.** AC-06 asserted across E-08, F-03 and G-02 for the same session · charts pass the
design-system checks in both themes · every analytics endpoint has an integration test · **7 of 12**.

**Hands off.** `H6.1` chart kit · `H6.2` analytics read model.

**Traps.** A second definition of volume living in SQL. Cycling chart colours when a filter changes
the series count — colour follows the **entity**, never its rank.

---

### G7 · Nutrition core — log food, watch the day move

**Outcome.** A manually logged meal changes today's totals immediately, on the user's local date —
**AC-07**.

**Inherits.** `H3.2` outbox (meals are offline writes too) · `H6.1` charts · `H5.1` pagination.

**Entry gate.** 🔴 **Q1 — the nutrition database provider — must be answered.**

**Do.** Models `foods`, `meals`, `meal_items` **with denormalised macro columns** ·
`/foods`, `/meals`, `/meal-items`, `/recipes` · screens **H-01…H-05, H-10…H-13, H-15, H-16**.

**How.** **Q1 does not have to block the start.** Build the **resolver interface** first
(`FoodResolver.search(query) -> Candidate[]`, `resolve(ref) -> Food`) with an internal-catalog
implementation behind it; a provider becomes one more implementation. This is the same shape as the
existing `app/seed/catalog.py` — a seeded internal source that works standalone.

Macros are **denormalised onto `meal_items`** ([02 §4.2](02-SYSTEM-ARCHITECTURE.md)): a food's
nutrition can be corrected later, and a logged meal must not silently change afterwards. This is the
nutrition analogue of `target_snapshot`, and it is the same principle as AC-12.

**Only `confirmed = true` counts** (D5). Wire this at the query layer, once, so no later screen can
forget it.

Meals reuse **`H3.2`** — the outbox is already generic, and if it is not, that is a G3 defect to fix
here rather than a second queue to write.

**Done when.** AC-07 passes end to end · a food's nutrition can be edited **without** changing a
meal already logged from it · unconfirmed items appear in the UI and in **no** total · **8 of 12**.

**Hands off.** `H7.1` resolver interface · `H7.2` meal aggregate.

**Traps.** Joining to `foods` for analytics instead of reading the denormalised columns. Letting an
unconfirmed item into a total "just for the preview" — the preview is the bug.

---

### G8 · AI nutrition — estimation that never becomes the record

**Outcome.** Photo and text input produce **editable** candidates; a user's correction is what counts,
and the raw AI output survives untouched — **AC-08, AC-09, AC-10**.

**Inherits.** `H7.1` resolver · `H7.2` meal aggregate.

**Do.** `food_analyses` / `food_analysis_items` **append-only** · job queue + worker · AI gateway with
a strict JSON schema · signed uploads with **EXIF stripped client and server side** ·
screens **H-06…H-09, H-18**.

**How.** AC-10 is the sharpest test in the project: after a user edits a quantity and confirms,
`meal_items.confirmed = true` **and** `user_corrected = true` with the new value, while the
`food_analysis_items` row is **byte-identical to before**. Make the analysis tables genuinely
append-only — no `UPDATE` path exists in code — and assert byte-identity, not field equality.

**Containment is a hard requirement**: AI failure must leave training, logging, history and analytics
completely untouched. The worker is a separate process; the gateway has a timeout; a failed analysis
degrades H-08 to manual entry with a plain sentence. Never auto-confirm above a confidence threshold
(**Q7 → no**, BRD §12.7).

Estimated never looks like confirmed: dashed border, "Est." chip, and **it adds nothing to any total
until confirmed**.

**Done when.** AC-08 yields three separately editable items from *"2 eggs, 3 rotis and 200g chicken"* ·
AC-09 yields items with quantity, macros and confidence, every field editable · **AC-10 asserts
byte-identity** · killing the AI service leaves the logger fully working (tested) · **11 of 12**.

**Hands off.** `H8.1` append-only analysis tables · `H8.2` contained AI gateway.

**Traps.** An `UPDATE` on an analysis row "just to fix a typo". A synchronous call to the model
inside the request path. Confidence used to skip confirmation.

---

### G9 · Body, goals and the dashboard that tells the truth

**Outcome.** B-01 shows the user's real training, nutrition and body state **for their local date**,
in one call — **AC-11**.

**Inherits.** `H6.2` analytics · `H7.2` meals · `H3.2` outbox.

**Do.** `body_metrics` · `/analytics/body` · `daily_summaries` · **`GET /dashboard`** (Finding 2) ·
screens **I-01…I-06, J-01…J-04, B-02…B-05**.

**How.** One aggregated call — the dashboard currently fans out, and every extra request is
latency on the first screen after launch. The local date is resolved **once, server-side**, from the
profile timezone; the client must not compute its own "today".

Q5 is already answered: **first weigh-in of the day is canonical**. Goals reuse the existing
`FitnessGoal` model from M1 — this goal builds screens on top of an API that already exists.

**Done when.** AC-11 shows the just-written data from all three domains for the local date ·
`GET /dashboard` replaces the fan-out and B-01's request count drops (measured) · **12 of 12**.

**Hands off.** `H9.1` `GET /dashboard`.

**Traps.** Computing "today" on the device. A dashboard that 404s when a domain is empty instead of
rendering its empty state.

---

### G10 · Hardening — make it shippable

**Outcome.** The product is observable, accessible, fast on a mid-tier Android, and a user can take
their data and leave.

**Inherits.** Everything.

**Do.** Offline outbox end-to-end + **L-02 sync centre** + **L-07 conflict** · RED metrics and the
alert table in [02 §9](02-SYSTEM-ARCHITECTURE.md) · **accessibility audit** — keyboard-only logging
and a screen-reader pass on the diary and logger · performance budgets measured on a mid-tier Android ·
**account export and deletion end-to-end**.

**How.** The a11y pass is not a lint run: log a full session with a screen reader, and navigate the
diary with an external keyboard. The rule "colour never carries meaning alone" is already in the
design system — this is where it gets checked on the built app rather than the design files.

Export/delete is a legal surface as much as a feature. Deletion must remove the analysis rows from
G8 too, and the test must assert that.

**Done when.** Every NFR in [PRD §11](01-PRD.md) has evidence · the alert table is wired and one
alert has been **deliberately triggered** · a11y audit findings are fixed or logged with a date ·
export produces a complete archive and delete leaves nothing behind (asserted).

**Hands off.** `H10.1` release gate.

**Traps.** An a11y audit that is an automated scan. Deleting the user but not the analyses.

---

## 6 · Invariants — true inside every goal

A goal may add behaviour. **No goal may break these.** They are the reason the product is worth
building, and each one already has a test somewhere that will catch you.

| # | Invariant | Where it is enforced |
|---|-----------|---------------------|
| **I1** | **The plan tree is not the performed tree.** Editing a program never changes a logged session | `target_snapshot`; `test_sessions.py` AC-12, mutation-checked |
| **I2** | **Only `confirmed = true` nutrition counts** (D5) | enforced at the query layer in G7 |
| **I3** | **Warm-ups are excluded from volume and PRs** (D6) | `set_volume_kg`, `is_pr_eligible` + vectors |
| **I4** | **Muscle volume: primary ×1.0, secondary ×0.5** (D7) | `weighted_volume_kg` |
| **I5** | **Epley, stored as `epley_v1`** (D8) — the version travels with the value | `annotate_set` |
| **I6** | **Canonical units in storage** (kg/cm/g/s/m); conversion only at the display edge | `lib/units`, round-trip vectors |
| **I7** | **The day is the profile's day.** `to_local_date(instant, tz)` is the only way to a date | `app/domain/dates.py`; 9 timezone vectors incl. both DST directions |
| **I8** | **Every write is idempotent on a client-generated key** | `uq_set_client_id`; replay tests |
| **I9** | **One response envelope**, always, including errors, always with a `request_id` | `app/api/envelope.py` |
| **I10** | **The set-commit path never awaits the network** | G3; measured in G4 |
| **I11** | **A regression is never red.** A lighter day is information, not an error | design system §3 |
| **I12** | **Estimated never looks like confirmed**, and adds nothing to a total | G8 |
| **I13** | **Filtered-empty ≠ genuinely empty** — different copy, different action | `DataBoundary` (H1.3) |
| **I14** | **No AI failure touches training** | G8 containment test |
| **I15** | **Each fact has one canonical home** — charter: decisions & risks · tracker: status · TODO: active work | reviewed at every goal close |

### The working loop inside a goal

The same six steps every time, in this order:

1. **Run the entry gate.** If it fails, the previous goal is not done — go back and finish it.
2. **Write the test first** (RED), including the failure and empty cases.
3. **Implement** (GREEN), then refactor.
4. **Mutation-check every new guard.** Break it deliberately; a named test must fail. A guard whose
   removal breaks nothing is not a guard. *(This has already caught one vacuous test here.)*
5. **Run it for real** — against the running API, on a device where the goal is client-side. Not
   "should work".
6. **Close the goal**: update the tracker, record the decisions in the charter, replace `TODO.md`
   with the next goal's tasks, commit, and **write the handoff record**.

> **Assert every mutating call.** A test that calls an endpoint without checking its status can pass
> while the endpoint 500s. That is not a hypothetical on this project — it happened, and it made an
> AC-12 test pass while proving nothing.

---

## 7 · The handoff record

Append one of these to the tracker's changelog when a goal closes. **It is written from what you ran,
not from what you intended.**

```markdown
### Handoff — G<n> · <name>            closed <date> · <commit>

**Outcome claimed.** <one sentence, in the product's terms>

**Inherited and used.**
| ID | Held? | Note |
|----|-------|------|
| H<n>.<m> | ✅ / ⚠️ | <if ⚠️: what was wrong and what you did about it> |

**Produced.**
| ID | Artefact | Claim | Evidence (command, test name, or measurement) |
|----|----------|-------|-----------------------------------------------|
| H<n>.1 | <path> | <what the next goal may assume> | <how you know> |

**Verified.**
- Tests: <before> → <after>   · Mutation checks added: <n>, all caught
- Ran for real: <exact command / device>
- Acceptance criteria now proven: <list>

**Decisions recorded.** D<n> … *(or "none")*
**Left undone, and why.** <explicit — this is what the next goal inherits as debt>
**Traps hit.** <what actually went wrong, so the next goal does not repeat it>
```

**The two fields people skip are the two that matter.** *Left undone* is how debt stays visible
instead of becoming a surprise three goals later. *Traps hit* is how this project stopped repeating
the same class of mistake — a vacuous test, a lucky migration, a spec that outlived its decision.

---

## 8 · Answering the two blocked questions

Neither blocks the next four goals, but both should be answered before **G7** starts.

| # | Question | Blocks | What a decision unlocks | Interim position |
|---|----------|--------|------------------------|------------------|
| **Q1** | Which nutrition database provider? | **G7, G8** — roughly 40% of the remaining screens | Food coverage, and a licensing/attribution obligation that affects the UI | Build `H7.1` **provider-agnostic** and seed an internal catalog. The interface is the answer to *"can we start?"*; the provider is the answer to *"is it good?"* |
| **Q9** | Minimum age / legal position | A-07 onboarding copy, and the privacy surface in G10 | The age gate's wording and whether a parental path exists | A-07 is built; the copy is a one-line change once answered |
