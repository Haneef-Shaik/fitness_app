# OW-1 · Figma gap register

| Field | Value |
|---|---|
| Prepared | 25 October 2026, bootstrap evidence pass on `v2/develop` (uncommitted). Corrected the same day after independent verification failed box 2 because the iOS list was incomplete |
| For | The designer working in *FitLog — Momentum (expressive UI)* ([docs/22](../../22-UI-MOMENTUM.md)) |
| Card | [OW-1](../../plan/GOALS.md) (GOALS.md:99–115), Done-when box 2 |
| Sources | [docs/22](../../22-UI-MOMENTUM.md) (updated 11 Oct), the [tracker](../../09-PROJECT-TRACKER.md) decision log (UI-01 at tracker:57) and design evidence (11 Oct), [PRD](../../PRD.md) v2.1 §§5.3, 16, 19, 23.1, the goal cards and [ACCEPTANCE.md](../../plan/ACCEPTANCE.md) |
| Figma opened in this pass | **No.** Every state below comes from local documents |

Line references are `file:line` in this checkout on 25 October 2026, after UI-01 was inserted at
tracker:57. `docs/22` is `docs/22-UI-MOMENTUM.md`; `tracker` is `docs/09-PROJECT-TRACKER.md`.

## How to read this register

- **Partly documented**: docs/22's live v2.1 table links real frames for part of the row. The tracker
  records those node links as verified on 11 October (tracker:101). This pass did not reopen them, so
  their current state is unverified, but nothing here says they are missing.
- **Historical coverage**: frames from the 4 October inventory, whose counts docs/22 keeps as
  historical and "not proof the current PRD v2.1 scope is fully drawn" (docs/22:4, 130–131). The three
  iOS frames on page 04 are of this kind. They stay recorded as existing partial coverage, and they do
  not close a row.
- **Still to draw or confirm**: a PRD requirement and a goal need the frame, and neither docs/22 nor the
  tracker records it as drawn. docs/22 notes that related branches sit on the same page as the linked
  frames (docs/22:88), so some of these may already exist. If a live audit finds one, it closes the row
  by adding the node link. Nothing is redrawn.
- **Needed by** names the goal whose Done-when box uses the frame. "G21.app 3" means the third box in
  that card's Done-when list. Where an acceptance row also depends on it, the row is named. The iOS
  table splits this into the goal that builds the screens and the box that proves them on an iOS
  release build.
- New frames follow the existing file: Android 412 × 915, iPhone 402 × 874, Momentum variables, and the
  Hindi and iOS text styles on page 01 (docs/22:119, 126).

## 0 · The direction these gaps belong to

| Element | Where it is recorded |
|---|---|
| Momentum is the only UI direction, volt lime seed `#C6F432` | tracker:57 UI-01 ("Momentum is the only UI direction … Retain volt lime"), which consolidates tracker:56 TECH-01 (2026-10-17, "Owner explicitly confirmed … retaining Momentum") and records no new owner approval; PRD:1208–1212; docs/22:4, 33–50; [owner pack](../../plan/owner-packs/OW-1.md):3–5 |
| Dark, light and system themes | tracker:57 UI-01; PRD:241 (persist "system/dark/light"), PRD:1208 |
| Member shell Today · Train · Food · Progress · Gym; Gym hidden until enabled, Join gym when unlinked | tracker:57 UI-01 ("the five-tab member shell"); PRD:1198–1201 (the DEC-01 navigation rule) |
| Staff shell Today · Members · Money · Visits · More; front desk with unauthorised actions absent | tracker:57 UI-01 ("the operational staff shell"); PRD:1203–1206 |
| No trainer UI | tracker:57 UI-01 ("trainer UI T-01–T-05 is retired"); tracker:44 PROD-01 (2026-10-11) and tracker:61 ("The product owner selected trainer removal"); PRD:1035–1039, 1236 |
| Name, icon, splash, store art | Not decided here. DS-6 owns them (DEC-01, ACCEPTANCE:115; UI-01 "brand clearance remains DS-6") |

## Summary

