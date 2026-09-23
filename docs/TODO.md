# TODO — active work

**Goal:** G8 · AI nutrition — estimation that never becomes the record →
[contract](10-EXECUTION-GOALS.md) · [tracker](09-PROJECT-TRACKER.md) · [charter](08-PROJECT-CHARTER.md)
**Exit:** **AC-08, AC-09, AC-10** · a correction wins and the raw analysis is **byte-identical**
afterwards · killing the AI service leaves the logger fully working · **11 of 12** acceptance
criteria proven

> This file holds **only the work in flight**. Milestone status lives in the tracker — it is not
> repeated here, because a status maintained in two places drifts.
>
> A task is done when it meets the [Definition of Done](08-PROJECT-CHARTER.md#4-definition-of-done):
> tests first, tests fail before the code exists, a deliberate mutation makes them fail again,
> and the spec doc is updated in the same change if behaviour changed.

---

## Entry gate — run this first

```bash
cd /Users/Adya/personals/fitness_app
grep -n "H7.1\|H7.2" docs/10-EXECUTION-GOALS.md | grep "✅"
grep -n "I12" docs/07-TRACEABILITY.md
uv --directory services/api run pytest -q && pnpm --filter @volt/mobile test
```

**H7.1 and H7.2 must be recorded**, or G7 is not finished. The suites must be green before a line
is written — G8 builds on the meal aggregate, and a red baseline makes every later failure
ambiguous.

## What you inherit — verify, do not assume

| ID | From | Claim | Check |
|----|------|-------|-------|
| **H7.1** | G7 | `FoodResolver` is a Protocol with a substitutable implementation | Write the AI resolver as a **second implementation**. If it needs the interface changed, say so in the handoff rather than reaching around it |
| **H7.2** | G7 | `meal_items` snapshot their macros; only `confirmed = true` reaches a total | An AI item arrives `confirmed = false` and must move **no** number until someone confirms it |
| **H3.2** | G3 | The outbox is generic and idempotent | An analysis is a server-side job, not an offline write — do not queue it |

## 🔴 Q1 is still unanswered

**[Q1](01-PRD.md#13-open-questions): which nutrition database provider?** Still open
([DR2](08-PROJECT-CHARTER.md#7-delivery-risks) 🟡 — **narrowed** by G7, not closed). It no longer
blocks the core: G7 shipped AC-07 on a 22-food internal catalog behind the resolver. What it still
blocks is **coverage** — branded products, barcode lookup (H-17) — and the **licensing attribution
requirement**, which is a product and legal decision.

It matters more in G8 than it did in G7: an AI estimate has to *resolve* to something, and how good
the resolution is depends entirely on what the catalog contains.

- [ ] **0.1** Ask the user, and record the answer in [charter §6](08-PROJECT-CHARTER.md#6-decision-log)
- [ ] **0.2** Until then, the AI resolver ladder falls back to an **unresolved item**
      (`food_id = NULL` with its own macros), which G7 already supports — not to a wrong food

## 1 · Append-only is a property of the code, not a promise

- [ ] **1.1** `food_analyses` / `food_analysis_items` with a reversible migration, `alembic check`
      clean. **No `UPDATE` path exists in code** — that is the test, not a comment
- [ ] **1.2** **AC-10's assertion is byte-identity**, not field equality: hash the analysis row
      before the correction and after, and compare the hashes
- [ ] **1.3** `meal_items.analysis_item_id` gets its FK now that the table exists (G7 left it as a
      bare UUID on purpose — a FK to a table that does not exist is not a migration)

## 2 · Containment is a hard requirement

- [ ] **2.1** The worker is a **separate process**. Killing it leaves training, logging, history and
      analytics completely untouched — and there is a test that kills it
- [ ] **2.2** The gateway has a **timeout** and a strict JSON schema. A malformed model response is
      a handled error, never a 500
- [ ] **2.3** A failed analysis degrades H-08 to manual entry with a plain sentence saying so
- [ ] **2.4** **Never auto-confirm above a confidence threshold** (Q7 → no, BRD §12.7)

## 3 · Estimated never looks like confirmed (I12)

- [ ] **3.1** Dashed border and an "Est." chip, in **both themes** — G6's lesson: a single-theme
      render proves nothing
- [ ] **3.2** It adds nothing to any total until confirmed. G7 enforces this in one place
      (`app.domain.nutrition.day_totals`); G8 must not add a second
- [ ] **3.3** Confirming with an edit sets `user_corrected = true`; confirming without one does not.
      G7's `PATCH /meal-items/{id}` already draws that line — reuse it

## 4 · Uploads

- [ ] **4.1** Signed upload URLs; **EXIF stripped client and server side**. Both, because either one
      alone is a single point of failure for location data
- [ ] **4.2** Size and type validated at the boundary, before anything is stored

## 5 · Screens H-06…H-09, H-18

- [ ] **5.1** H-06 describe a meal · H-07 photograph one · H-08 the review sheet · H-09 the result
- [ ] **5.2** H-18 analysis history — the audit trail, with "delete all photos"
- [ ] **5.3** Every screen tested, and the coverage ratchet raised afterwards (D18) — never lowered

## 6 · Close the goal

- [ ] **6.1** Tracker: **11 of 12**, screens, test counts, the migration
- [ ] **6.2** Tick **H8.1–H8.2** in the [handoff ledger](10-EXECUTION-GOALS.md#3--the-handoff-ledger)
- [ ] **6.3** Replace this file's active section with **G9**'s tasks
- [ ] **6.4** Commit: `feat: AI nutrition — estimation that never becomes the record (G8)`

---

## Carried forward from G7

- **Q8 is open and now visible to users.** Calorie targets are **not versioned**, so Volt cannot say
  what a past day's target was. H-15 therefore says only that nothing already logged is rewritten —
  deliberately narrower than the wireframe's "past days keep the numbers they had", which would be a
  claim the schema cannot support. Answer Q8 before H-01 grows date navigation
- **No screen sets `birth_date`, `sex` or `height_cm`.** The API accepts all three and H-15's
  calculator needs them; onboarding does not collect them and there is no profile screen. H-15 names
  what it is missing and falls back, but the gap is real and belongs to **G9**'s profile work
- **H-14 and H-17 were not in G7's scope** and are not built: nutrition analytics (P0) and the
  barcode scanner (P2). H-14 needs `daily_summaries`, which is G9's
- **`scripts/e2e.sh` has no nutrition flow.** AC-07 is proven by API and client tests, not on
  hardware. The Maestro suite still covers AC-01/02/04/05 only
