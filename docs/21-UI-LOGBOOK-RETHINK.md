# UI rethink — "The Logbook"
## A second full UI direction, built in Figma, covering every screen and the coach

**Status:** proposed, for review · **Date:** 2 October 2026 · **Where:** Figma file
*FitLog — Logbook UI rethink* → <https://www.figma.com/design/GrN3wj9ArjRsmkaNId28he>
(the owner's Figma team, Professional plan; built with the Figma MCP connector).

> The owner reviewed the Kinetic Performance rebuild ([docs/15](15-UI-REDESIGN.md)) and
> found it plain, and found that it did not design the AI features at all. This document
> records the direction that answers both, and maps every one of the 166 Figma frames
> back to the screen inventory in [docs/04](04-SCREEN-ARCHITECTURE.md) and
> [docs/16 §18](16-PRD-GYMS.md#18-screen-inventory-additions). It does not change any
> shipped code. Where it disagrees with docs/15 on visuals, this document is the proposal
> and docs/15 is what is live.

---

## 1 · The idea in one sentence

**The app is a logbook. You write in black ink. The coach writes in blue. Nothing blue
counts until you make it black.**

That one rule does the work the PRD asks for (D5, I12, P6: AI output is an estimate the
user confirms) and gives the whole product a look that no dark-glass fitness app has:

| | |
|---|---|
| Ground | Cool off-white paper, not OLED black. A **Chalk** mode exists as a variable mode for the gym floor. |
| Your ink | Near-black. Every confirmed thing: logged sets, saved meals, weigh-ins, recorded payments. |
| The coach's ink | Cobalt, in sans italic, with a citation line in mono. Every proposal: a set heard from your voice, a dish read from a photo, the weekly review, an answer to a question, a draft plan for a trainer, a drafted message for an owner, rows read from a paper register. |
| Numbers | IBM Plex Mono for every figure, so sets, kcal and rupees line up like a ledger. |
| Words | Instrument Sans. Noto Sans Devanagari for Hindi, at the same sizes. |
| Surfaces | Ruled rows and section lines, not cards. Panels only where a surface means something: a proposal, a dashed estimate, a sheet. |
| Shapes | 4 px rectangles for controls, 2 px stamps, 12 px sheets. No pills, no glows, no sparkle icons. |
| Action | One black primary button per screen, 50–56 px, in the thumb zone. The logger's *Save set* is 56 px with the mic beside it. |

The rules of the two inks (also on the Figma page *10 Coach (AI)*):

1. Blue is never counted in totals, records or charts.
2. Every blue statement cites the rows it rests on.
3. Confidence is *detection* confidence, said in words, never nutritional accuracy.
4. Low confidence starts unticked.
5. Confirming is a black action in the thumb zone; the row then turns black in 150 ms with one light haptic.
6. The original proposal stays readable after you correct it (AC-10).
7. When Pro ends, blue locks; black never disappears (PRO01.7).

## 2 · What is in the Figma file

Seventeen pages. Every frame is a 412 × 915 Android viewport with a label above it and a
one-paragraph design note below it. Sheets and dialogs are drawn over their base screen.

| Page | Frames | Screens |
|---|---:|---|
| 00 Cover & system | — | Cover, colour (Paper and Chalk), type ramp, 48 components, principles. Variables: `Logbook` collection with Paper/Chalk modes (36 variables). 17 local text styles `Logbook/…` |
| 01 Auth & onboarding | 19 | A-01, A-02, A-03, A-04, A-05a, A-05b, A-06, A-11, A-12, A-07a–d, A-07f, A-08, A-09, A-10, A-13, A-14 |
| 02 Home | 7 | B-01 (populated, first run, session open + offline), B-02, B-03, B-04, B-05 |
| 03 Train | 14 | C-01…C-09, D-01…D-05 |
| 04 Logger | 13 | E-01…E-13 (E-03 shows a voice proposal in blue) |
| 05 History & analytics | 14 | F-01…F-07, G-01…G-07 |
| 06 Food | 21 | H-01…H-18, H-08 text and photo variants, H-18 detail, **P-04** locked state |
| 07 Body & goals | 10 | I-01…I-06, J-01…J-04 |
| 08 Settings & Pro | 14 | K-01…K-10, K-07 delete flow, **P-01** paywall, **P-02** trial, **P-03** manage Pro (replaces K-11) |
| 09 Gym (member) | 11 | N-01 (plus a Hindi version), N-02…N-10 |
| 10 Coach (AI) | 4 + board | **P-05** say a set, **P-05b** notebook photo, **P-06** weekly review, **P-06b** ask your data, and the two-inks principle board |
| 11 Owner workspace | 24 | O-01 (+ workspace switcher), O-02…O-22, **O-06b** register reader |
| 12 Trainer workspace | 5 | T-01…T-05 (T-03 carries the plan copilot) |
| 13 System states | 10 | L-01 (+ filtered-empty), L-02 (+ sync centre), L-03…L-08 |
| 14 Motion spec | — | 18-row motion table and the proposed → logged storyboard with the Reanimated snippet |
| 15 Second pass · member | 6 + board | B-01 v2, I-01 v2, H-01 v2, N-01 v2, E-03 v2 in Chalk, H-08 v2, and the what-changed board (see §8) |
| 16 Prototype | 88 | Clickable copies of the screens above, wired into seven flows (see §9) |

That is every screen in docs/04 (103) and every addition in docs/16 §18 (47), plus
state variants. Phase-2 and gated screens are drawn and stamped *P2* or *gated* so the
design is complete but honest about what ships when.

## 3 · Where the coach appears

| PRD requirement | Screen(s) | How it is drawn |
|---|---|---|
| FR-PRO02 photo and text food analysis | H-03, H-06, H-07, H-08, H-08b, H-01, H-02, H-18 | Entry rows carry the *Pro* stamp; the review is a list of blue proposals with amount, household unit, kcal, confidence bar and word, match line; the diary shows the unconfirmed item in a blue band outside the totals |
| PRO01 paywall, trial, locked state | P-01, P-02, P-03, P-04 | Price, period and cancel path before purchase; no countdown; locked rows stay visible and greyed |
| PRO03 voice and text set logging `[P2]` | E-03, P-05, P-05b | Mic beside *Save set*; listening sheet with transcript and a blue proposal; notebook photo becomes a proposed past session |
| PRO04 weekly review and ask-your-data `[P2]` | B-01 coach note, P-06, P-06b | A letter, not a dashboard: each claim cites its rows; questions in black, answers in blue with sources |
| PRO05 owner assistance `[P2]` | O-02, O-14, T-03 | *Ask the gym* on Today; *Why this member* and the drafted Hinglish message on each call; the plan copilot on Assign |
| GYM02.9 register reader `[P2]` | O-06b | Rows read from a paper register, each a blue proposal with confidence, confirmed one by one |
| PRO06 AI calling `[P2]` `[gated]` | O-21, O-22 | Drawn as the designed state, stamped gated |
| K-08 preferences | K-08 "The coach" | The one setting that is not a setting: *always show me the result before saving* is a locked-on guarantee |

## 4 · Tokens

Paper mode values (Chalk values live in the Figma variables):

| Token | Value | Use |
|---|---|---|
| paper / paper2 / paper3 | `#F2F3F0` / `#E9EAE6` / `#DFE0DB` | ground, inset panels, tracks |
| rule / rule2 | `#D3D4CF` / `#B8BAB3` | hairlines, control strokes |
| ink / ink2 / ink3 / ink4 | `#121314` / `#45474A` / `#6B6E6B` / `#8E918C` | text and the primary button |
| cobalt / cobaltInk / cobaltWash / cobaltRule | `#1F3FD6` / `#1733A8` / `#E3E7F9` / `#B3BEEF` | the coach: bar, text, proposal wash, proposal strokes |
| good / warn / bad | `#1E7A4A` / `#9A5300` / `#B3261E` | status, always with a word; each has a wash |

Type: `display 48`, `figure 34`, `stat 24`, `num 15`, `numS 13`, `label 11` in Plex Mono;
`h1 28`, `h2 21`, `title 17`, `body 15`, `small 13` in Instrument Sans; `coach 16 italic`;
`hindi 15`. Spacing 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48, side inset 20. Touch targets 44,
56 in the logger. All contrast pairs used for text are at or above 4.5:1 on paper.

## 5 · Motion

Every animation passed the gate from the project's `animate-expo` skill first: how often
does it happen, and what does it communicate. The full table is on the *14 Motion spec*
page. The short version:

| Moment | Decision |
|---|---|
| Tab switches, screen push and pop | The platform's. Native tabs, native stack, no sliding between tabs. |
| Press feedback | scale 0.97, 100–150 ms, ease-out, on press-in. |
| Proposed row → logged | Two stacked fills crossfade, 150 ms, ease-out, one light haptic at the commit frame. Reduced motion keeps the colour change. |
| A proposal appears | opacity 0→1, translateY 6→0, 200 ms. |
| Rest timer | An absolutely positioned childless bar driven by a target instant; linear; a Success haptic at zero. |
| Sheets (rest timer, say a set, portion, record payment) | Native `formSheet`, spring 300 ms, damping 0.8. |
| The weekly note arriving, a personal record | The delight budget: 250–300 ms, once; the PR overlay is skipped entirely under reduced motion. |

Rules: never `scale(0)`; never animate height, width, margin or flex (the timer bar is the
documented exception); never `setState` in a gesture or scroll handler; haptics once per
action, never alone; judge feel on a release build on the slowest Android supported.

## 6 · What the file deliberately does not do

- **No photographs.** Plate photos, progress photos and the register page are drawn as
  labelled placeholders; swapping in real images is a Figma-side task.
- **Hindi is sampled, not translated.** A-11, A-13, D-01 and N-01 show Devanagari in the
  type system; the full Hindi pass belongs with AC-25 in implementation.
- **Chalk mode is a variable mode, not a second set of screens.** Toggle the mode on any
  frame that is bound to the variables; the screens themselves are drawn in Paper.
- **Components are flat.** The 48 components on page 00 are main components, but the
  screens are built from plain frames, not instances, so they can be edited freely.
  Promote them to instances as the direction settles.

## 7 · How to review, and what happens next

1. Open the file. Start at *00 Cover & system*, then *02 Home*, *04 Logger* and *06 Food*:
   those four pages carry the argument. Read the note under each frame.
2. Decide the direction: Logbook, Kinetic Performance, or a blend. The two inks and the
   mono figures are the parts that most change how the app feels; the colour of the ground
   is the part most easily revisited.
3. If Logbook goes ahead, implementation follows the same order docs/15 used: tokens
   (`apps/mobile/src/theme/tokens.ts`, with a Paper/Chalk switch), fonts in
   `app/_layout.tsx`, the primitives in `apps/mobile/src/ui/` (Row, Section, Stamp,
   Coach note, Proposed block, Confidence, Stepper), then screens in the order the user
   meets them: home, logger, food review, progress, gym, owner, trainer.
4. The docs/05 §9 accessibility rules still hold and `src/theme/__tests__/contrast.test.ts`
   should pin the new pairs before any screen is rebuilt.

## 8 · Second pass (3 October 2026)

The owner's read of the first pass: boring, heavy with text and numbers, likely to feel
complicated. The diagnosis: every row ended in a number at the same volume, mono numerals
in every secondary line read as an accountant's terminal, and there was nothing to look at.
Page *15 Second pass · member* redraws the five screens that carry the argument, keeping the
two inks and the confirm-before-it-counts flow and changing the register of the member
screens:

| Rule | What it does |
|---|---|
| Ledger where you record, picture where you look back | The logger, owner and trainer keep the ledger. Home, Progress, Food and the gym card get one hero each. |
| One loud thing per screen | Home leads with today's session, the trainer and pictograms of the exercises; Progress with the person's own photos; Food with the single number that matters; the gym card with the gym itself. |
| Mono only where the number is the point | Hero figures and set tables stay mono. Secondary lines return to the sans, in words where words will do. Home shows five numbers above the fold instead of twelve. |
| Imagery with meaning | Exercise pictograms (one line weight, 32-grid), trainer and member avatars, the gym's own colour used only on its own surface, progress photos as the Progress hero. No decoration. |
| Fold the detail | Macros, matches and model names sit behind *Details* on the review. Measurements and strength fold into rows on Progress. |
| Let the logger go dark | E-03 in Chalk mode for the gym floor: the figure as big as the thumb needs, the pictogram instead of a muscle list, the coach's heard set in chalk-blue, *Save set* as the only black-and-white action. |

If this register is approved, the same rules roll out to the rest of the member pages
(02, 05, 06, 07, 09) before anything is implemented. Owner and trainer pages keep the first
pass; their users want the ledger.

## 9 · Prototype (3 October 2026)

Page *16 Prototype* turns the screens into a clickable prototype. Figma can only link
top-level frames on the same page, so the 88 screens that take part are copied onto that
page (the numbered pages stay the record; the copies are plain clones, so a screen edited
on its source page has to be re-cloned to update the prototype). 281 hotspots, seven flows.

**How to play it.** Open the file, open page *16 Prototype*, press *Present* (▶, top right,
or Shift + Space). The flow menu at the top left of the player lists the seven flows below;
pick one, then tap. A tap on anything that is not a hotspot flashes the hotspots in blue.
The device is 412 × 915; choose *Fit* in the player if the frame is cut off.

| Flow | Starts at | Path |
|---|---|---|
| Member · a day | B-01 v2 Home | Start workout → E-02 → tap a row → E-03 v2 (Chalk) → mic → P-05 say a set → confirm → Save set → Finish → E-08 → E-11 → Home. Log tab → B-03 quick actions. Food tab → add food → search → H-05 → diary; describe → H-06 → H-07 (waits 2.5 s) → H-08 v2 review → save. Progress tab → log weight. Gym line → N-01 v2 → check in → N-02 (waits 2 s) → N-03. Coach note → P-06 weekly review → P-06b ask your data. Bell → B-04. Avatar → K-01 → The coach / Pro. |
| Member · first run | A-01 Splash (1.5 s) | Welcome → Create account → About you → units → activity → goal → training days → targets → starting point → Join a gym → consent → All set → Home or log weight. Branches: I already have one → Welcome back → Home; phone → code → Home; Forgot password → reset → check email → new password. |
| Member · train library, history, analytics | C-01 Train | Programs → C-02 → C-03 → start; + → C-04. Exercise library → D-01 → D-02 → add to workout / progression. History → F-01 → F-03 → repeat. Analytics → G-01 → G-03. On Progress: Strength segment → G-01, Consistency → F-01, Compare → I-05 photos, Measurements → I-04. |
| Member · gym services | N-01 v2 Gym card | ₹700 → N-04 dues; 12 of 16 → N-07 challenge; today's plan → N-06 → start; Receipts and dues; Sharing → N-05 (unlink); Request a freeze → N-10; Bring a friend → N-08. N-09 (taking a break) → home routine or renew. |
| Owner · set up and run Iron Temple | O-01 Create gym | Today (O-02): workspace switcher, Record a payment → O-09 → O-10 receipt, Today's calls → O-14, Visits → O-12, Open the list → O-11 dues. Members (O-03): member → O-04 → record payment / Renew (O-08) / receipt; Add member → O-05 → plan field → O-07 plans; Import → O-06; Unlinked → O-20 invites; Dues → O-11. Money: Record → O-09. More (O-16): Export → O-17 reports. Tab bar on every root. |
| Owner · read the paper register | O-06b | The photo-import review on its own, confirm → Members or retake → O-06. |
| Trainer · Rahul, a day | T-01 Today | member → T-02 → Assign a plan → T-03 (plan copilot) → assign; Record measurements → T-05 → save. Plans tab → T-04 templates → T-03. |

**Transitions follow §5.** Drill-ins push left (0.3 s, ease-out) and back arrows push right;
sheets and dialogs smart-animate (0.3 s); tab changes and proposed → logged dissolve (0.15 s).
Timed steps: splash 1.5 s, gym check-in 2 s, photo analysis 2.5 s.

**Not wired, by choice.** Typing (the keyboard screens are static), in-screen scrolling,
filter chips, the O-08 plan picker, owner screens O-13, O-15, O-18, O-19, O-21, O-22, the
trainer *More* tab, the Hindi N-01, the goal screens J-01…J-04, settings K-02…K-07, the
system states on page 13, and the states on page 15 that already appear as screens.
Everything else on the numbered pages that a member, owner or trainer can reach by tapping
is reachable in the prototype.