| Area | Documented as drawn | Still to draw or confirm | Main goals |
|---|---|---|---|
| O-23 programme templates | 3 linked frames: hub, day editor, prescriptions | 10 rows: 4 partly documented, 6 still to draw or confirm | G21.app |
| O-24 programme offers, with N-06 | "Offer preparation/status" inside the O-23 journey; N-06 preview and accepted copy | 9 O-24 rows (3 partly documented) and 2 N-06 rows | G21.app |
| Hindi | N-01 gym card, type specimen, Hindi text styles | 14 member families and 13 gym rows | G14.hi, G13, G16.app–G22.app, G23 |
| iOS | B-01 Today, E-03 Logger and E-11 Record (4 October, historical coverage) and the mapping table | 29 rows: 3 partly documented, 1 mapping table only, 25 still to draw | Builders: DS-4, DS-5, SC-1–SC-7, AP-2, G13, AI-3, G15.app, G16.app–G22.app. iOS release proof: QA-4 1–2 (member), PL-8 1–2, G15.app 2, G23 1 (gym) |
| Retired T-01–T-05 entry points | Page retired, prototype entry points removed | 7 checks to confirm; no frames to draw | DS-5, G16.app, G17.app, G18.app, G21.app, QA-2 |

---

## 1 · O-23 Programme templates (owner and manager, More → Programmes)

**Requirement.** PRD §16.2 (PRD:1062–1075): owners and managers create, edit, archive and reorder
templates under More → Programmes; a template has the same prescription fields as a personal plan;
editing creates a future version; front desk cannot offer or edit templates.

**Needed by.** G21.app (GOALS.md:1426–1438), box 3: "O-23 and O-24 are built from frames the designer
delivered and captured beside them in `docs/evidence/G21.app/`", and box 1: AC26 through the UI in
English and Hindi and both themes, covering accept, decline, withdrawn and error states. The contract
comes from G21.api. Ledger row AC26 (G21.api, G21.app, G23 · MS-6; ACCEPTANCE:70).

**Documented coverage.** docs/22:93 links three O-23 frames:
[O-23 hub](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=73-690),
[day editor](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=88-1052) and
[prescriptions](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=88-1179), with the stated
coverage "Versioned templates, editable prescriptions, offer preparation/status; preserved full owner
navigation." The tracker records owner/manager programme templates as updated in Figma (tracker:95) and
the live inventory as verified node links (tracker:101).

**Conflicting text.** docs/22:147–149 still says O-23 and O-24 "must be drawn in the same system;
these frames are not claimed to exist yet", and the G21.app card says "to be drawn" (GOALS.md:1433).
The live table is the more specific record and links actual frames, so this register treats O-23 as
partly drawn. Reconciling docs/22 belongs to QA-2, whose scope includes docs/22 (GOALS.md:206).

