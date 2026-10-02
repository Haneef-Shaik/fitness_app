# FitLog gym expansion — UI/UX design study

Date: 2 October 2026 · Status: proposed, for discussion · Mode: Operate

Open [the clickable study](design/gym-redesign/index.html). It uses illustrative people, plans and amounts; interactions change local demo state only. This is a design proposal, not a release implementation. The user requested equal attention to members, owners and trainers.

## Design thesis

**Know what to do next, see the progress, keep control of your data.**

FitLog should feel like a clear daily companion for members, a working register for owners, and a coaching notebook for trainers. These are three workspaces inside one account, not three sets of features competing on one dashboard. The gym is visible through its name and logo; FitLog's controls stay consistent.

The existing strength is a serious, consistent training interface with direct set entry, offline persistence and no interruptions mid-workout. The redesign changes hierarchy and navigation before adding decoration. Use blue and the current type families as recognizable continuity, larger readable task labels, fewer nested boxes, and a small number of purposeful progress moments.

## Evidence and limits

- Visually reviewed all 172 PNGs in `docs/screenshots/`, grouped by the 12 screenshot folders, including scroll continuations and empty/system states. The screenshot README identifies 92 screen IDs from an Android 14 release build captured today. Contact sheets establish broad patterns; implementation must still inspect the specific screen at full resolution.
- Requirements: [PRD v2](16-PRD-GYMS.md), especially §§2, 4, 7–9, 13, 15 and 18. v1 remains in force except the changes explicitly listed in v2.
- Visual authority: `apps/mobile/src/theme/tokens.ts` and the current screenshots. They use Kinetic Performance: blue, Hanken Grotesk and Inter. `docs/design/README.md` and its iris/Barlow gallery are older, conflicting evidence. This proposal does not silently rewrite them.
- Platform: React Native / Expo, Android first, low-cost devices, intermittent basement connectivity. The study is browser-rendered for design review; it does not prove native performance, screen-reader behavior or OS permission flows.
- Impeccable context loading failed because its engine was unavailable. Existing code and supplied product documents were read directly.
- This is expert review, not observed usability research. Predictions about confusion, adoption or retention need testing with pilot users.

## Current screen audit

| Area and screenshot evidence | What is visible | Proposed change and reason |
|---|---|---|
| B-01 home, three scroll captures | Training, nutrition, body and goals repeatedly use similarly sized cards; next action and workout overlap | One primary plan/resume action, a compact gym strip, a compact food summary and one weekly improvement. Full details belong in their domains |
| B-03 quick actions / tab bar | The bright central plus opens multiple domains; the same actions also appear on root screens | Keep the familiar four domain tabs. Trial a labeled contextual **Log** action instead of an unlabeled fifth destination; test before removing the global shortcut |
| C-01 Train | Today's plan shares space with Programs, Library, History, Analytics and Records | Plan first; schedule second; history below. Put management tools behind a clear secondary toolbar and integrate performance into Progress |
| C-02, C-03, C-05 | Useful programs and prescriptions, but dense descriptions and repeated per-day editing controls | Distinguish personal programs from gym-assigned copies. Use a day rail and clear **Edit day** path; expose technical prescription controls when needed |
| D-01 / C-06 | Long textual exercise lists with multiple filters | Search first, relevant/recent matches next, consistent aliases, selectable rows with one selection count. Show equipment and primary muscle without excessive anatomy labels |
| E-03 logger, E-04 timer | Exercise name appears in the header, chip strip and content; secondary tools compete with set entry | Exercise position + one title; last session as reference; set table; a single large weight/reps pad; **Log set** at the thumb edge. Keep swap, plates, RPE and notes under More |
| E-08 finish | Correct stats and records, but records read as another dense data block | One meaningful record headline, compact session facts, then exercises. Share appears only after finishing and is optional |
| F-01 / F-03 history | Exercise-derived names truncate; session metadata is tightly packed | Human-readable plan/day title with date, then duration and set count. Exercise detail retains precise data. Correcting old sessions stays blocked on the known F-04 implementation gap |
| G-01 / I-01 / J-01 | Training analytics and body progress are separated; several summaries require users to interpret significance | Progress becomes a hub with Strength, Body and Consistency views. One factual weekly change leads; detailed charts and sources remain available |
| H-03 / H-04 food | Catalog browsing and AI tools precede many manual choices; search results mix detailed ingredient and dish names | Search/recent/repeat a meal first; Indian dishes and household portions. AI entry clearly says Pro. Manual logging always has an equally obvious path |
| H-08 AI review | Many editable nutrients and confidence indicators in repeated nested surfaces | Review food + household portion first. Expand nutrition details on demand. Label estimates and recognition uncertainty separately; totals change only on confirmation |
| A-07…A-10 | A long setup asks for activity, goals, training and measurements before normal use | Invited members get phone → OTP → gym confirmation → age/notice → sharing → dismissible Pro offer → Home. Optional personal setup happens later; standalone onboarding remains available |
| K-01 / K-01b | Long undifferentiated settings and profile fields | Group Account, Training, Nutrition, Gyms & sharing, Pro, Data & support. Place workspace switcher at the root header and profile |
| L-02 / L-03 | An offline banner can coexist with a failed Home fetch | Preserve usable cached modules and local actions. Show errors inside the affected module, not in place of the whole working home |
| Empty B-01 / G-01 | Multiple zeroed summaries and an empty chart | First-use home has one useful task; analytics says what data is needed, rather than treating missing history as zero adherence |

