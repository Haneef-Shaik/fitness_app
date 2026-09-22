# TODO — active work

**Goal:** G3 · The logger → [contract](10-EXECUTION-GOALS.md) · [prompt](prompts/G3.md) ·
[tracker](09-PROJECT-TRACKER.md) · [charter](08-PROJECT-CHARTER.md)
**Exit:** **AC-02** record every performed set · **AC-04** log a full session offline ·
H3.1 draft store · H3.2 outbox · H3.3 recovery · H3.4 session mutation endpoints

> This file holds **only the work in flight**. Milestone status lives in the tracker — it is not
> repeated here, because a status maintained in two places drifts. When G3 closes, this file is
> replaced with G4's tasks.
>
> A task is done when it meets the [Definition of Done](08-PROJECT-CHARTER.md#4-definition-of-done):
> tests first, tests fail before the code exists, a deliberate mutation makes them fail again,
> and the spec doc is updated in the same change if behaviour changed.

**Entry gate — run before starting:**

```bash
grep -n "CREATE TABLE session_draft" docs/03-FRONTEND-ARCHITECTURE.md   # G0's schema
grep -n "expo-sqlite" apps/mobile/package.json                          # see 0.1 below
pnpm --filter @volt/mobile test:ci                                      # 125 tests, gate exit 0
pnpm --filter @volt/mobile typecheck
bash scripts/check-client-spec.sh
```

> **The `expo-sqlite` line will fail, and that is expected.** G0 verified it is available in SDK 52
> and G1 did not install it — both said so in their handoffs. **Task 0.1 is to install it and prove
> it opens**, and until that is done the rest of this goal is blocked. Do not start the logger
> against an unproven persistence layer; that is the exact mistake G0 exists to prevent.

## 0 · Prove the persistence layer before building on it

- [ ] **0.1** Install `expo-sqlite` (**~15.1.4**, the SDK-52 pin G0 verified) and **open a database
      in the running app**. Not a unit test — the app, on your target. If it does not open,
      **D14 is wrong** and that is a finding, not a workaround
- [ ] **0.2** Run `PRAGMA journal_mode = WAL` and record what it returns. G0 deliberately did not
      claim WAL works; this is where it gets verified or disproved
- [ ] **0.3** **Settle the Hermes `Intl` question.** `date-fns-tz` needs `Intl.DateTimeFormat` with
      a `timeZone`, and **I7** (the day is the profile's day) depends on it. Assert one DST case
      before the logger buckets anything. If Hermes lacks it, the fallback is to send the offset
      with the write and let the server bucket
- [ ] **0.4** Revisit `forceExit: true` in `apps/mobile/jest.config.js`. A mounted TanStack mutation
      observer keeps the Jest worker alive under jest-expo; G1 narrowed it to library+environment,
      not app code. This goal leans on the harness harder than any before it

## 1 · Server pre-step — the four declared-but-missing endpoints

- [ ] **1.1** `PATCH /session-exercises/{id}` — notes, skipped
- [ ] **1.2** `DELETE /session-exercises/{id}` — re-densify `order_index` in one transaction
- [ ] **1.3** `PUT /workout-sessions/{id}/exercises/order` — bulk reorder, one transaction
- [ ] **1.4** `PATCH /workout-sessions/{id}` — session notes
- [ ] **1.5** All four declare `response_model=Envelope[...]` (**D17**) with real `*Out` models.
      A route that returns `ok(...)` without one documents **nothing** — that cost G1 a rebuild
- [ ] **1.6** Integration tests asserting **status and payload**, never status alone
- [ ] **1.7** Regenerate types and commit the diff

## 2 · Draft store  *(H3.1)*

- [ ] **2.1** Zustand store shaped by [`docs/03` §5.1](03-FRONTEND-ARCHITECTURE.md)
- [ ] **2.2** **Pure reducers** — add / edit / delete a set, reorder, densify indices, recovery
      merge. Unit-tested without React
- [ ] **2.3** Persisted to SQLite on **every committed change**, never on an interval or a debounce
- [ ] **2.4** Mutation-check the densify: G0's charter records a densify that passed on the order the
      ORM happened to emit `UPDATE`s in. Break it deliberately and watch a named test fail

## 3 · Outbox  *(H3.2 — reused by G7 and G9, so build it to be reused)*

- [ ] **3.1** Lives in `apps/mobile/src/lib/offline`, **not** inside the session feature
- [ ] **3.2** Schema exactly as [`docs/03` §5.3](03-FRONTEND-ARCHITECTURE.md) specifies it
- [ ] **3.3** FIFO per aggregate, parallel across aggregates
- [ ] **3.4** Exponential backoff 1 s → 60 s **with jitter**
- [ ] **3.5** Terminal 4xx (except 408/409/429) surfaced in a failed list, **never silently dropped**
- [ ] **3.6** Flush triggers: `netinfo` reachability, `AppState` → active, auth refresh, manual retry.
      There is no `online` window event on a phone (`docs/03` §7)
- [ ] **3.7** **The draft write and the outbox enqueue are ONE transaction** (`docs/03` §5.2). That
      single requirement is why D14 chose a database over key-value; a torn pair is a lost or
      duplicated set
- [ ] **3.8** Test idempotent replay: the same write arriving twice must UPDATE, never append

## 4 · The logger screens

- [ ] **4.1** **E-01** start — today's plan / repeat / empty / past date
- [ ] **4.2** **E-02** session exercise list — set dots, progress, add/swap via `ExercisePicker`
      (**H2.2**, `max={1}` is swap), finish
- [ ] **4.3** **E-03 set logger** — steppers, repeat-set, previous performance always on screen,
      per-set delta, sync dot. Fields driven by `tracks_*`, exactly as C-07 does (**G2 proved this
      shape**; reuse `trackedFields`, do not re-derive it)
- [ ] **4.4** **E-04** rest timer — counts to a target instant so backgrounding cannot drift it
- [ ] **4.5** **E-08** finish summary — computed client-side from the draft so it renders instantly
- [ ] **4.6** **E-09** discard — names the exact count of what will be lost
- [ ] **4.7** **E-10** recovery — resume / finish / discard on relaunch (**H3.3**)
- [ ] **4.8** **E-11** PR celebration — **after** the summary, never mid-set

## 5 · Invariants this goal must not break

- [ ] **5.1** **I10 — the set-commit path never awaits the network.** The render precedes all
      persistence. This is the one invariant the whole design exists to protect
- [ ] **5.2** **I1 — the plan tree is not the performed tree.** The logger reads
      `target_snapshot`, never the live plan
- [ ] **5.3** **I3** warm-ups excluded from volume and PRs · **I5** Epley as `epley_v1`
- [ ] **5.4** **I7** — the day is the profile's day (see 0.3)

## 6 · Close-out

- [ ] **6.1** Tracker: screens built, test counts, coverage, M2 status
- [ ] **6.2** Tick **H3.1–H3.4** in the [handoff ledger](10-EXECUTION-GOALS.md#3--the-handoff-ledger)
- [ ] **6.3** Append the G3 handoff record to the tracker changelog
- [ ] **6.4** Replace this file with **G4**'s tasks
- [ ] **6.5** Commit

---

## Carried over

- [ ] **DR4** — verify on a physical device via Expo Go. Runner chosen (**Maestro**,
      [D15](08-PROJECT-CHARTER.md#6-decision-log)), installed in **G4**
- [ ] **Coverage** — `src/lib/session.tsx` is still 0%; the six G2 route files have no component
      tests of their own. Ramp target is 80% global by **G4** ([D18](08-PROJECT-CHARTER.md#6-decision-log))
- [ ] **C-05 reorder is ↑/↓ buttons, not the wireframe's `⠿` drag.** Needs
      `react-native-gesture-handler`, another dependency unverifiable on web — **G4**
- [ ] **`@shopify/flash-list`** — removed in G2 after it crashed the web build. `src/ui/VirtualList`
      is the seam; put it back in **G4** once a device can verify it
- [ ] **No row menus** on D-01/C-02/C-03 (archive, duplicate, delete). Endpoints exist, affordances
      do not. C-04, C-08, C-09 and D-04 were never in G2's scope
- [ ] The Android SDK is installed but unconfigured — decide in **G4**
- [ ] `apps/mobile` still ships `react-native-web`; web is deferred ([D1](08-PROJECT-CHARTER.md#6-decision-log))

## Blocked — needs a decision from the user

- [ ] **Q1** nutrition database provider — blocks M5/M6, and a licensing attribution requirement
- [ ] **Q9** minimum age / legal position — blocks A-07
