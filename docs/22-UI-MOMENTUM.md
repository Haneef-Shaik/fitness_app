# UI direction 3 — "Momentum"
## An expressive, platform-native UI for people who train, built in Figma

**Status:** proposed, for review; every screen in the inventory is drawn, and every screen page has a clickable prototype · **Date:** 4 October 2026 · **Where:** Figma file
*FitLog — Momentum (expressive UI)* → <https://www.figma.com/design/wukPwvkAsdpqByti0HNdDs>
(the owner's Figma team, Professional plan; built with the Figma MCP connector).

> The owner reviewed The Logbook ([docs/21](21-UI-LOGBOOK-RETHINK.md)) and its prototype and
> found it fine but too minimal for gym-goers. The brief for this pass: not minimal; catch the
> eye; give the needed information at a glance with one purpose per page; feel native to the
> platform without the user thinking about it; make effort feel rewarding, with subtle motion.
> This document records the direction and where everything is in the file. It changes no code.
> docs/15 is still what is live; docs/21 and this file are proposals.

---

## 1 · The idea in one sentence

**Every screen has one loud thing, and the loud things are earned.** The palette is one accent
and neutrals: **volt lime**, in its tonal range, carries action, progress, done and records; violet
appears only where the coach (AI) proposes something; the gym's own red appears only on its own
card; error red only for errors and dues.

> **Colour pass, 4 October 2026.** The first version used six hues (orange, lime, gold, cyan,
> violet, gym red) and the owner found it over-coloured. Lime, gold and cyan were folded into the
> accent: their tokens keep their names (`data/fuel`, `data/gold`, `tertiaryContainer`…) but now
> resolve to the accent's tonal family or to neutrals, the coach's cards became neutral with a violet
> dashed border, decorative glows were removed except on the two celebration screens, and on each
> screen only the one thing that matters stays vivid (the newest record on the shelf, *Records* among
> the summary tiles, protein but not calories, *You* on the podium).
>
> **Accent decision, 4 October 2026 — volt lime.** The accent was first an ember orange picked for
> warmth. Tested the way [D9](08-PROJECT-CHARTER.md) chose the original accent (colour-vision
> deficiency separation, not taste), it failed: its dark-mode fill was nearly the error red. Six
> candidates were run through the same M3 scheme; numbers are CIEDE2000, worst case across normal
> vision and simulated protan / deutan / tritan (Machado 2009). Under 10 is easy to confuse; over 20
> is clearly different.
>
> | Accent | Contrast on dark | vs error red | vs red gym brand | vs Strava orange |
> |---|---|---|---|---|
> | Ember orange `#FF5A1F` (rejected) | 8.7:1 | **1** | 17 | **9** |
> | Amber `#FFB000` (rejected) | 12:1 | 13 | 27 | 30 |
> | **Volt lime `#C6F432` (chosen)** | **18:1** | **20** | **35** | 64 |
>
> Red-family accents (orange, magenta) collide with the error red; blue, cyan and violet collide
> with the coach's violet. D9 rejected lime only because it sat on a green chart series; Momentum
> has no green series and no green "success" colour, and must keep it that way. Figma page
> *05 Accent decision* shows the same screens in all three, with Ember and Amber kept as rejected
> variable modes.

| | |
|---|---|
| Platform language | Android: **Material 3 Expressive** (Android 16's design language) as Google ships it. iOS: the **iOS 26** idiom (large titles, Liquid Glass tab bar, capsules, SF Pro). Same colour roles and layouts on both. |
| Ground | Near-black by default (`#0E0F0A`, the gym floor and the basement), with a full Light mode from the same variables. |
| Colour | M3 dynamic scheme, 2025 spec, Vibrant variant, generated with `@material/material-color-utilities` from seed `#C6F432` (volt lime). One accent plus neutrals; violet for the coach only. |
| Type | Google Sans Flex for words; Roboto Condensed for figures, so `80 kg × 8` reads like a scoreboard. Noto Sans Devanagari for Hindi. |
| Shape | The M3 Expressive corner scale (4 → 48 dp, full) and 12 shapes from the expressive library (cookie, clover, sunny, soft burst, burst, flower, puffy) used as badges and stickers. |
| Action | One vivid action per screen in the thumb zone. The logger's *Log set* is a 96 dp M3 Expressive large button. |
| Motion | M3 Expressive springs; staggered entrances; one celebration per moment; Reduce Motion respected. |

## 2 · Why (the research)

Each choice traces to evidence. The same six cards are on the Figma cover page.

| Finding | Source | What it changed |
|---|---|---|
| In 46 studies with 18,000+ participants, people spotted the key element up to 4× faster in M3 Expressive than in standard M3, and older users as fast as younger ones. | Google Design, *Expressive design: Google's UX research* (2025); Material 3 Expressive (Google I/O 2025) | One loud element per screen, made with colour, shape, size and motion rather than more text. |
| Goal-gradient: effort rises near the goal; a visible head start raises completion. | Kivetz, Urminsky & Zheng (2006), *J. Marketing Research*; Nunes & Drèze (2006), *J. Consumer Research* | "1 session left to close the week", "2 visits to pass Priya", rings that show what is already done. |
| Showing an intact streak raises engagement; a broken one lowers it, less so when it can be repaired. | Silverman & Barasch (2023), *On or Off Track: How (Broken) Streaks Affect Consumer Decisions*, J. Consumer Research 49(6) | Weekly streaks only (rest days never break them), ≥3 visits a week, one freeze a month — exactly GYM11.7. No daily guilt. |
| Gamification with competition added ~920 steps a day in a 602-person RCT, and only the competition arm stayed higher afterwards. | Patel et al. (2019), *JAMA Internal Medicine* (STEP UP) | A gym-scoped monthly challenge with a podium and your nearest target (FR-GYM11), never a global feed. |
| People judge an experience by its peak and its end. | Kahneman, Fredrickson, Schreiber & Redelmeier (1993), *Psychological Science* | The record celebration is the peak; the workout summary ends every session on the streak payoff. |
| Competence feedback sustains intrinsic motivation; controlling rewards undermine it. | Ryan & Deci (2000), *American Psychologist* (Self-Determination Theory) | Rewards only for real records, sessions and visits. No points for opening the app, no random loot, no countdowns, no shaming copy. |

The spring values come from the Material 3 Expressive motion scheme as implemented in Compose
(`MotionScheme.expressive()`).

## 3 · What is in the Figma file

| Page | Contents |
|---|---|
| 00 Cover & research | Title, the brief, the six research cards with sources, platform notes, PRD guardrails, page map. |
| 01 System | Variables: `Momentum color` (46 colours; Dark, Light and two rejected accent modes) and `Momentum shape` (corner tokens). 35 text styles (Android, iOS, Hindi). 141 Material Symbols Rounded icon components, 12 shape components, status bar, gesture bar and a 5-variant navigation bar. Colour boards for both modes, a type specimen and the shape scale. |
| 02 Android · member | The 12 hero screens of the member loop in Dark, 4 in Light, each with a label and a design note; wired as a clickable prototype, tab bar included (§6). |
| 03 Motion | 4 animated frames on Figma timelines and the motion-token table (§5). |
| 04 iOS adaptation | Today, Logger and Record in the iOS 26 idiom, and the Android ↔ iOS mapping table. |
| 05 Accent decision | The colour-blind separation test: the same screens in Ember, Amber and Volt. |
| 06 – 15 | **Every other screen in the inventory** (150 frames): see §3.1. Each page is also a clickable prototype with its own flows (§6). |

Frames are 412 × 915 (Android) and 402 × 874 (iPhone), like the earlier files.

### 3.1 The full inventory, page by page

Every screen in [docs/04](04-SCREEN-ARCHITECTURE.md) (103) and [docs/16 §18](16-PRD-GYMS.md#18-screen-inventory-additions) (47) is drawn, with state variants, in the same system. Sheets and dialogs are drawn over the screen they open from. Phase 2 and gated screens carry a stamp.

| Page | Screens |
|---|---|
| 06 Auth & onboarding (21) | A-01 splash · A-02 welcome · A-03 sign up · A-04 log in · A-05a/b password reset · A-06 verify email · A-11 phone · A-12 OTP · A-13a/b join a gym (code, consent preview) · A-14 age and consent · A-07a–f the six onboarding steps · A-08 target review · A-09 starter plan · A-10 done |
| 07 Today & Train (18) | B-02 customise Today · B-03 FAB menu · B-04 notifications · B-05 search · C-01 Train hub · C-02 programs · C-03 program · C-04 program edit · C-05 plan day · C-06 exercise picker · C-07 prescription · C-08 schedule · C-09 archive · D-01 library · D-02 exercise · D-03 custom exercise · D-04 muscles · D-05 names and merge (P2) |
| 08 Logger & history (16) | E-01 start · E-02 session list · E-05 add/swap · E-06 advanced set · E-07 notes · E-09 discard · E-10 recovery · E-12 plates · E-13 supersets (P2) · F-01 history · F-02 filters · F-03 session · F-04 edit · F-05 previous occurrence · F-06 compare · F-07 calendar |
| 09 Analytics, body & goals (16) | G-01 overview · G-02 volume · G-03 progression · G-04 records · G-05 balance · G-06 adherence · G-07 e1RM formula · I-02 log metric · I-03 weight · I-04 measurement · I-05 photos · I-06 fields · J-01 goals · J-02 new goal · J-03 goal · J-04 outcome |
| 10 Food (17) | H-02 meal · H-03 mode chooser · H-04 search · H-05 portion · H-06 describe (AI) · H-07 processing · H-09 camera · H-10 custom food · H-11 recipes · H-12 copy · H-13 quick add · H-14 analytics · H-15 targets · H-16 categories · H-17 barcode (P2) · H-18 AI audit · P-04 locked state |
| 11 Settings, Pro & coach (15) | K-01 profile · K-02 security · K-03 units and language · K-04 logging · K-06 notifications · K-07 data and privacy · K-07b delete account · K-08 the coach · K-09 connected apps (P2) · K-10 about · P-01 paywall · P-02 trial · P-03 manage Pro · P-06 weekly review (P2) · P-06b ask your data (P2). K-05 is B-02; K-11 is P-03. |
| 12 Gym · member (8) | N-02 scanner · N-04 receipts and dues · N-05 sharing · N-06 trainer's plan · N-08 refer · N-09 break mode (P2) · N-10 freeze · N-01 in Hindi |
| 13 Owner workspace (24) | O-01 create gym · O-01b switcher · O-02 gym today · O-03 members · O-04 member · O-05 add member · O-06 import · O-06b register reader (P2) · O-07 plans · O-08 renew/freeze · O-09 record payment · O-10 receipt · O-11 dues · O-12 visits · O-13 visit import · O-14 today's calls · O-15 staff · O-16 more · O-17 reports · O-18 challenges · O-19 export · O-20 coverage · O-21 Owner Pro (P2) · O-22 AI calling (gated) |
| 14 Trainer workspace (5) | T-01 today · T-02 member training · T-03 assign with plan copilot · T-04 templates · T-05 measurements |
| 15 System states (10) | L-01a empty · L-01b filtered empty · L-02a offline banner · L-02b sync centre · L-03 error · L-04 not found · L-05 session expired · L-06 permission primer · L-07 sync conflict · L-08 maintenance / degraded |

Owner and trainer workspaces use their own navigation bars (Today · Members · Money · Visits · More, and Today · Members · Plans · More) in the same system; the gym's red appears only on gym-branded surfaces such as the receipt.

Pages 07, 08, 10 and 12 also hold one extra frame each, to the left of the grid: a labelled
*prototype copy* of Today, the logger, Food or the gym card from page 02. They exist only so the
page's prototype can start where the app does (§6). They are not new screens; edit the originals
on page 02.

### 3.2 The hero screens (page 02)

| Code | Screen | The one purpose | The reward / hook |
|---|---|---|---|
| B-01 | Today | Start today's session | Week strip (goal gradient), protein ring, the week's win on a tonal card, gym check-in |
| E-03 | Logger · log a set | Log this set one-handed | *PR pace* chip before the rep; coach suggests 82.5 kg (violet, *Use* to accept) |
| E-04 | Rest timer · set logged | Rest, then the next set | Tonal "Set 3 logged" banner with e1RM; M3E wavy circular rest timer; ±15 s / Skip button group |
| P-05 | Coach · say a set | Log hands-free | Waveform, transcript, a violet proposal; nothing logged until *Log 80 × 8* |
| E-11 | PR celebration | Feel the record | The accent burst, confetti from the shape library, before/now bars, share with the gym's name |
| E-08 | Workout complete | Save and end on a high | Four numbers, only *Records* in the accent; "Week 8 locked in" |
| I-01 | Progress · strength view | Proof of getting stronger | e1RM trend with record dots, a trophy shelf where only the newest record is lit, consistency dots |
| N-01 | Gym card | Check in, see your standing | 96 dp *Check in*, visit streak with freeze, challenge rank and nearest target |
| H-01 | Food · today | Hit protein | Concentric rings (protein in the accent, calories neutral) with "44 g protein to go"; usual 6 pm shake offered by the coach |
| H-08 | Coach · check your plate | Turn a photo into trusted entries | Items on neutral cards with a violet dashed border and detection confidence in words; *Unsure* starts unticked |
| N-03 | Check-in · you're in | Make arriving feel good | Lime check with ripples; streak secured; rank +1 |
| N-07 | Challenge · leaderboard | Friendly competition | Podium where only *You* is in the accent, "3 to finish" |
| Light | B-01, H-01, G-01, N-01 | The same frames with the Light mode | — |

Screen codes follow [docs/04](04-SCREEN-ARCHITECTURE.md) and [docs/16 §18](16-PRD-GYMS.md#18-screen-inventory-additions).

## 4 · Tokens

Dark / Light values (all in the Figma variables):

| Token | Dark | Light | Use |
|---|---|---|---|
| surface / surfaceContainer / surfaceHigh / surfaceHighest | `#0E0F0A` / `#191A15` / `#1F201A` / `#252620` | `#FEFCF4` / `#F5F4EA` / `#EFEEE4` / `#E9E9DE` | ground and cards |
| onSurface / onSurfaceVariant | `#FBF9F1` / `#ACABA4` | `#383833` / `#65655E` | text |
| primary / primaryContainer / onPrimaryContainer / onPrimary | `#CAFD00` / `#CAFD00` / `#495E00` / `#516700` | `#556D00` / `#CAFD00` / `#495E00` / `#FFFFFF` | the hero card, the main action, accent text; icons on an accent fill use onPrimary |
| secondaryContainer = tertiaryContainer / on… | `#414B24` / `#CAD6A3` | `#DCE8B4` / `#4C562E` | tonal: done, logged, nav indicator |
| data/train, data/fuel, data/gold | `#CAFD00` | `#556D00` | the accent as a graphic or figure (rings, checks, chart, records); darker in Light so it holds contrast on paper |
| data/goldContainer, onGoldContainer | `#414B24`, `#CAD6A3` | `#DCE8B4`, `#4C562E` | tonal win and record cards |
| data/streak, streakContainer | `#ACABA4`, `#252620` | `#65655E`, `#E9E9DE` | neutral data, freeze chip |
| coach/ink, container, onContainer, outline | `#CDBDFF`, `#1F201A`, `#FBF9F1`, `#8F74F0` | `#6745C7`, `#EFEEE4`, `#383833`, `#9B7BFF` | everything the AI proposes: violet ink and dashed border on a neutral card |
| gym/brand | `#C8262B` | `#C1121F` | the gym's own card only |

Contrast (WCAG): text on surfaces is 18.3:1 (Dark) and 11.5:1 (Light); secondary text ≥ 5.3:1;
every on-container pair ≥ 6.0:1; the accent as text or graphic is 16.7:1 on Dark cards and 5.3:1
(`#556D00`) on Light cards; white on the gym red 5.6 / 6.2. The lime fill itself (`#CAFD00`) is only
1.1:1 against Light paper, so in Light it is used only as a filled container, never as a thin line.

Type ramp: `Display/Emph L 56`, `M 44`, `S 36`, `Headline L 32 / M 28 / S 24`, `Title L 22 / M 16 / S 14`,
`Body L 16 / M 14 / S 12`, `Label L 14 / M 12 / S 11` (+ emphasised), `Num/Hero 112`, `XL 72`, `L 48`, `M 32`, `S 22`, `XS 16`.
Corner tokens: 4, 8, 12, 16, 20, 28, 32, 48, full.

## 5 · Motion

Page 03 has four frames with real keyframes on Figma timelines (select a frame, press play):
**M1 Today opens**, **M2 Log set → logged**, **M3 Personal record**, **M4 Check-in → you're in**.

| Token | Damping ratio / stiffness | Reanimated `withSpring` (mass 1) | Used for |
|---|---|---|---|
| Spatial fast | 0.6 / 800 | `{ stiffness: 800, damping: 33.9 }` | pops: stickers, logged chip, record burst, check badge |
| Spatial default | 0.8 / 380 | `{ stiffness: 380, damping: 31.2 }` | cards and banners entering, sheets |
| Spatial slow | 0.8 / 200 | `{ stiffness: 200, damping: 22.6 }` | large surfaces |
| Effects default | 1.0 / 1600 | `{ stiffness: 1600, damping: 80 }` | opacity and colour, no bounce |
| Effects fast | 1.0 / 3800 | `{ stiffness: 3800, damping: 123 }` | press colour |

| Moment | What moves | Haptic |
|---|---|---|
| Any press | scale 0.94 in 100 ms, back on spatial fast | — |
| Screen opens (Today) | cards stagger in ~60 ms apart (translate 28 → 0, fade); ring arc draws in 0.8 s; streak flame pops at 1.2 s; once per app open | — |
| Set logged | the set chip becomes a tonal logged chip (0.6 → 1); banner drops in, stays 2 s | CONFIRM at 0.10 s |
| Rest timer | wavy circular indicator; the wave travels while time runs | SUCCESS at zero |
| Personal record | the burst 0.3 → 1 with a −30° twist, rays drift 20° over 3 s, confetti falls 120 px with spin, figure settles last | SUCCESS once |
| Check-in | check badge 0.4 → 1, three ripples 150 ms apart, payoff cards slide up in order, +1 pops | SUCCESS once |

Rules: transform and opacity only; never from scale 0; one delight moment per screen; celebrations
play once; Reduce Motion keeps state changes and drops movement (the record celebration shows its
static screen). Judge feel on a release build on the slowest supported Android.

## 6 · Prototype

Every screen page is a prototype. Open the page, press *Present* and pick a flow from the list.
There are 33 flows and 388 links in all. Figma links only work within one page, so each page plays
on its own, and a button whose screen lives on another page does nothing (for example *Start
workout* on Today outside page 02).

**Page 02, the member core.** Four flows:

| Flow | Path |
|---|---|
| Member · a training day | Today → Start workout → Logger → Log set → Record → Keep going → Resting → Go → Workout complete → Save → Today. Logger mic → Say a set → Log 80 × 8 → Record. Today → Check in → You're in → Start push day → Logger. Protein card → Food. |
| Gym · check in and the challenge | Gym → Check in → You're in → close → Gym. Challenge card → Leaderboard → back. |
| Food · snap a plate | Food → Snap a meal → Check your plate → Add to dinner → Food. |
| Light mode · the four tabs | The tab bar on the four Light screens. |

The tab bar (Today, Food, Progress, Gym) works on the four root screens in Dark and in Light. Train
lives on page 07, so the Train tab does nothing here.

**Pages 06–15.**

| Page | Flows | What you can click |
|---|---|---|
| 06 | Sign up with email · Phone sign-in · join a gym · Log in · reset a password | Splash moves on by itself → Welcome → sign up → verify email → age and consent → the six onboarding steps (Next and Skip) → targets → starter plan → done. Phone → OTP (tap the keypad, or wait 3 s) → gym code → join Iron Temple → consent. Log in → forgot password → reset. |
| 07 | Today · inbox and search · Train · programs and exercises · Quick actions (FAB menu) · Customise Today | Today copy: bell → notifications; Train tab ↔ Today tab. Train: search → results → exercise; Programs → program → plan day → picker and prescription sheets; edit, schedule, archive dialog. Exercise library → exercise → names and merge; custom exercise → muscles sheet. |
| 08 | Logger · start a workout · History · Recover an unfinished workout | Start → today's plan → logger copy: tap the weight for the plate calculator, *Set 3* for the advanced set editor, history icon → previous occurrence, *Up next* → session list. Session list: Add → add/swap sheet, Finish → notes sheet, ⋮ → discard dialog, superset → supersets (P2). History → filters, calendar, session → edit, compare, repeat. |
| 09 | Analytics · Body · weight · Body · measurements · Goals · Progress photos | Overview rows → volume, progression (card → e1RM formula), records, balance, adherence. Weight and measurement + → log metric sheet; measurement ⋮ → fields sheet. Goals → goal, new goal, and the reached goal → outcome dialog. |
| 10 | Food · log a meal · Free plan · AI is locked | Food copy: meals → meal detail (copy sheet, save as recipe, AI history in ⋮); empty Dinner → add-food sheet → photo, describe → processing, search → portion sheet → back to Food, quick add, recipes, barcode; ring → nutrition analytics; macro legend → targets; *Meals* header → categories. Locked sheet → search, quick add, recipes. |
| 11 | Profile and settings · Go Pro · start a trial · Ask your data | Every profile row; data and privacy → delete-account dialog; the coach → weekly review. Paywall → trial sheet → Manage Pro. |
| 12 | Gym · card, dues and a freeze · Refer a friend · Today's plan from your trainer · Sharing and consent · Break mode (Phase 2) | Gym card copy: Check in → scanner, Pay or dues → receipts, ⋮ → freeze sheet. Refer sheet closes back to the card. |
| 13 | Owner · the front desk · Set up a gym | Owner tab bar on all five tabs. Gym name → workspace switcher; Due today → dues; Today's calls; Ask → Owner Pro → AI calling; a member → detail → edit, renew → receipt; Record payment sheet → receipt. Members → add, import → register reader. Visits → visit import. More → plans, staff, reports, challenges, coverage, export. |
| 14 | Trainer · a plan for a member | Today ↔ Plans tabs; a member → training view → assign-plan sheet and measurements sheet. |
| 15 | Offline and sync | Offline banner → sync centre. The other states are reference boards with nothing to click. |

Pushes use smart-animate on a gentle spring (450 ms); sheets and dialogs open with a 350 ms
smart-animate over a copy of their parent, so only the sheet appears to move; tabs switch with a
150 ms dissolve; back arrows, close buttons and scrims use Figma's *Back*. Pages 07, 08, 10 and 12
start from a labelled prototype copy of a page 02 screen (§3.1).

## 7 · Platform adaptation (page 04)

| | Android (M3 Expressive) | iOS 26 |
|---|---|---|
| Navigation | Short navigation bar, pill indicator | Floating Liquid Glass tab bar, content scrolls under |
| Type | Google Sans Flex; Roboto Condensed figures | SF Pro; SF Pro Rounded figures |
| Shape | Expressive shapes, 28–32 dp cards | Circles and capsules, 24–28 pt continuous corners |
| Primary action | 96 dp large button | Capsule button, 50–64 pt |
| Progress | Wavy linear / circular indicators | Activity-style rings |
| Haptics | `CONFIRM`, `GESTURE_END` | `UIImpactFeedbackGenerator(.light)`, `.success` |
| Same on both | One accent plus neutrals, the coach violet, the one-loud-thing layouts, copy | |

SF Pro does not render in Figma's server renderer, so the iOS text styles use Inter and Nunito
as stand-ins (noted on each style). On device, use the system fonts.

## 8 · What this pass does not do

- **The prototype plays one page at a time.** Figma can only link frames on the same page, so a
  button that leads to another page does nothing, and the Train tab works only on page 07. The
  system states on page 15 (other than offline → sync centre), the Hindi gym card and the three
  iOS screens are not wired.
- **Only page 02 has Light-mode copies.** Every other screen uses the same variables, so switching a
  frame's variable mode to Light shows it in Light; translucent tints keep their Dark values (below).
- **iOS covers three screens.** The mapping table on page 04 applies to every other screen.
- **No photographs.** The plate, register page, progress photos and camera views are drawn
  placeholders.
- **Hindi is shown on one full screen** (N-01 on page 12) and in the type specimen; the full Hindi
  pass belongs with AC-25 in implementation.
- **Dates follow the 2026 calendar** with "today" as Saturday 3 October.
- **Translucent tints are hard values.** Figma's renderers ignore paint opacity on colour
  variables (and duplicating a frame drops it), so tints such as a chip at 14% primary are stored as
  the resolved colour with opacity. Solid fills stay bound to variables, so Light mode still works.
- **Screens are built from plain frames plus component instances** (icons, shapes, bars). Promote
  cards and buttons to components when the direction is chosen.

## 9 · How to review, and what happens next

1. Open the file; read *00 Cover & research*, then page 02 left to right, row by row, then pages
   06–15 for every other screen.
2. Press *Present* on page 02 and play *Member · a training day*. Then play the flows on pages
   06–15 (§6).
3. On page 03, play M1–M4. On page 04, compare with the Android row.
4. Choose a direction among Kinetic Performance (live), The Logbook (docs/21) and Momentum.

If Momentum is chosen: generate the tokens into `apps/mobile/src/theme/tokens.ts` (both modes),
bundle Google Sans Flex and Roboto Condensed, build the primitives in this order — wavy progress
(linear and circular), the 96 dp button, connected button group, shape badge, ring, coach proposal
card — then redo B-01, E-03/E-04, E-11 and N-01 first, behind the motion tokens above.

**The app icon and store art must follow the accent.** Today's icon (`apps/mobile/assets/icon.png`,
adaptive icon, Play Store icon) and the listing art are Iris violet from D9, and in Momentum violet
means "the coach". If Momentum is chosen, redraw them in volt lime on the near-black ground and
record the change as a new decision superseding D9 in [docs/08](08-PROJECT-CHARTER.md). Keep three
rules with it: no green "success" colour, no green chart series, and lime never as a thin line or
small text on Light surfaces.