## Navigation and information architecture

### Member: Home · Train · Food · Progress

Keep four familiar destinations. Gym is a named surface on Home and in profile, not a mandatory fifth tab. A contextual **Log** shortcut may remain available on roots, provided its label and keyboard/screen-reader name are clear. **Food** is a proposed shorter label for Nutrition, to test in both languages.

- Home: today's next action, linked gym strip(s), today's food summary, one weekly improvement.
- Train: assigned/personal plan, weekly schedule, recent sessions; program and exercise management remain accessible.
- Food: diary, add/search/recent, saved meals, manual quick add; photo/text analysis is Pro.
- Progress: Strength / Body / Consistency. Detailed analytics, history, measurements and goals remain free.
- Gym detail: membership, end date, days left, dues, check-in, receipts, freeze request, challenge, referral, sharing. A linked gym appears even when membership has lapsed; training stays usable.
- Multiple gyms: one compact card per linked gym; each opens its own details and consent. Never merge their dues, trainer access or visit streaks.

### Owner / manager: Today · Members · Money · More

- Today: dues and renewal entry points, ranked follow-ups, today's visits, invitation coverage. Collection shortcuts take precedence over decorative reports.
- Members: search by name/phone/code; Active, Dues, Expiring, Lapsed, Unlinked, Trainer filters; add/import accessible without scrolling.
- Money: dues, record payment, receipts, collections; reports available to owner/manager only.
- More: Visits and device import, templates, challenges, staff, reports, invites, gym settings, exports and offboarding. Permissions remove unavailable actions rather than inviting failed attempts.
- Front desk variant: members, payments and attendance; no retention queue, money reports or private training access. The default landing task differs by role.

### Trainer: Today · Members · Plans · More

- Today: assigned members who trained, those needing follow-up and those without a plan. No invented appointment calendar or PT pack counters in the MVP.
- Members: only assigned members; consent state is explicit. An absence is based on recorded visits, never a claim of complete knowledge.
- Plans: gym-owned reusable templates and the existing builder; member assignments produce separate member-owned copies.
- More: recorded measurements, own alerts, workspace/account settings. Membership dues and gym revenue are outside the trainer's permission set.

Staff header switcher: **Personal ↔ Iron Temple Gym · Owner / Trainer**. Show current workspace and role, never infer permissions from the selected client UI. Do not switch away during a live personal workout without preserving it. Members without staff roles do not see a workspace switcher.

## Member screen design