| # | Frame or state | PRD basis | State | Needed by |
|---|---|---|---|---|
| O23-1 | Templates hub: templates with their version and offer summary | §16.2 | Partly documented: hub 73-690 | G21.app 1, 3 |
| O23-2 | Day editor | "same prescription fields as personal plans" | Partly documented: 88-1052 | G21.app 3 |
| O23-3 | Prescription editor | same | Partly documented: 88-1179 | G21.app 3 |
| O23-4 | Create a template (name, first day, empty template) | "create" | Still to draw or confirm | G21.app 3 |
| O23-5 | Save edits to a template that has offers: the save creates the next version, and pending offers and accepted copies keep theirs | "Editing template creates a future version; existing offer and accepted copy stay stable"; AC26 | Partly documented ("versioned templates"); no linked frame for the save and version notice | G21.app 1, 3 |
| O23-6 | Archive, and delete if offered, with a confirmation that accepted member copies survive | "archive"; "survives … template deletion" (PRD:1073–1074) | Still to draw or confirm | G21.app 1, 3 |
| O23-7 | Reorder templates | "reorder" | Still to draw or confirm | G21.app 3 |
| O23-8 | Exercise picker for templates in the staff shell (the member C-06/C-07 sheets reused, or a staff variant) | "same prescription fields" | Still to confirm: docs/22 does not say which | G21.app 3 |
| O23-9 | §19.3 states: loading, no templates yet, offline with "Last updated", recoverable error with a support reference | PRD:1242–1246 | Still to draw (can compose SC-7's L-01–L-03) | G21.app 1 ("error states"); SC-7 |
| O23-10 | Front desk: no Programmes entry under More; a direct link returns to the current workspace | "Front desk cannot offer/edit templates" (PRD:1066–1067); PRD:1205–1206 | Still to draw or confirm | G16.app 1 ("restricted actions absent rather than disabled"); DS-5 2; G21.app |

## 2 · O-24 Programme offers (owner and manager), with the member's N-06

**Requirement.** PRD §16.2 (PRD:1065–1074): choose an eligible linked adult, select the version,
preview the programme, its name and the gym, and send an in-app offer. Staff see only the status
(pending, accepted, declined, withdrawn), never the member's edits, sets, progress or whether workouts
happened. Withdrawal cancels only pending offers.

**Needed by.** G21.app boxes 1 and 3, as for O-23. Ledger rows AC26 ("gym sees status only",
ACCEPTANCE:70) and AC09 (staff private-health reads denied, ACCEPTANCE:53).

**Documented coverage.** No frame is labelled O-24 and none is linked. The O-23 row's coverage
includes "offer preparation/status" (docs/22:93), so part of this flow may sit inside the O-23 frames.
Whether O-24 is its own frame or a section of the O-23 hub is the designer's call. G21.app needs a frame
for each state below to capture beside.

| # | Frame or state | PRD basis | State | Needed by |
|---|---|---|---|---|
| O24-1 | Choose a member: eligible linked adults only, with the reason a member cannot be chosen (not linked, invite not yet claimed) | "eligible linked adult" | Still to draw or confirm | G21.app 3; G21.api |
| O24-2 | Choose the template version | "select version" | Partly documented ("offer preparation") | G21.app 3 |
| O24-3 | Preview of the programme, its name and the gym before sending | "preview programme/name/gym" | Partly documented ("offer preparation") | G21.app 3 |
| O24-4 | Sent confirmation | "send in-app offer" | Still to draw or confirm | G21.app 3 |
| O24-5 | Offer status list showing pending, accepted, declined and withdrawn, and nothing about the member's use of the copy | PRD:1071–1072; AC26 | Partly documented ("status") | G21.app 1, 3 |
| O24-6 | Withdraw a pending offer, with confirmation; an accepted offer explains that it cannot be withdrawn | "Withdrawal cancels only pending offers" | Still to draw or confirm | G21.app 1 ("withdrawn") |
| O24-7 | Send fails or the device is offline: the offer is not sent and the input is kept | PRD:1243–1245 | Still to draw | G21.app 1 ("error states") |
| O24-8 | Empty: no offers yet; no eligible members | PRD:1242 | Still to draw | G21.app 1 |
| O24-9 | Front desk: no offer actions | PRD:1066–1067 | Still to draw or confirm (same as O23-10) | G16.app 1; G21.app |

**Member counterpart, N-06.** It is not one of OW-1's four areas, but G21.app box 1 needs it, so its
two remaining states are listed here.

| # | Frame or state | State | Needed by |
|---|---|---|---|
| N06-1 | Offer preview with Accept and Decline | Documented: [N-06 preview](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=45-278) (docs/22:94) | G21.app 1 |
| N06-2 | Accepted member-owned copy, and the separate "make it my current programme" action | Documented: [accepted copy](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=76-449) (docs/22:94) | G21.app 1 |
| N06-3 | Withdrawn offer | Documented in the N-06 coverage (docs/22:94) | G21.app 1 |
| N06-4 | Second accept lands on the one existing copy ("accepting twice yields one owned copy", AC26) | Still to draw or confirm | G21.app 1 |
| N06-5 | Accept or decline fails (offline or server error) and the offer is kept | Still to draw or confirm | G21.app 1 ("error states") |

---

## 3 · Hindi

**Documented.** One full screen, N-01 gym card in Hindi on page 12 (docs/22:142, 292); the type
specimen and Hindi text styles on page 01 (docs/22:119); Noto Sans Devanagari as the Hindi face
(docs/22:57). The v2.1 AI-controls and storage frames show an English/Hindi *selector* (docs/22:102),
which is a language choice, not a Hindi rendering. docs/22:292–293 and tracker:104 both leave the full
Hindi pass open. PROD-02 (tracker:45) selects "full English/Hindi" for launch.

**How the goals use Hindi frames.** No Done-when box compares a Hindi Figma frame with the app. The boxes
prove Hindi through release-build captures and journeys (G14.hi 3, G13 4, G16.app 3, G17.app 4, G18.app 1,
G21.app 1, G22.app 1, G23 1). A missing Hindi frame therefore fails no box by itself, but it leaves
wrapping, truncation and label-length decisions to whoever builds the screen. Draw in milestone order:
member families are proven at MS-4, gym families at MS-6.

**Member flows (MVP-M).** G14.hi box 3: "Every member screen family is captured in Hindi on an Android
release build at 100% and 200% text, without clipping"; box 1 includes exercise and starter-programme
content (GOALS.md:926–938).

| Family | Screens | Hindi documented | Needed by |
|---|---|---|---|
| A auth | A-01–A-10, including A-05a/b and A-07a–f | None | SC-5; G14.hi 3 |
| A phone | A-11, A-12 | None | G13 4 ("A-11 and A-12 work in English and Hindi with every error state"); G14.hi 3 |
| B Today | B-01–B-05 | None | SC-3; G14.hi 3 |
| C Train | C-01–C-09 | None | SC-2; G14.hi 3 |
| D exercises | D-01–D-04 and the exercise instruction text (D-05 is P2) | None | SC-2; CT-1 content; G14.hi 1, 3 |
| E logger | E-01–E-13; v2.1 [rest](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=7-398) | None | SC-1 (E-03, E-04, E-08, E-11), SC-2; G14.hi 3 |
| F history | F-01–F-07; v2.1 [occurrence choice](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=79-512) | None | SC-2, AP-2 (F-04); G14.hi 3 |
| G analytics | G-01–G-07 | None | SC-3; G14.hi 3 |
| I/J body and goals | I-01–I-06, J-01–J-04; v2.1 [strength metric](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=42-1450) | None | SC-3; G14.hi 3 |
| H food, manual | H-01–H-05, H-10–H-16 (H-17 is P2) | None | SC-4; G14.hi 3 |
| H food, AI | H-06–H-09, H-18; v2.1 [text input](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=43-644), [result review](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=78-713), [confirmed](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=89-889) | None | AI-3; G14.hi 3 |
| K settings | K-01–K-04, K-06, K-07, K-07b, K-08, K-10; v2.1 [AI controls](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=44-778), [storage limit](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=81-494) (K-09 is P2) | Language selector only | SC-6; G14.hi 3 |
| P Pro | P-01–P-04 | None | G15.app; G14.hi 3 |
| L system | L-01a/b–L-08 | None | SC-7; G14.hi 3 (member); AC13 (gym) |

**Gym flows (MVP-G).** Ledger row AC13 · G, "Every owner, manager, front-desk and member-gym flow
complete in Hindi on low-end Android" (G14.hi, G16.app, G17.app, G18.app, G19.app, G23 · MS-6;
ACCEPTANCE:57; PRD:1780). G23 box 1 is the final proof: "including AC13 in Hindi on the low-end
reference device".

