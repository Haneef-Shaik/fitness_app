# TODO — active work

**Goal:** G7 · Nutrition core — log food, watch the day move →
[contract](10-EXECUTION-GOALS.md) · [tracker](09-PROJECT-TRACKER.md) · [charter](08-PROJECT-CHARTER.md)
**Exit:** **AC-07** end to end · a food's nutrition can be edited **without** changing a meal already
logged · only `confirmed = true` reaches totals · **8 of 12** acceptance criteria proven

> This file holds **only the work in flight**. Milestone status lives in the tracker — it is not
> repeated here, because a status maintained in two places drifts.
>
> A task is done when it meets the [Definition of Done](08-PROJECT-CHARTER.md#4-definition-of-done):
> tests first, tests fail before the code exists, a deliberate mutation makes them fail again,
> and the spec doc is updated in the same change if behaviour changed.

---

## 🔴 Q1 is still unanswered — and does not block the start

**[Q1](01-PRD.md#13-open-questions): which nutrition database provider?** Still open
([DR2](08-PROJECT-CHARTER.md#7-delivery-risks) 🟡). It carries a **licensing attribution
requirement**, which is a product and legal decision, not an engineering one.

G7's own contract is explicit that this need not stop work: build the **resolver interface** first
and put an internal seeded catalog behind it. A provider then becomes one more implementation rather
than a rewrite — the same shape `app/seed/catalog.py` already uses for exercises.

- [ ] **0.1** `FoodResolver.search(query) -> Candidate[]` / `resolve(ref) -> Food`
- [ ] **0.2** An internal-catalog implementation that works standalone
- [ ] **0.3** Nothing above the interface knows which implementation it has — the test for that is
      swapping it in a test double and having every screen still pass

**Ask the user before M5 ships**, because attribution text has to appear in the UI and that is not
something to retrofit.

## 1 · The rule that makes AC-12's sibling hold

- [ ] **1.1** Macros are **denormalised onto `meal_items`** ([02 §4.2](02-SYSTEM-ARCHITECTURE.md)).
      A food's nutrition can be corrected later and a meal already logged must **not** change.
      This is the nutrition analogue of `target_snapshot`, and it fails the same way: quietly,
      months later, on data nobody is looking at
- [ ] **1.2** **Only `confirmed = true` counts** (D5). Wire it at the **query layer, once**, so no
      later screen can forget — a per-screen filter is a per-screen bug waiting

## 2 · Models and endpoints

- [ ] **2.1** `foods`, `meals`, `meal_items`, with a reversible migration and `alembic check` clean
- [ ] **2.2** `/foods`, `/meals`, `/meal-items`, `/recipes`
- [ ] **2.3** Every list uses **H5.1's cursor** (`CursorEnvelope` + `app/api/cursor.py`)
- [ ] **2.4** Any number gets its definition in the domain module **and** a shared vector before it
      is charted. G6's adherence is the worked example

## 3 · Offline writes reuse the outbox

- [ ] **3.1** Meals queue through **H3.2**, which is already generic. If it turns out not to be,
      that is a G3 defect to fix here rather than a second queue to write
- [ ] **3.2** The G4 lesson applies: the drain must be re-armed by something that is **not** a user
      action. `startOutboxPump` already is — check meals ride it

## 4 · Screens H-01…H-05, H-10…H-13, H-15, H-16

- [ ] **4.1** Charts reuse **H6.1** (`src/ui/charts/`). Macros are slots 1–3, and **fat is always
      directly labelled** — aqua sits at 2.82:1 on light, below the 3:1 floor (05 §3.1)
- [ ] **4.2** Every macro chart ships a **table view**, for the same reason
- [ ] **4.3** Every new read gets a key in `queryKeys.ts` **and** a line in
      [03 §6.2](03-FRONTEND-ARCHITECTURE.md). **Ask what makes each read stale**, not just what
      creates it — G5 missed the reopen case that way

## 5 · AC-07

- [ ] **5.1** A manually logged meal changes today's total **immediately**, on the user's **local**
      date (I7)

## 6 · Close-out

- [ ] **6.1** Tracker: **8 of 12**; append the G7 handoff record
- [ ] **6.2** Tick **H7.1**, **H7.2** in the [handoff ledger](10-EXECUTION-GOALS.md#3--the-handoff-ledger)
- [ ] **6.3** Re-measure the coverage remainder and **raise the ratchet** (D18)
- [ ] **6.4** Replace this file with G8's tasks
- [ ] **6.5** Commit

---

## Carried over

- [ ] **The charts have never rendered on a device.** They pass in both themes in tests, but G4's
      lesson is that a test render is not a phone. Owed a device pass — and the emulator cannot
      drive touch (below), so that means the physical phone
- [ ] **The emulator cannot drive touch.** `scripts/emulator.sh` boots, the app loads and SQLite
      opens, but `onPress` never fires — verified with an instrumented handler on a bundle confirmed
      to contain it. Overlays, input injection, coordinates, stale bundles, GPU/keyboard config and
      the New Architecture are all ruled out. Next thing to try is a different system image
      (API 35/36)
- [ ] **The E2E CI workflow has never executed.** It builds a debug APK, so the flows' `appId` and
      the Expo Go `openLink` need parametrising
- [ ] **D16 is missed**: tap → set rendered p95 **396.4 ms** over 99 commits, **118.7 ms** over 9,
      against 100 ms. A baseline near 110 ms **plus** growth with list length, because every commit
      re-renders the whole set list. Memoising the row or virtualising the list is the fix
- [ ] **G-07 shares G-03's screen**, and there is no chart tooltip — 05 §3.5's hovered label has no
      touch equivalent yet
- [ ] **F-04 is an entry point, not an editor**
- [ ] **Jest still force-exits a worker**; `forceExit` is deliberately not coming back
- [ ] **E-05 / E-06 / E-07 / E-12**; no row menus on D-01/C-02/C-03; C-04, C-08, C-09, D-04 unbuilt

## Blocked — needs a decision from the user

- [ ] **Q1** nutrition database provider — **G7's stated entry gate**. Work can start behind the
      resolver interface, but the provider and its attribution text are owed before M5 ships
- [ ] **Q9** minimum age / legal position — blocks A-07