| Screen | Hierarchy and interaction | Important states |
|---|---|---|
| B-01 Home | Greeting/date → **Today's plan from Rahul** → one Start action → compact named gym with status, days left, dues and Check in → food summary → weekly factual improvement | Invited/no plan: ask trainer or start empty; standalone/no gym: omit gym; live workout: Resume dominates; completed: summary and next planned day, not a second prominent Start |
| C-01 / N-06 Train | Today's day, trainer provenance, exercises and prescribed sets → Start → weekly day selector → plan tools/history | Rest day, assignment replaced, trainer departed, revoked sharing. Assigned copies survive trainer changes; changing a gym template never silently updates the member copy |
| E-03 / E-04 Logger | Single exercise title → last-time values → set rows → current weight/reps → Log set → timer after commit | Offline saved locally / queued; Undo; keyboard; warm-up vs working set; superset; recovery; timer never covers the pad; no paywall, dues, ad or attendance interruption |
| H-01…H-05 Food | Today totals → meal groups → add/search/recent → household portion with gram equivalent → confirm | No target yet; no meals; filtered empty; grams vs katori/roti; recipe/source detail; manual flow during Pro/AI/network failure |
| I/G/J Progress | Weekly fact → Strength / Body / Consistency → one primary chart + exact period → relevant details | Insufficient data uses “not enough history”; trainer-recorded measurements name recorder/source; photos always private; lighter weeks are neutral, not red failures |
| N-01…N-08 Gym | Gym brand and member code → membership status/end/days/dues → check-in → receipts/freeze → visits/streak/challenge → sharing/referral | Active, expiring, lapsed, frozen, unlinked; no visits; opt-out leaderboard; multiple gyms; queued/unverified visits; offline cache timestamp |

Home is not required to fit every fact in one viewport. The first viewport must show the primary action and a recognizable gym entry; avoid compressing typography to force it all in.

## Owner screen design

| Screen | Hierarchy and interaction | Important states |
|---|---|---|
| O-02 Today | Gym/date → dues total and expiring-member count as tappable routes → ranked follow-up preview → Record payment → today's visits and link coverage | New gym: import/add first; cached amounts show freshness; pending offline payments must not look like server-confirmed totals |
| O-03 Members | Search → relevant filters with counts → clear member rows with code, membership and dues → Add/import | Same phone on multiple records: show member code/name; under-18 gym record: no invite, link, challenge or behavior analytics; unlinked is not inactive |
| O-04 Detail | Identity → membership/payment/attendance tabs → contextual Renew/Record payment → trainer/link status → consented training → messages/audit | Non-shared data is labeled, not zeroed; financial corrections append reversal + replacement; role-limited tabs; minors still have gym membership/payment records |
| O-09 Payment | Member and outstanding balance → amount → Cash/UPI/Other → date/reference → **Record payment** → receipt and remaining balance | Partial payment; incorrect amount; offline queued receipt pending; duplicate tap; reversal. This records money already received; it does not collect payment online |
| O-14 Today's calls | Ranked reason → confidence explanation → last recorded visit/dues → preview drafted text → open owner's WhatsApp → separately record outcome | Confident vs “may be visiting without scanning”; Called/Messaged/No answer/Not needed/Dismissed; opening WhatsApp is not delivery; praise moments use consented data |
| O-06 / O-20 Setup and invites | Import file → map → error/duplicate preview → confirm → invited/linked/unlinked coverage | 2,000-row limit; repeat import; shared family phone is disambiguated, not blindly merged; no bulk marketing; at most one staff resend per member |

Dues route ≤1 tap from Today and payment target ≤15 seconds, as specified by the PRD. Import and gym setup remain a separate assisted flow rather than a long owner onboarding carousel.

## Trainer screen design