| Family | Screens | Hindi documented | Needed by |
|---|---|---|---|
| A gym join | A-13a/b, A-14, with the expired, wrong-phone and already-linked states (PRD:1223) | None | G18.app 1 ("AC07 passes … in English and Hindi") |
| N gym card, dues, permissions, freeze | N-01, N-04, N-05, N-10; v2.1 member freeze request | **N-01 is drawn in Hindi** (page 12); the rest none | G18.app; AC13 |
| N check-in | N-02, N-03 | None | G19.app (AC13 row) |
| N programme offer | N-06 (45-278, 76-449) | None | G21.app 1 |
| N challenge, referral | N-07, N-08 | None | G22.app 1 |
| Today's gym cards | The gym cards on member Today, MVP-G by PRD:1224; the B-01 hero includes a gym check-in card (docs/22:160) | None | No card names these cards as its screens (see §6); AC13 through G23 1 |
| Staff shell and switcher | The five staff tabs, O-01, O-01b | None | DS-5; G16.app 3 ("Both languages") |
| Owner core | O-02–O-11 (not the P2 O-06b), O-15–O-17, O-19, O-20; v2.1 [membership review](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=47-827), [freeze review](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=74-680), [early return](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=74-715), [adjustments](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=47-1048), [refund](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=74-784), [correction](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=74-749) | None | G17.app 4 ("Every listed screen works in English and Hindi") |
| Receipt artefact | The receipt PDF and print layout with Hindi labels, reached from O-10 and N-04 | None | G17.app 4 ("receipt print, PDF and share are checked on a device"); PRD:880–882 ("English/Hindi labels") |
| Visits and offline review | O-12, O-13; v2.1 [revoked staff](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=82-488), [authorized review](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=82-520) | None | G19.app (AC13 row); G17.app 2 (AC37 journey) |
| Today's calls | O-14 | None | G20.app (its PRD line names AC13; it is not on the AC13 row, so G23 proves it) |
| Challenges | O-18 | None | G22.app 1 |
| Programmes | O-23, O-24 (§1, §2) | None | G21.app 1 |

