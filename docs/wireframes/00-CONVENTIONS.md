# Wireframe Conventions

How to read every file in this folder.

---

## 1. Notation

```
┌─ ─┐ │ └─ ─┘   screen or container boundary
[ Button ]       primary button
( Button )       secondary / ghost button
< Back           back affordance
{ ... }          dynamic value bound to data
⌄ / ⌃            expand / collapse
⋮                overflow menu
✓                commit / confirm control
◉ ○              selected / unselected radio
☑ ☐              checked / unchecked
━━━━             filled progress
░░░░             unfilled progress
▁▃▅▇             sparkline
⚠ ✦ ⏱ 🏆 📷      warning · AI-derived · timer · PR · camera
~~~              skeleton / loading placeholder
─ ─ ─            dashed border = ESTIMATED / unconfirmed value
```

Wireframes are drawn at **mobile width (~390 px)** unless labelled `DESKTOP`. Desktop variants are
described in prose where they differ structurally.

## 2. Screen spec template

Every screen is documented with the same sections. If a section is absent, it genuinely does not
apply to that screen.

| Section | Contains |
|---------|----------|
| **ID · Name · Route · Type · Priority** | Cross-reference to [04-SCREEN-ARCHITECTURE](../04-SCREEN-ARCHITECTURE.md) |
| **Purpose** | One sentence: the job this screen does |
| **Entry points** | Every screen/action that can land the user here |
| **Exits** | Every way out, and where each goes |
| **Wireframe** | The layout |
| **Regions** | Each numbered area of the layout explained |
| **Controls** | **Every** interactive element: label → action → result → failure |
| **Data** | API calls, entity fields read/written |
| **States** | Loading · empty · partial · error · offline · permission-denied, as applicable |
| **Validation** | Field rules and their messages |
| **Edge cases** | Everything that can go wrong or be unusual here |
| **Keyboard / a11y** | Focus order, shortcuts, announcements |
| **Events** | Client analytics emitted |

## 3. Universal rules (assumed on every screen, never repeated)

1. **Back never destroys data silently.** Any screen with unsaved input intercepts back/close and
   asks, or autosaves a draft.
2. **Every list** has loading, empty, error and end-of-list states, rendered through `DataBoundary`.
3. **Every destructive action** is either undoable via a toast, or confirmed via a dialog. Never both,
   never neither.
4. **Every screen works offline** either fully, or with an explicit banner stating what is unavailable.
5. **Every value shows its unit**, in the user's display unit system, converted from canonical storage.
6. **Every date** is the user's local date, derived from `user_profiles.timezone`.
7. **Every AI-derived value** carries the ✦ sparkle and, until confirmed, the dashed `─ ─ ─` treatment
   and an "Est." chip.
8. **Pull-to-refresh** is available on every tab root.
9. **The active-session bar** (§4) appears on every screen in the shell while a session is in progress.
10. **Failure never blocks the logger.** A sync failure is a dot on a row, not a modal.

## 4. The app shell

```
┌──────────────────────────────────────────────────┐
│ ① ☰?   Screen title             🔔 ②   (avatar)③ │  top app bar (contextual)
├──────────────────────────────────────────────────┤
│ ④ ⚡ Chest & Triceps · 24:13 · 8 sets   [Resume] │  active-session bar (conditional)
├──────────────────────────────────────────────────┤
│ ⑤ ⛅ Offline — logging still works   [Details]   │  offline banner (conditional)
├──────────────────────────────────────────────────┤
│                                                  │
│                  SCREEN CONTENT                  │
│                                                  │
├──────────────────────────────────────────────────┤
│   🏠       🏋️      ╭───╮      🍎        📈       │  bottom tab bar
│  Home     Train    │ + │   Nutrition  Progress   │
│                    ╰───╯                         │
└──────────────────────────────────────────────────┘
```

| # | Element | Behaviour |
|---|---------|-----------|
| ① | Title / back | Back on stacked screens; the section name on tab roots |
| ② | Notifications | → B-04. Dot when unread. Badges on: AI analysis complete, reminder due, sync failed |
| ③ | Avatar | → K-01 Settings. Shows initials if no photo |
| ④ | **Active-session bar** | Only while a session is `in_progress`. Live elapsed time + set count. Tap or "Resume" → E-02. Persistent across tabs; **cannot be dismissed** — losing track of an open session is the failure mode it exists to prevent |
| ⑤ | Offline banner | Only when offline or the outbox is non-empty. States what still works. "Details" → L-02 |
| — | Tab bar | Hidden on full-screen task routes (E-02/E-03, H-08, H-09, A-07). Active tab: filled icon + `--brand` label |
| — | FAB | Context-aware: with an active session its primary action is "Log set"; otherwise "Start workout" |

**Desktop (≥1024 px)** replaces the tab bar with a labelled left rail, moves the active-session bar to
a persistent rail card, and widens content to a max of 1280 px with multi-column cards.

## 5. Shared state patterns

### 5.1 Loading
Skeletons that match the final layout's shape and line count. Never a centred spinner on a full
screen — it communicates nothing and makes the app feel slower.
**Exception:** the logger never shows a skeleton for set entry; only the previous-performance strip may.

### 5.2 Empty
```
┌──────────────────────────────────────────────┐
│                                              │
│                   ( icon )                   │
│                                              │
│            No workouts yet                   │
│   Your completed sessions will appear here.  │
│                                              │
│           [ Start a workout ]                │
│                                              │
└──────────────────────────────────────────────┘
```
Always: icon + title + **one** explanatory sentence + **one** primary action. Never a dead end.

### 5.3 Error
```
┌──────────────────────────────────────────────┐
│                   ( ⚠ icon )                 │
│           Couldn't load your history         │
│   Check your connection and try again.       │
│              [ Try again ]                   │
│          Reference: req_8f2a19c              │
└──────────────────────────────────────────────┘
```
Plain sentence + retry + a copyable `request_id`. Never a stack trace, never a bare code.

### 5.4 Offline
Cached content renders with a stale badge. Actions that require the network are disabled with an
inline reason ("Needs a connection"), never silently non-functional.

### 5.5 Partial
When some data loaded and some failed, render what succeeded and show a scoped inline error on the
part that failed. Never discard good data because of one failed call.

## 6. Responsive rules

| Screen class | < 768 | 768–1023 | ≥ 1024 |
|--------------|-------|----------|--------|
| Tab roots | Single column | Single column, wider | 2–3 column card grid |
| List → detail | Push navigation | Push navigation | **Split view** (list left, detail right) — F-01/F-03, D-01/D-02, H-11 |
| Sheets | Bottom sheet, drag to dismiss | Bottom sheet | Centred dialog |
| Logger (E-03) | Full screen, one exercise | Full screen | Two panes: exercise list left, set entry right |
| Charts | One per row, horizontally scrollable if dense | Two per row | Up to three per row |
| Comparison (F-06) | Stacked, swipe between | Two columns | Up to three columns |

## 7. Priority legend
`P0` MVP-critical · `P1` MVP · `P2` Phase 2 (stubbed or hidden at MVP, never half-built).