| Screen | Hierarchy and interaction | Important states |
|---|---|---|
| T-01 Today | Assigned roster summary → trained recently → needs follow-up → needs a plan; named member actions | Partial visit capture; members with no sharing; no assigned roster; no gym-wide money information |
| T-02 Member training | Name/goal if shared → assigned plan → consented recent session/adherence → measurements with source → Assign plan / Record measurements | Workouts off: show “Workouts aren't shared”; measurements independently off; nutrition only with its separate permission; no photos; revoke on next request |
| T-04 Templates | Gym-owned template list → simple days/equipment/level → edit existing builder or select for assignment | Empty library; personal vs gym ownership; template edits affect future assignments only; departed trainer doesn't remove member copies |
| T-03 Assign | Select member → select template → start date → concise plan preview → **Assign plan** → clear copy confirmation | Existing assignment replacement requires clear explanation; failed/offline save is pending, not falsely delivered; no AI copilot teaser in MVP |
| T-05 Measurements | Member name always visible → selected measurement and unit → value/date → save with “Recorded by Rahul” | Measurement consent off; wrong member prevention; offline queue; future corrections keep provenance |

“Assign in two taps” applies from a ready member/template context: open Assign, confirm the already-selected template and date. Choosing among many members/templates naturally takes more taps; test the complete job rather than hiding this cost.

## Shared foundations and states

**Visual direction:** evolve the shipped Kinetic Performance system. Dark member/training surfaces match current use; fully supported light theme makes daylight owner tasks readable. Role hierarchy varies, while component grammar remains shared. Theme is a preference, not a role rule.

- Current dark tokens: page `#0E0F11`, surface `#16181C`, raised `#1E2025`, text `#FFFFFF`, secondary `#C4C6C1`, muted `#8E918F`, accent `#6BA5FF`, accent text `#0B1A33`.
- Current light tokens: page `#F4F5F3`, surface `#FFFFFF`, text `#0B0C0D`, secondary `#4B4D48`, muted `#696B65`, accent `#2368C0`, accent text white.
- Hanken Grotesk for titles/data, Inter for body; Hindi needs a tested Devanagari fallback with comparable readability. Body 15–16, labels 13, screen titles 26–32, entry values 34–40. Avoid essential instructions at 11px.
- 16–20px side insets; 24–32px section separation; 12px controls / 16px grouped surfaces. Lists use dividers rather than one floating box per row.
- 44px minimum targets, 56px logger actions; do not shrink logger touch targets to fit more tools.
- One blue action emphasis; status always has a word or symbol. Charts retain stable series meanings; no invented health scores.
- Save feedback is immediate; set row and Undo communicate the result. Modest 120–180ms feedback, reduced-motion support, no ambient looping animation or heavy blur.

**Check-in and measurement wording:** use **Check in at gym** for attendance and **Log measurements** for body. The two meanings of “check-in” already collide in v1/v2. Code must retain the PRD's `visit` naming for attendance.

**Sharing:** show gym name and the recipient on each purpose. Workouts, measurements, renewal-progress line and gym WhatsApp default on per the PRD; nutrition defaults off; photos never shared. These defaults must be visible and editable before acceptance. Attendance/membership are gym records, not a toggle pretending that staff cannot see their own records. Explain unlinking separately from deleting the FitLog account.

**Check-in:** location denied/outside radius → recorded unverified, with “Doesn't count toward the challenge.” Offline → queued, not verified yet; duplicate within three hours → Already checked in. Challenge eligibility must be explicit. PRD GYM11.1 excludes `workout_at_gym` from standings, and GYM11.7 uses `staff` where GYM06 uses `manual`: resolve this taxonomy before implementation rather than assuming all visits count.

**Pro:** food photo/text entry says Pro; dismissal returns to manual logging. End-of-onboarding offer appears once and is dismissible. Show real store price, period, renewal/cancel details, restore and trial eligibility. Indicative PRD price ranges are not approved store prices; the study does not invent a purchasable price. Do not show P2 voice/workout/weekly-agent features as available benefits. Past analyses stay readable when entitlement ends.

**Offline/errors:** display “Saved on this phone · waiting to sync” for queued writes. A payment receipt is not final until confirmed. Cache reads need a visible last updated time. Errors preserve valid modules. Skeletons match layout; empty, filtered-empty and not-shared are distinct. Retry never creates a duplicate payment or visit.