**Out of scope for Hindi frames now.** P2 and gated screens: D-05, H-17, K-09, N-09, O-06b, O-21,
O-22, P-05, P-06, P-06b, and the Phase 2 agent concepts (docs/22:98–99). They are drawn in Hindi when
their goals start.

---

## 4 · iOS

**Documented.** Page 04 has Today (B-01), Logger (E-03) and Record (E-11) in the iOS 26 idiom, with the
Android ↔ iOS mapping table (docs/22:122, 266–279). They come from the 4 October pass, so this register
keeps them as historical coverage: they were not reopened and are not counted as v2.1 iOS frames.
"The mapping table on page 04 applies to every other screen" (docs/22:289), and "iOS covers three
screens" (same line). No live v2.1 frame is recorded with an iOS variant (docs/22:111–112: "not … a
guarantee that every PRD screen has full localization/platform variants"). The iOS text styles use
Inter and Nunito in place of SF Pro, which Figma's renderer cannot draw (docs/22:278–279). The three
iOS frames are not wired as a prototype (docs/22:285–286). tracker:104 records full iOS coverage as
incomplete.

**How the goals use iOS frames.** Each row names the goal that builds the screens (its PRD line or
Done-when list names them) and the box that first proves them on an iOS release build:
- QA-4 1 for every member row: every M row in ACCEPTANCE.md passes on Android and iOS release builds
  of one `main` commit. QA-4 2 adds VoiceOver over the logger, the diary and settings.
- PL-8 1–2 and G15.app 2 for the journeys that must run on a real iPhone or the App Store sandbox.
- G23 1 for every gym row: every G row gated at MS-6 passes on Android and iOS release builds.

No box compares an iOS frame with the app. The frames decide the native pattern so implementers do
not guess it from the mapping table.

**Shell and kit**

| # | Screens | State | Builds it | iOS release proof |
|---|---|---|---|---|
| iOS-1 | Member shell: floating Liquid Glass tab bar with all five tabs; Gym hidden before enablement and Join gym when unlinked; the global quick actions and the persistent active-session recovery affordance (PRD:1198–1201) | Partly documented: the historical iOS Today exists, but whether its tab bar shows the v2.1 five-tab set and both Gym states is not documented | DS-5 1 (Outcome: "Momentum on both platforms") | QA-4 1 |
| iOS-2 | Staff shell (Today · Members · Money · Visits · More), its front-desk variant, O-01 create gym and the workspace switcher O-01b | Still to draw | DS-5 1; G16.app 1, 3 | G23 1 |
| iOS-3 | Kit variants: capsule primary action (50–64 pt), activity-style rings, sheets and action sheets, dialogs, list rows, large-title headers, the system share sheet and photo picker | Mapping table only | DS-4 owns the kit (no DS-4 box names iOS; PRD:1210 requires platform-native behaviour) | QA-4 2 |

