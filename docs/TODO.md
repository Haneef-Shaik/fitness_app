# TODO — active work

**Goal:** G10 · Hardening — make it shippable →
[contract](prompts/G10.md) · [tracker](09-PROJECT-TRACKER.md) · [charter](08-PROJECT-CHARTER.md)

> This file holds **only the work in flight**. Milestone status lives in the tracker — it is not
> repeated here, because a status maintained in two places drifts.

**Where G10 stands (23 Sep).** Everything below the line is done and evidenced in
[nfr-evidence.md](nfr-evidence.md) and [a11y-audit.md](a11y-audit.md). **G10 is not closed**: the
one release-gate line still open needs a person holding the phone.

---

## UI shell rework — 23 Sep, from the owner's review on the phone

Done, tested (789 client / 473 API), checked by eye on the phone:

- [x] **Bottom tab bar** (00 §4, D2): Home · Train · ⊕ · Nutrition · Progress; hidden on
      sign-in, onboarding and full-screen tasks. Switching tab resets the history
- [x] **Train hub (C-01)**: today's plan day, empty workout, programs / library / history /
      analytics / records, recent sessions
- [x] **Starter programs**: three templates (`GET /v1/program-templates`, `POST …/{key}/start`),
      offered wherever a new account used to see an empty list
- [x] **Settings (K-01)**: the avatar opens it; **sign-out asks first** and says what happens to an
      unfinished workout and unsent changes. The avatar used to *be* sign-out — one tap, no warning
- [x] **Back no longer lands on "Create account"**: every crossing of the auth boundary resets history
- [x] **One account's data never shows in another**: the on-device workout and upload queue are
      stamped with their account (local schema v2); the query cache clears on every identity change
      (docs/03 §6.2 required it; nothing did it)
- [x] Tab-root headers (friendly date, bell, avatar), chevron back button, padded buttons, list rows
      instead of button walls on Home / Nutrition / Progress, pull-to-refresh on tab roots

Not done:

- [ ] **The device E2E suite has not been re-run** on these changes. Its prelude signs out whoever is
      signed in, and the only phone is the owner's — it needs their go-ahead, or a second device
- [ ] The **active-session bar** (00 §4 ④) is still unbuilt; Train and Home show "Resume" instead
- [ ] **Profile editing** (name, height, birth date) — K-01 shows the email only
- [ ] Data on the phone from before local schema v2 cannot be attributed to an account: queued
      writes are kept but never shown or sent (safer than sending them as the wrong person), and an
      unfinished workout from before the upgrade is **dropped** by the migration

## 0 · 🔴 The screen-reader session — blocks the release

- [ ] **0.1** A TalkBack session on the phone: log a workout (start → load → reps → save ×3 →
      finish → summary) and read the diary. Record what TalkBack **says**, not what the tree
      contains — the tree is already read (see the audit's last table). TalkBack cannot be driven
      from a host: its shortcuts and gestures ignore injected input (tried 23 Sep)
- [ ] **0.2** While doing it, settle finding 5: does the rest timer's per-second re-render make
      TalkBack re-announce?
- [ ] **0.3** Then close G10: tracker handoff, charter §4, **H10.1**, commit

## 1 · Dated accessibility findings ([audit](a11y-audit.md))

- [ ] **#5** rest timer churns the tree every second — *2026-10-15*
- [ ] **#18** one dropped `Save set 2` tap in four AC-02 runs — reproduce — *2026-10-15*
- [ ] **#17** the logger's exercise-tab scroller is a nameless Tab stop; it clips the focus ring — *2026-10-31*
- [ ] **#20** "Log back in to carry on" shown while signed in — *2026-10-31*
- [ ] **#15b** Shift+Tab cannot enter a text field (RN 0.76) — arrives with the Expo SDK that
      carries [react-native#48547](https://github.com/react/react-native/pull/48547) — *2026-12-15*

## 2 · Performance

- [ ] **2.1** tap → set p95 is **296.5 ms** (G4: 396.4 ms) against D16's 100 ms — faster, not
      fixed. Fix the list, or re-argue the budget; a budget nobody meets is not a budget
- [ ] **2.2** Cold start and p95 are **`__DEV__` numbers** (DR4: no release build on this machine).
      The release figures are unmeasured

## 3 · Carried, not started in G10

- [ ] **3.1** AC-08/09/10 on a device — needs the AI worker running against the phone
- [ ] **3.2** `.github/workflows/e2e.yml` has **never executed** (since G4)
- [ ] **3.3** AI worker signals: queue depth and time in `processing` (outcomes and durations are
      exported; a stuck queue is not yet visible)
- [ ] **3.4** The E2E seed never removes programs AC-01 creates — flows now scroll past them, but
      the list grows every run

## Carried forward from G9 (unchanged)

- H-14 nutrition analytics unbuilt · no profile screen (`birth_date`, `sex`, `height_cm`) ·
  I-01's projection unbuilt · reminders do not send · **Q1** (nutrition provider) and **Q8**
  (versioned targets) still open

---

## Done in G10 — evidence lives elsewhere

Observability + one alert fired · export and delete, asserted per domain and per table · L-02 and
L-07, exercised on the phone · offline: banner reachable, saves no longer wait on the network,
writes never exhaust while offline · keyboard-only diary pass and keyboard-only logging on the
phone · focus ring built · text fields keyboard-reachable · contrast pinned in both themes · the
food catalog seeded in real databases · p95, cold start and bundle measured on the mid-tier phone ·
the full acceptance suite green on hardware.