**Localization:** English/Hindi on all new auth, owner, trainer, member gym and Pro flows per AC-25. Existing builder/logger stay English in the MVP. Hinglish aliases help search; do not substitute decorative Hinglish for a complete translation. Hindi layouts must grow vertically, retain numerals/units, and format money with Indian grouping. The prototype's Hindi switch demonstrates selected gym/workspace copy, not translation completeness.

## PRD issues to resolve before production

1. Age gate: design to the proposed 18+ India flow, but Q33/counsel validation remains open. Do not silently change the current enforced 16+ rule in a visual pass.
2. Visit eligibility: clarify `staff` vs `manual`, and whether `workout_at_gym` counts for streaks/challenges. The design must distinguish own history from eligible standings.
3. Shared-phone duplicates: O-06 should flag possible duplicates, not automatically merge two family members. The PRD allows repeated phones and also describes merging; member identity and staff confirmation decide.
4. Member Pro price and store trial eligibility remain gate-dependent. Use store-sourced values in the paywall.
5. Assign-plan behavior needs an explicit active-plan/replacement decision and start-date rule. The PRD defines immutable copies, not a silent live sync.
6. F-04 past-session editing is a known functional gap, not a visual fix. Keep the current limitation honest until edit semantics are implemented.

## Scope of this first study

The clickable study visualizes 12 main screens with equal depth: four member, four owner, four trainer; plus gym detail, sharing and navigation hubs. It demonstrates home-to-logger, local set entry/Undo, selectable food search and portion add, owner filtered dues/search/payment/receipt, confidence-aware follow-ups, trainer roster/template/assignment, theme, offline labels and a limited Hindi layout sample. It intentionally labels synthetic data and demo confirmations. Secondary tool inventories are shown in More, with their detailed layouts specified in this brief.

It does not implement the native app, backend tenancy, actual invites, real messaging, store purchases, camera/location permissions, persistent financial writes or full localization. Production screen coverage remains the tables above and the PRD's full inventory, not only the study's rendered screens. Existing app code and approved product documents are unchanged.

## Build order and validation

1. Agree on task hierarchy and workspace navigation using this study; preserve the existing UI tokens until any system change is explicitly selected.
2. Foundations: phone auth, shortened invited onboarding, visible sharing defaults, workspace switcher and Pro states.
3. Owner member register/money and member gym card/receipts, built together so the same membership record reads consistently.
4. Trainer templates/assignment and member today's plan, integrated into the existing fast logger.
5. Attendance results, reliable follow-ups, challenges and invitation coverage; then refine Food and the Progress hub.

Pilot tasks, equally weighted across roles:

| User | Task | What to observe |
|---|---|---|
| Member | Join invite; find today's plan and log first set | Can they distinguish joining/sharing from optional profile setup? Home-to-first-set one action for an assigned plan; existing tap budget preserved |
| Member | Record 2 rotis and 1 katori dal; find receipt | Household portions understandable; manual food flow discoverable without Pro; dues/receipts found without help |
| Member | Decline location and revoke workout sharing | Unverified attendance understood; training remains available; knows exactly who loses access |
| Owner | Find dues and record ₹500 against ₹1,200 | Dues in one tap, payment ≤15s, remaining ₹700 understood, receipt not confused with an online payment request |
| Owner | Follow up on a low-confidence absence | Does not interpret missing scans as proven absence; previews message; records outcome independently of opening WhatsApp |
| Owner | Import records with duplicate/shared phones | Does not merge two people accidentally; can see errors before commit; coverage makes next action clear |
| Trainer | Assign a template and inspect yesterday's session | Copy behavior understood; direct assignment from ready context; only assigned members accessible |
| Trainer | Open a member who stopped sharing | Distinguishes not shared from no exercise; no pressure or bypass; plan remains useful to member |
| Trainer | Record a measurement for the correct member | Identity/unit/date clear, source visible to member, pending save honest |

Observe at least a few users in each role in English and Hindi on the reference low-cost Android phone. Use task completion/time, mis-taps and explanation comprehension. The study has not established these outcomes; the pilot supplies evidence.