**Member screens (MVP-M)**

| # | Screens | State | Builds it | iOS release proof |
|---|---|---|---|---|
| iOS-4 | Auth and onboarding: A-01 splash, A-02 welcome, A-03 sign up and A-04 log in (email, Google, Sign in with Apple), A-05a/b password reset, A-06 verify email, A-07a–f the six onboarding steps with resume and the under-18 refusal, A-08 target review, A-09 starter plan, A-10 done. Splash art itself is DS-6's | Still to draw | SC-5 1–3 | PL-8 2 ("Sign in with Apple … work on the device"); QA-4 1 |
| iOS-5 | Phone sign-in A-11, A-12, with one-time-code autofill and every error state | Still to draw | G13 4 | QA-4 1 |
| iOS-6 | Today: B-01 Today, B-02 customise, B-03 quick-action menu, B-04 notifications, B-05 search | Partly documented: historical iOS B-01 only | SC-3 1 | QA-4 1 |
| iOS-7 | Train and plans: C-01 Train hub, C-02 programmes, C-03 programme, C-04 programme edit, C-05 plan day, C-06 exercise picker, C-07 prescription, C-08 schedule, C-09 archive | Still to draw | SC-2 1 | QA-4 1 |
| iOS-8 | Exercises: D-01 library, D-02 exercise with instructions, D-03 custom exercise, D-04 muscles (D-05 is P2) | Still to draw | SC-2 1 | QA-4 1 |
| iOS-9 | Logger hero loop: E-03 log a set, E-04 rest (and the v2.1 [rest](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=7-398) hierarchy), E-08 complete, E-11 record with sharing through the share sheet | Partly documented: historical iOS E-03 and E-11 | SC-1 1–2 | PL-8 1 (AC14, "kill mid-set and reopen", on a real iPhone); QA-4 1, 2 (VoiceOver over the logger) |
| iOS-10 | Logger details: E-01 start, E-02 session list, E-05 add/swap, E-06 advanced set, E-07 notes, E-09 discard, E-10 recovery, E-12 plates, E-13 supersets | Still to draw | SC-2 1, 3 (E-10 recovery) | PL-8 1 (reopen after a kill); QA-4 1, 2 (VoiceOver over the logger) |
| iOS-11 | History: F-01 history, F-02 filters, F-03 session, F-04 edit, F-05 previous occurrence, F-06 compare, F-07 calendar; the v2.1 [occurrence choice](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=79-512) states | Still to draw | SC-2 1–2 (AC38); AP-2 (F-04) | QA-4 1 |
| iOS-12 | Analytics: G-01 overview, G-02 volume, G-03 progression, G-04 records, G-05 balance, G-06 adherence, G-07 e1RM formula, with the touch read-out | Still to draw | SC-3 1 | QA-4 1 |
| iOS-13 | Body and goals: I-01 strength view, I-02 log metric, I-03 weight, I-04 measurement, I-05 photos (iOS camera and photo picker), I-06 fields, J-01 goals, J-02 new goal with the v2.1 [strength metric](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=42-1450), J-03 goal, J-04 outcome | Still to draw | SC-3 1–2 (AC42) | QA-4 1 |
| iOS-14 | Food, manual: H-01 diary, H-02 meal, H-03 mode chooser, H-04 search, H-05 portion, H-10 custom food, H-11 recipes, H-12 copy, H-13 quick add, H-14 analytics, H-15 targets, H-16 categories (H-17 is P2) | Still to draw | SC-4 1 | QA-4 1, 2 (VoiceOver over the diary) |
| iOS-15 | Food, AI: H-06 describe, H-07 processing, H-08 review, H-09 camera and photo picker, H-18 AI audit; the v2.1 [text input](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=43-644), [result review](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=78-713) and [confirmed](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=89-889) states | Still to draw | AI-3 4 | QA-4 1 |
| iOS-16 | Pro: P-01 paywall, P-02 trial, P-03 manage, P-04 locked state, with App Store purchase, restore, pending and verifying states (PRD:1233) | Still to draw | G15.app 2 | G15.app 2 ("Sandbox purchase and restore work on Android and iOS"); QA-4 1 |
| iOS-17 | Settings: K-01 profile, K-02 security, K-03 units, language and theme, K-04 logging, K-06 notifications, K-07 data and privacy with export through the share sheet, K-07b delete account, K-08 AI permission, K-10 about and licences; the v2.1 [AI controls](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=44-778) and [storage limit](https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs?node-id=81-494) (K-09 is P2) | Still to draw | SC-6 1–4 | QA-4 1, 2 (VoiceOver over settings) |
| iOS-18 | System states: L-01a/b empty, L-02a/b offline and sync centre, L-03 error, L-04 not found (where a denied link lands), L-05 session expired, L-06 permission primer before the iOS camera, photos and notification prompts, L-07 sync conflict, L-08 maintenance | Still to draw | SC-7 1–2 | QA-4 1 (AC31 member part) |

