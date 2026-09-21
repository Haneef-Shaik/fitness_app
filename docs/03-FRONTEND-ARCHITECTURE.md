# Frontend Architecture
## Fitness & Nutrition Tracking Platform

Companion to [04-SCREEN-ARCHITECTURE](04-SCREEN-ARCHITECTURE.md) (what the screens are) and
[wireframes/](wireframes/) (what each screen does). This document covers *how the client is built*.

---

## 1. The constraint that shapes everything

> **A user logs a set standing at a rack, one-handed, with 40 seconds of rest left.**

Everything below follows from that:

- A set commit **never awaits the network**. It writes to local state, renders instantly, and
  syncs behind the scenes.
- The active session is **durable** — survives a refresh, a crash, a call, a battery death.
- No spinner may ever appear between "user typed reps" and "set is on screen".
- Tap targets in the logger are ≥ 56 px tall. Numeric inputs open a numeric keypad.
- Previous performance is **already on screen**, never behind a tap.

Screens outside the logger (planning, analytics, settings) may be conventional request/response.

---

## 2. Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | **Next.js (App Router) + TypeScript**, installed as a PWA | BRD §17; one codebase covers the mobile-first client and the desktop analytics surface |
| Styling | Tailwind CSS + CSS custom properties for tokens | Tokens live in CSS vars so theming and the RN port share one source |
| Components | shadcn/ui (Radix primitives) as the base layer | Accessible primitives out of the box — dialogs, sheets, popovers, focus management |
| Server state | **TanStack Query** | Caching, invalidation, optimistic mutations, retry semantics |
| Client state | **Zustand** slices | Active workout draft, filters, UI prefs — small and non-server |
| Forms | react-hook-form + Zod resolvers, schemas shared with the API | One validation definition per boundary |
| Charts | Recharts | Volume, e1RM, weight, calorie and macro charts (see design system for the viz rules) |
| Local persistence | IndexedDB via Dexie | Session draft + write outbox |
| Dates | date-fns + date-fns-tz | Profile-timezone-aware day bucketing |
| Tests | Vitest + React Testing Library (unit/integration), Playwright (E2E) | 80% coverage floor per house rules |
| i18n | next-intl, English-only content at MVP | Strings externalised from day one; no hardcoded copy |

---

## 3. Project structure

Organised **by feature/domain, not by file type** (house rule), with the shared kernel at the root.

```
src/
├── app/                              # Next.js App Router — routing only, thin
│   ├── (auth)/                       #   unauthenticated group
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (onboarding)/onboarding/[step]/page.tsx
│   ├── (app)/                        #   authenticated shell: tab bar / rail
│   │   ├── layout.tsx                #   AppShell + auth guard + outbox mount
│   │   ├── page.tsx                  #   B-01 Dashboard
│   │   ├── train/…                   #   C-*, D-*, E-*, F-*, G-*
│   │   ├── nutrition/…               #   H-*
│   │   ├── progress/…                #   I-*, J-*
│   │   └── settings/…                #   K-*
│   └── session/[id]/…                #   E-02/E-03 — full-screen, outside the tab shell
│
├── features/                         # one folder per domain; the app's real surface area
│   ├── auth/            { api/ components/ hooks/ schemas/ }
│   ├── onboarding/
│   ├── dashboard/       { cards/ registry.ts }        ← dashboard cards are a registry (C01.6)
│   ├── exercises/
│   ├── programs/
│   ├── workout-session/ { store/ components/ engine/ }← the logger; see §5
│   ├── history/
│   ├── workout-analytics/
│   ├── nutrition/       { diary/ food-search/ ai-review/ recipes/ }
│   ├── food-ai/         { upload/ polling/ }
│   ├── body-metrics/
│   ├── goals/
│   └── settings/
│
├── components/                       # cross-feature, domain-free
│   ├── ui/                           #   shadcn primitives (Button, Sheet, Dialog…)
│   ├── layout/                       #   AppShell, TabBar, DesktopRail, PageHeader
│   ├── feedback/                     #   EmptyState, ErrorState, Skeleton, Toast, OfflineBanner
│   ├── data/                         #   DataBoundary, InfiniteList, FilterChips
│   └── charts/                       #   themed Recharts wrappers
│
├── lib/
│   ├── api/                          #   typed client, envelope unwrap, error mapping, idempotency
│   ├── query/                        #   QueryClient config, queryKeys registry, invalidation map
│   ├── offline/                      #   Dexie schema, outbox, sync engine, conflict detection
│   ├── units/                        #   kg↔lb, cm↔in, g↔oz — conversion ONLY at the display edge
│   ├── datetime/                     #   profile-tz day bucketing, local_date helpers
│   ├── nutrition/                    #   macro math, target/remaining, confirmed-only aggregation
│   ├── training/                     #   volume, e1RM (epley_v1), PR evaluation — mirrors the server
│   ├── analytics-events/             #   the client event taxonomy
│   └── auth/                         #   token handling, route guards
│
├── domain/                           # pure types + invariants, zero React, portable to RN
│   ├── types/                        #   entity types generated from the shared Zod schemas
│   └── rules/                        #   set validity, previous-performance selection, PR rules
│
└── styles/tokens.css                 # the design-token source of truth
```

