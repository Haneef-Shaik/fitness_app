# TODO — active work

**Goal:** G2 · Catalog & planning screens → [contract](10-EXECUTION-GOALS.md) · [prompt](prompts/G2.md) ·
[tracker](09-PROJECT-TRACKER.md) · [charter](08-PROJECT-CHARTER.md)
**Exit:** **AC-01** becomes reachable — build a Chest workout with ≥2 exercises and target sets/reps ·
H2.1 screen kit · H2.2 exercise picker the logger reuses · H2.3 the two missing endpoints

> This file holds **only the work in flight**. Milestone status lives in the tracker — it is not
> repeated here, because a status maintained in two places drifts. When G2 closes, this file is
> replaced with G3's tasks.
>
> A task is done when it meets the [Definition of Done](08-PROJECT-CHARTER.md#4-definition-of-done):
> tests first, tests fail before the code exists, a deliberate mutation makes them fail again,
> and the spec doc is updated in the same change if behaviour changed.

**Entry gate — run before starting:**

```bash
pnpm --filter @volt/mobile test:ci     # 69 tests, coverage gate, must exit 0
pnpm --filter @volt/mobile typecheck   # must pass
bash scripts/check-client-spec.sh      # G0's gate, still must exit 0
```

Then open the app and confirm **B-01 renders through the query layer**. If any of these fail, G1 is
not finished — stop and close it.

## 0 · What G2 inherits from G1 — use it, do not rebuild it

- [ ] **0.1** Types come from `@volt/api-types`. **Never hand-type a response shape** — if a shape is
      wrong or missing, fix the Pydantic schema and run
      `pnpm --filter @volt/api-types generate`. CI fails on a stale file.
- [ ] **0.2** Every read goes through a key in `src/lib/query/queryKeys.ts` and every write through
      `applyInvalidation`. Adding a read means adding a key **and** a row in
      [`docs/03` §6.2](03-FRONTEND-ARCHITECTURE.md) — a test asserts the two match in both directions
      and will fail if you add one without the other.
- [ ] **0.3** Every async surface renders through `src/ui/DataBoundary.tsx`. Pass `filtered` on any
      filtered list: **filtered-empty is not empty** (**I13**), and the catalog is where that bites.
- [ ] **0.4** The coverage ratchet (**D18**) holds `src/lib/query` at 90%+. New shared code must not
      be what drags the number down.

## 1 · Server pre-step — the two declared-but-missing endpoints

- [ ] **1.1** `GET /exercises/{id}/history` — that exercise's completed sessions with their sets,
      cursor-paginated
- [ ] **1.2** `GET /exercises/{id}/stats` — the four records plus an e1RM series
- [ ] **1.3** Both declare `response_model=Envelope[...]` (**D17**) with real `*Out` models, so they
      reach the OpenAPI document and the generated types. A route that returns `ok(...)` without a
      declared model documents **nothing**
- [ ] **1.4** Integration tests that **assert the status of every call they make** — a test that
      calls an endpoint without checking it succeeded can pass while the route 500s
- [ ] **1.5** Regenerate types and commit the diff

## 2 · Screen kit  *(H2.1 — reused by every later screen)*

- [ ] **2.1** Virtualised list on `@shopify/flash-list` (SDK-pinned 1.7.3, see `docs/03` §2)
- [ ] **2.2** Filter row / chips, with a "clear all" that `DataBoundary.filtered.onClear` can call
- [ ] **2.3** Detail scaffold — header, sections, safe-area aware
- [ ] **2.4** Bottom sheet — used by C-06 and later by the logger

## 3 · Catalog screens

- [ ] **3.1** **D-01** exercise library — search, muscle/equipment filters, virtualised list.
      Filtered-empty must say what was filtered and offer a way out, not "no exercises yet"
- [ ] **3.2** **D-02** exercise detail — PRs, e1RM trend, recent sessions, and the
      **never-performed** state, which is a first-time prompt and not an error
- [ ] **3.3** **D-03** create custom exercise — the **≥1 primary muscle** rule enforced in the UI as
      well as the API, so the user never round-trips to learn it

## 4 · Planning screens

- [ ] **4.1** **C-02 / C-03** programs list and detail
- [ ] **4.2** **C-05** plan day editor — reorder, live set-count-per-muscle summary
- [ ] **4.3** **C-06** exercise picker sheet — multi-select, "create from query" when the search is
      empty. **H2.2: the logger reuses this for add/swap**, so build it to be reused
- [ ] **4.4** **C-07** prescription editor — fields driven by the exercise's tracked fields
      (`tracks_load` / `tracks_reps` / `tracks_duration` / `tracks_distance`), never a fixed form

## 5 · Invariants this goal must not break

- [ ] **5.1** **AC-12** — editing a program must never invalidate sessions, records or analytics.
      The rule is already encoded in `invalidation.ts` and guarded by a test; do not route around it
- [ ] **5.2** **I13** — filtered-empty is not empty
- [ ] **5.3** **I6** — canonical units in state and over the wire; convert only at the display edge

## 6 · Close-out

- [ ] **6.1** Tracker: screens built, test count, coverage
- [ ] **6.2** Tick **H2.1–H2.3** in the [handoff ledger](10-EXECUTION-GOALS.md#3--the-handoff-ledger)
- [ ] **6.3** Append the G2 handoff record to the tracker changelog
- [ ] **6.4** Replace this file with **G3**'s tasks
- [ ] **6.5** Commit

---

## Carried over

- [ ] **DR4** — verify on a physical device via Expo Go; LAN connectivity untested. Runner chosen
      (**Maestro**, [D15](08-PROJECT-CHARTER.md#6-decision-log)), installed in **G4**
- [ ] **Coverage** — `src/lib/session.tsx` is 0% and `src/ui/index.tsx` is 31%. They are the whole
      gap to the 80% house floor; the ramp target is **G4** ([D18](08-PROJECT-CHARTER.md#6-decision-log))
- [ ] **Hermes `Intl`** — `date-fns-tz` needs `Intl.DateTimeFormat` with a `timeZone`, still not
      verified on a device. **G3** must assert a DST case before the logger depends on **I7**
- [ ] **`forceExit: true`** in `apps/mobile/jest.config.js` — a mounted TanStack mutation observer
      keeps the Jest worker alive under jest-expo. Narrowed to library+environment, not app code.
      **G3** should revisit: a suite that cannot end on its own will eventually hide a real leak
- [ ] Only **B-01** is on the query layer; the other five screens still call `api.ts` directly
- [ ] The Android SDK is installed but unconfigured — decide in **G4**
- [ ] `apps/mobile` still ships `react-native-web`; web is deferred ([D1](08-PROJECT-CHARTER.md#6-decision-log))

## Blocked — needs a decision from the user

- [ ] **Q1** nutrition database provider — blocks M5/M6, and a licensing attribution requirement
- [ ] **Q9** minimum age / legal position — blocks A-07