**Gym screens (MVP-G)**

| # | Screens | State | Builds it | iOS release proof |
|---|---|---|---|---|
| iOS-19 | Gym join: A-13a/b code and consent preview, A-14 age and consent, with the expired, wrong-phone and already-linked states (PRD:1223) | Still to draw | G18.app 1 | G23 1 |
| iOS-20 | Gym card, dues, permissions and freeze: N-01, N-04, N-05, N-10, and the v2.1 member freeze request | Still to draw | G18.app 1, 3 | G23 1 |
| iOS-21 | Check-in: N-02 scanner (iOS camera), N-03 you're in | Still to draw | G19.app | G23 1 |
| iOS-22 | Programme offer: N-06 preview, accepted copy and its remaining states (§2) | Still to draw | G21.app 1 | G23 1 |
| iOS-23 | Challenge and referral: N-07 leaderboard, N-08 refer, with gym-named share cards through the share sheet | Still to draw | G22.app 1–2 | G23 1 |
| iOS-24 | Today's gym cards (PRD:1224) | Still to draw | No card names these cards as its screens (see §6) | G23 1 |
| iOS-25 | Owner core: O-02–O-11 (not the P2 O-06b), O-15–O-17, O-19, O-20, and the v2.1 membership, freeze, early-return and finance states; receipt print, PDF and share through the iOS share sheet | Still to draw | G17.app 4 ("receipt print, PDF and share are checked on a device") | G23 1 |
| iOS-26 | Visits and offline review: O-12, O-13, and the v2.1 revoked-staff and authorized-review states | Still to draw | G19.app; G17.app 2 (AC37) | G23 1 |
| iOS-27 | Today's calls: O-14, opening the phone or chat app only on a tap | Still to draw | G20.app | G23 1 |
| iOS-28 | Challenges: O-18 | Still to draw | G22.app 1 | G23 1 |
| iOS-29 | Programmes: O-23, O-24 (§1, §2) | Still to draw | G21.app 1, 3 | G23 1 |

**Out of scope for iOS frames now.** The same P2 and gated screens as for Hindi (§3), with the Phase 2
agent concepts. They get iOS frames when their goals start.

**Hindi on iOS.** No box asks for separate Hindi iOS frames. G23 box 1 and QA-4 box 1 prove the
combination on release builds.

---

## 5 · Retired T-01–T-05 entry points

**Documented.** The trainer page is retired, its prototype entry points and reactions are removed,
and trainer flows are empty (docs/22:80–81, 108–109, 144, 258; tracker:97–98). The staff navigation has
no trainer destination (docs/22:147–148). UI-01 records the trainer UI T-01–T-05 as retired
(tracker:57). PRD §19.2 lists "T retired: T-01–T-05 removed; historical Figma frames are not build
requirements" (PRD:1236), and PRD:1039 says "No T-family screen is a build task".