**Rules of the structure**
1. `app/` contains routing and layout composition only. No business logic, no data fetching beyond
   a prefetch call.
2. A `features/*` folder may not import from another `features/*` folder. Shared needs move down
   into `lib/`, `domain/` or `components/`.
3. `domain/` is pure TypeScript with no framework imports — it is the part React Native reuses.
4. Files stay under ~400 lines; a component over 200 lines is a refactor signal.
5. **Immutability everywhere.** Store updates return new objects; no in-place mutation of server
   cache, draft state or props (house rule).

---

## 4. App shell & routing

### 4.1 Shell
| Breakpoint | Chrome |
|------------|--------|
| < 768 px (primary) | Top app bar (contextual) + **bottom tab bar, 5 items** + centre FAB |
| 768–1023 px | Same tabs, wider content column, two-column cards where useful |
| ≥ 1024 px | **Left navigation rail** (labelled), no bottom bar, multi-column dashboards, side-by-side compare views |

**Full-screen routes that escape the shell** (no tab bar, no back-swipe-to-tab): the active workout
session, camera capture, AI review, and any modal wizard. These are *tasks*, and leaving them must be
a deliberate, confirmed act.

### 4.2 Route table
See [04-SCREEN-ARCHITECTURE §4](04-SCREEN-ARCHITECTURE.md#4-route-table) for the complete list of
routes mapped to screen IDs.

### 4.3 Navigation rules
- Tab switches **preserve each tab's scroll position and stack**.
- Modals and sheets are URL-addressable where the content is shareable/deep-linkable
  (`?sheet=filters`), and local state where it is not (a rest timer).
- The browser/system back button always does the least surprising thing: closes a sheet before
  popping a route; asks for confirmation before abandoning an active session or unsaved AI review.
- Deep links resolve to the correct authenticated destination after login (`?next=`).

---

## 5. The workout-session engine (the critical path)

The one place where a standard "form → mutation → refetch" pattern is unacceptable.

### 5.1 State shape
```ts
// features/workout-session/store — Zustand + Dexie persistence
type SessionDraft = Readonly<{
  sessionId: string            // server-issued, or a client UUID until the server confirms
  planDayId: string | null
  startedAt: string            // ISO, UTC
  status: 'in_progress'
  exercises: readonly DraftExercise[]
  notes: string
  revision: number             // bumps on every local change; drives outbox ordering
}>

type DraftExercise = Readonly<{
  clientId: string
  exerciseId: string
  orderIndex: number
  targetSnapshot: PrescriptionSnapshot | null   // frozen from the plan at start
  previousPerformance: PreviousPerformance | null | 'loading' | 'never'
  sets: readonly DraftSet[]
  notes: string
}>

type DraftSet = Readonly<{
  clientId: string             // idempotency key for the server write
  setIndex: number
  setType: 'warmup' | 'working' | 'drop' | 'failure'
  reps: number | null
  loadKg: number | null
  loadUnitEntered: 'kg' | 'lb'
  durationSeconds: number | null
  distanceM: number | null
  rpe: number | null
  rir: number | null
  completed: boolean
  performedAt: string
  syncState: 'pending' | 'syncing' | 'synced' | 'failed'
}>
```

### 5.2 Set-commit flow
```
user taps ✓ on a set
   │
   ├─▶ validate locally (domain/rules/set-validity)      ~0 ms
   ├─▶ reducer returns a NEW draft with the set appended  ~0 ms   ← UI updates here
   ├─▶ persist draft to IndexedDB                        ~2 ms
   ├─▶ enqueue { POST /session-exercises/:id/sets, Idempotency-Key: set.clientId }
   ├─▶ start the rest timer if configured
   └─▶ prefill the next set from this one
                     │
                     ▼  (background, invisible unless it fails)
              outbox flush → 200 → syncState = 'synced'
                           → 5xx/offline → retry with backoff, stays 'pending'
                           → 4xx validation → syncState = 'failed', surface inline (never a modal)
```
The UI is **never** blocked on the network. A per-set sync dot communicates state without
demanding attention.

### 5.3 Durability & recovery
- The draft is written to IndexedDB on every committed change, not on an interval.
- On app start, `lib/offline/recover` checks for a draft whose `status = in_progress`.
  If found → **E-10 Recovery** offers *Resume*, *Finish now*, or *Discard*.
- The server is also asked for `GET /workout-sessions/active`. If both exist and disagree, the one
  with more sets wins and the difference is reconciled by replaying the outbox (sets are
  idempotent on `clientId`, so replay is safe).
- A draft older than 24 h prompts before resuming rather than silently continuing.

### 5.4 Previous performance
Fetched per exercise as the session opens, **in parallel and non-blocking**. Cached by
`['previous-performance', exerciseId]`. While loading, the slot shows a skeleton and entry stays
fully usable. A failure degrades to "couldn't load last time" with a retry chip — never an error
screen, never a blocked input.

---

## 6. Data layer

### 6.1 Query keys
A single registry (`lib/query/queryKeys.ts`) so invalidation is explicit and greppable:
```ts
export const qk = {
  dashboard:        (date: string)            => ['dashboard', date] as const,
  session:          (id: string)              => ['session', id] as const,
  activeSession:    ()                        => ['session', 'active'] as const,
  previousPerf:     (exerciseId: string)      => ['previous-performance', exerciseId] as const,
  history:          (f: HistoryFilters)       => ['history', f] as const,
  exercise:         (id: string)              => ['exercise', id] as const,
  exerciseStats:    (id: string, r: Range)    => ['exercise', id, 'stats', r] as const,
  diary:            (date: string)            => ['diary', date] as const,
  meal:             (id: string)              => ['meal', id] as const,
  analysis:         (id: string)              => ['food-analysis', id] as const,
  nutritionRange:   (r: Range, g: Grain)      => ['analytics', 'nutrition', r, g] as const,
  workoutAnalytics: (r: Range, g: Grain)      => ['analytics', 'workouts', r, g] as const,
  bodyMetrics:      (r: Range)                => ['body-metrics', r] as const,
} as const
```

### 6.2 Invalidation map
| Mutation | Invalidates |
|----------|-------------|
| Commit / edit / delete a set | `session(id)` (optimistic, no refetch) |
| Finish a session | `activeSession`, `dashboard`, `history(*)`, `workoutAnalytics(*)`, `exerciseStats(*)`, PR queries |
| Edit a past session | `history(*)`, `workoutAnalytics(*)`, `exerciseStats(affected)`, PR queries |
| Add / edit / delete a meal item | `meal(id)`, `diary(date)`, `dashboard(date)`, `nutritionRange(overlapping)` |
| Confirm an AI analysis | `analysis(id)`, `meal(id)`, `diary(date)`, `dashboard(date)` |
| Log a body metric | `bodyMetrics(*)`, `dashboard(date)`, goal progress |
| Edit a program | `programs`, `program(id)` — **never** history or analytics (AC-12) |
| Change targets | `dashboard`, `nutritionRange(*)` display only — never stored history |

### 6.3 Caching policy
| Data | staleTime | Notes |
|------|-----------|-------|
| Dashboard | 30 s | Refetch on focus and on any relevant mutation |
| Active session | ∞ | Local draft is authoritative while in progress |
| Previous performance | 5 min | Immutable for the duration of a session |
| Exercise catalog | 1 h | Rarely changes; prefetch at app start for instant pickers |
| History list | 2 min | Cursor-paginated, `keepPreviousData` on filter change |
| Analytics | 5 min | Expensive; show the previous range while the new one loads |
| Diary | 30 s | |
| Food search | 5 min per query string | Debounced 300 ms, request deduped |
| AI analysis | poll 2 s → 5 s backoff, cap 90 s | Stop on `completed`/`failed` |

### 6.4 The `DataBoundary` component
Every async surface renders through one component so that loading / empty / error / offline states
are **structurally impossible to forget**:

```tsx
<DataBoundary
  query={q}
  skeleton={<SessionListSkeleton/>}
  empty={{ icon: 'dumbbell', title: 'No workouts yet',
           body: 'Your completed sessions will appear here.',
           action: { label: 'Start a workout', href: '/train/start' } }}
  error={{ retry: true, supportRef: true }}
  offline={{ allowStale: true }}   // renders cached data + an offline badge
>
  {(data) => <SessionList sessions={data}/>}
</DataBoundary>
```
State precedence is fixed: `offline-with-no-cache → error → loading → empty → content`.

---

## 7. Offline & sync

| Capability | MVP | Phase 2 |
|------------|-----|---------|
| Active session logging offline | ✅ Full — the entire session works with no network | |
| Write outbox with retry + idempotency | ✅ Sets, session finish, meal items, body metrics | |
| Read cached data offline | ✅ Whatever TanStack Query has, flagged stale | |
| Create a *new* meal offline | ✅ (manual entry; AI requires network and says so) | |
| Full bidirectional sync of all entities | — | ✅ `/sync/push`, `/sync/pull` |
| Conflict resolution UI | Minimal (L-07, last-writer-wins + notice) | Field-level merge |

**Outbox design** (`lib/offline/outbox`):
- FIFO per aggregate, parallel across aggregates.
- Each entry: `{ id, method, path, body, idempotencyKey, aggregateId, attempts, nextAttemptAt, createdAt }`.
- Retries: exponential backoff 1 s → 2 s → 4 s … capped at 60 s, with jitter.
- `4xx` (except 408/409/429) is terminal → the entry moves to a **failed** list surfaced in the
  Sync Center (L-02), never silently dropped.
- Flush triggers: `online` event, app foreground, successful auth refresh, manual retry.
- The user sees outbox state only when it matters: a pending count in the Sync Center, and an
  inline badge on a failed item.

---

## 8. Units, dates and numbers

**Three rules that prevent an entire class of bug:**

1. **Canonical in, canonical out.** State and the API hold `kg`, `cm`, `g`, `ml`, seconds, metres.
   Conversion happens in `lib/units` at render time and at input parse time, nowhere else.
   A converted value is never written back to state.
2. **Round for display, never for storage.** Display rounds to the sensible precision
   (load 0.5 kg / 1 lb, weight 0.1, macros 1 g, calories 1 kcal). Stored values keep full precision.
   `100 kg → 220.5 lb → back to kg` must still be exactly `100`.
3. **The day is the profile's day.** `lib/datetime/toLocalDate(instant, profile.timezone)` is the
   only way to derive a calendar date. `new Date().toDateString()` is banned by lint rule.

Number inputs in the logger use `inputMode="decimal"`, accept both `.` and `,`, and never use a
native spinner. Increment/decrement steppers sit beside the field with unit-aware steps
(±2.5 kg / ±5 lb by default, configurable).

---

## 9. Performance budget

| Metric | Budget |
|--------|--------|
| LCP (dashboard, 4G, mid-tier Android) | < 2.5 s |
| INP overall | < 200 ms |
| **INP for a set commit** | **< 100 ms** |
| Initial JS on the auth'd shell | < 180 KB gzip |
| Route chunk | < 90 KB gzip |
| Chart libraries | lazily loaded, never in the main bundle |

**Techniques.** Server Components for static/analytics shells; client components only where there is
interaction. Route-level code splitting, with the logger route preloaded from the dashboard the
moment a "Start workout" affordance is visible. Virtualised lists for history, food search and the
exercise catalog. Images served as AVIF/WebP with explicit dimensions to prevent CLS. The active
session bundle contains no chart code.

---

## 10. Error handling

Four levels, and nothing is allowed to fall through:

1. **Field** — inline, below the input, with the fix stated ("Reps must be at least 1").
2. **Action** — a toast with an undo or retry affordance. Destructive actions always offer undo
   instead of a pre-confirmation, *except* irreversible ones (delete account, discard session).
3. **Surface** — the `DataBoundary` error state with a retry and a support reference (`request_id`).
4. **App** — a route-level error boundary with a reload path, reporting to the error tracker.

**Never**: a raw stack trace, an error code with no plain-language sentence, an alert that blocks the
workout logger, or a silently swallowed failure (house rule).

Full taxonomy in [06-EDGE-CASES](06-EDGE-CASES.md).

---

## 11. Testing strategy (80% floor, TDD per house rules)

| Layer | Tool | What must be covered |
|-------|------|----------------------|
| Domain rules | Vitest | Volume, e1RM, PR evaluation, set validity, previous-performance selection, unit conversion round-trips, timezone bucketing incl. DST |
| Stores/reducers | Vitest | Session draft reducers — add/edit/delete set, reorder, densify indices, recovery merge |
| Components | RTL | Every state of `DataBoundary`; logger keyboard/tap flows; AI review edit paths |
| Offline | Vitest + fake IndexedDB | Outbox ordering, idempotent replay, terminal-failure handling |
| Integration | RTL + MSW | Full flows against a mocked API |
| E2E | Playwright | AC-01…AC-12, plus: log a session offline and watch it sync; recover a killed session; correct an AI item and verify totals move only on confirm |
| A11y | axe + manual | Keyboard-only session logging; screen-reader pass on the diary and logger |
| Visual | Playwright snapshots | Both themes, at 375 / 768 / 1440 px |

---

## 12. Client analytics events

Named `domain.object_action`, with `request_id` correlation where a server call is involved.

| Event | Key properties |
|-------|----------------|
| `session.started` | `source: plan\|template\|empty\|repeat`, `plan_day_id` |
| `session.set_committed` | `set_type`, `has_rpe`, `interaction_ms`, `was_prefilled`, `offline` |
| `session.finished` | `duration_s`, `exercise_count`, `set_count`, `volume_kg`, `pr_count` |
| `session.abandoned` | `sets_logged`, `reason: discard\|timeout\|crash` |
| `session.recovered` | `age_minutes`, `choice` |
| `history.previous_occurrence_viewed` | `filter_type`, `widened: bool` |
| `nutrition.entry_started` | `mode: search\|text\|photo\|quick\|recent\|recipe\|barcode` |
| `ai.analysis_requested` | `input_type`, `image_count` |
| `ai.analysis_completed` | `duration_ms`, `item_count`, `mean_confidence`, `unresolved_count` |
| `ai.item_edited` | `field`, `confidence_before` |
| `ai.analysis_confirmed` | `edited_item_count`, `removed_count`, `added_count` |
| `ai.analysis_failed` | `error_code` |
| `offline.outbox_flushed` | `entries`, `max_age_s`, `failures` |
| `target.updated` | `type: calories\|macro\|weight` |

`ai.item_edited` volume against `ai.analysis_confirmed` is the product's honest measure of model
quality (Risk R1).