**Nothing is to be drawn.** Each row is a check in the live file, tied to the goal whose test enforces
the same rule in the app.

| # | Check in the live file | State | Needed by |
|---|---|---|---|
| T-1 | No prototype reaction on any page targets a frame on the retired page | Documented as removed (docs/22:81) | G16.app 2 ("Retired trainer routes cannot be reached by direct link or by a stale workspace preference") |
| T-2 | The staff tabs and O-16 More show no trainer, client roster, coaching dashboard or measurement entry, and More → Programmes appears for owner and manager only | Documented: "no trainer navigation remains" (docs/22:147–148) | DS-5 1; G16.app 1; G21.app 2 |
| T-3 | O-15 Staff offers only owner, manager and front desk as roles | Only the 4 October inventory lists O-15 (docs/22:143); no v2.1 revision is documented | G17.app (O-15 is in its screen list); G16.api 1 ("a retired trainer role value is rejected") |
| T-4 | O-04 Member detail has no trainer assignment and no health, body or measurement panel | No v2.1 revision documented | G17.app; AC09 (ACCEPTANCE:53) |
| T-5 | A-13b consent preview and A-14 have no per-gym health-sharing switch (GT03 retired, PRD:1045); N-05 covers operational permissions only | N-05 is revised (docs/22:142); no revision of A-13b or A-14 is documented | G18.app 2 ("no trainer, body-sharing or diet fields exist"), 3 |
| T-6 | Every frame on the retired page carries an archival stamp | The page is described as archival (docs/22:144) | No build goal; keeps the file honest |
| T-7 | The retired page has one name | docs/22:80 calls it `90 Retired · Trainer (v2.0)`; docs/22:144 and 258 call it page 14, "Retired historical workspace" | QA-2 (docs/22 reconciliation) |

**Enforced in the app, with no frame.** G16.api 1 and G21.api 2 reject trainer role values; G21.app 2
("No T-route, trainer roster, coaching dashboard or measurement editor exists (route test)"); MS-6 exit
check 4 ("No trainer or private-health route can be reached (AC09 and AC26 evidence)"). Ledger rows
DEC-13 member (OW-1, QA-3 · MS-3) and DEC-13 gym (G23 · MS-6) (ACCEPTANCE:131–132).

**Do not draw.** T-01–T-05, a staff health workspace, a client roster, a coaching dashboard, a staff
measurement editor, or health-sharing switches (PRD:1043–1046, 1075; docs/22:144).

---

## 6 · Outside OW-1's four areas

- **Light variants.** SC-1 to SC-5 (box 4 each) and DS-1 (box 3) put both-theme captures beside Figma
  frames. Light copies exist for page 02 and three v2.1 screens; other frames rely on switching the
  variable mode, which leaves translucent tints at their Dark values (docs/22:287–288, 296–298). Expect
  tint fixes when those captures are made.
- **E-13 supersets stamp.** Supersets are MVP, but docs/22:138 and 252 note that the frame's old stamp is
  outdated. SC-2 builds E-13.
- **Today's gym cards have no owning card.** PRD:1224 marks Today's gym cards MVP-G. SC-3 builds B-01
  to B-05 at MS-3, and no gym card lists the Today gym cards among its screens. The Hindi and iOS rows
  above (Hindi gym table; iOS-24) name G23 1 as the proof and leave the builder to the plan owner.
- **Photographs.** Plate, register, progress-photo and camera views are drawn placeholders
  (docs/22:290–291). This is not a frame gap; licensed media belongs to OW-14 and AP-9.
- **Brand.** The name, icon, splash and store art stay with DS-6 (DEC-01).

## 7 · What closes this register

1. A live audit of the Figma file by the owner or designer adds node links for every row marked
   "partly documented" or "still to draw or confirm" that already exists, and changes nothing else.
2. The designer draws what remains in the existing system.
3. Each goal named here captures its build beside the frames its boxes name.

OW-1 itself needs only the list. The live audit, the drawing and handing the list to the designer
are follow-ups outside OW-1's Done-when boxes.
