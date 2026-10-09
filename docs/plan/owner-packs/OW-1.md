# OW-1 · Choose the UI direction and settle its open rules

> **DRAFT, for the owner to review.** Prepared by owner-concierge on 10 Oct 2026. Every
> recommendation below comes from the repo's own docs, which are cited. This is a design decision,
> not advice of any other kind.

**Why it matters.** 84 goals wait on this one, and its chain is 20 goals long, the longest in the
plan. It opens QA-1 ("Triage the working tree"), the first goal an agent can run. Together with
OW-2 it also opens DS-6 (app icon, splash and store art).

**How to answer (one sitting, about 15 minutes).**
- To accept every recommendation, write **go** on the line below.
- To change one, write your answer on that question's **Answer:** line. A blank line means "the
  recommended default".

**All five as recommended:** ______

**What happens after you answer.**
1. A session writes your answers into the charter as decision **D47** (`docs/08-PROJECT-CHARTER.md`
   §6). D47 supersedes D9, the Iris violet accent. D36–D46 are already reserved by docs/17 for the
   gym decisions, so D47 is the next free number. A draft of the D47 row is at the end of this pack.
2. You read the D47 row once. Ticking the goal Done is yours:
   `node scripts/plan/status.mjs set OW-1 done --who You`, or the board
   (`node scripts/plan/serve.mjs`, then http://127.0.0.1:4317).

**Optional, if you want to look again first (10 minutes).** Open the Figma file *FitLog — Momentum
(expressive UI)*, go to page 02, press *Present*, and play *Member · a training day* (docs/22 §9).

---

## Q1 · Momentum: yes or no?

| Option | Consequence |
|---|---|
| **A. Momentum** (docs/22) | **Recommended.** The plan's M2/M3 cards are written for it, and design work starts the moment QA-1 lands. |
| B. Kinetic Performance (docs/15, live on `main` since 2 Oct) | Least change to today's code. But it has a blue accent, and you moved past it twice since. The M2/M3 cards keep their shape with other tokens. |
| C. The Logbook (docs/21) | You found it "fine but too minimal for gym-goers" (docs/22, intro). |
| D. Coach OS (docs/19, branch `codex/coach-os-redesign`) | Described in its own tokens as "a calm instrument panel" (`tokens.ts`). It is the opposite of the expressive brief. |

**Why A.** It is the latest direction, and the only one built to your standing brief: expressive,
eye-catching, native to each platform, one accent (docs/22 §1–§2; GOALS.md OW-1). Every screen in the
inventory (150 frames) is drawn, and each page is a clickable prototype (docs/22 §3.1, §6).

**Answer:** ______

---

## Q2 · The Coach OS work: which parts come into Momentum?

**Where it stands today.** The Coach OS redesign is committed as `b4a9ba9` ("Redesign mobile app
with Coach OS UI") on branch `codex/coach-os-redesign`, in a Codex worktree whose working tree is
clean. So it is saved and nothing can be lost.

**One thing to know.** `main` itself also carries Coach OS code today: `tokens.ts` is headed "Coach
OS" with the `#D7FF4F` lime and Hanken-only fonts, and `CoachPrompt` appears on Home, Train, Progress
and Nutrition, plus `app/gym/index.tsx`. So QA-1 still has to take the parts you drop out of `main`.
The branch already holds a copy, so that step loses nothing.

| Part | Recommended | Why |
|---|---|---|
| 48 dp minimum touch targets (56 dp in the logger) | **Keep** | Matches Android's floor; Momentum's logger button is larger still (96 dp, docs/22 §1) |
| Reduce Motion respected on press | **Keep** | docs/22 §5: "Reduce Motion keeps state changes and drops movement" |
| Default stack animation (`app/_layout.tsx`) | **Keep** | Platform-native transitions, which Momentum asks for |
| Lime `#D7FF4F` | **Drop** | Momentum's lime is `#C6F432` (Q5) |
| Hanken Grotesk as the only font | **Drop** | Momentum uses Google Sans Flex for words and Roboto Condensed for figures (docs/22 §1) |
| `CoachPrompt` and its four insertions | **Drop from `main`** | SC-1 rebuilds it as Momentum's coach proposal card: violet ink, dashed border, neutral card (docs/22 §1, §4) |
| Gym header icon and `app/gym/index.tsx` | **Drop from `main`** | G16.app rebuilds the gym screens properly (QA-1 card) |
| `apps/mobile/DESIGN.md` and `PRODUCT.md` | **Keep on `main`, to be rewritten** | QA-2 rewrites both for the chosen direction (QA-2 card). PRODUCT.md:27 wrongly says phone sign-in exists |
| `apps/mobile/.impeccable/` | **Drop from `main`** (it stays on the branch) | It describes Coach OS only |

| Option | Consequence |
|---|---|
| **A. As the table says** | **Recommended.** `main` keeps three small, useful rules; everything else lives only on the Coach OS branch. |
| B. Keep all of Coach OS on `main` until Momentum replaces it screen by screen | Less work for QA-1, but two design systems live on `main` for weeks, and the screen sessions build on the wrong tokens. |
| C. Drop all of it, including the three rules | Simplest, but DS-1 has to redo the touch-target and Reduce Motion work. |

**Answer:** ______

---

## Q3 · The "no green" rule

**Today.** `tokens.ts` has a green success colour (`good: #3FD07B`) and a green chart series
(`s3: #34D399`, the fat series in protein · carbs · fat · fiber).

| Option | Consequence |
|---|---|
| **A. No green anywhere.** "Done" and "logged" use the lime's tonal container; macro charts use the lime's tonal range and neutrals | **Recommended.** Keeps the volt lime readable for colour-blind users. |
| B. Keep a green success colour and a green series | Puts back the exact failure that made D9 reject lime: it measured ΔE 0.3 from the series green, which is indistinguishable (charter D9). |

**Why A.** docs/22 §1 says Momentum "has no green series and no green 'success' colour, and must keep
it that way", and docs/22 §9 makes it one of three rules to record with the new accent. The other two
are in Q5.

**Answer:** ______

---

## Q4 · Navigation

**Today** (`src/ui/shell/tabs.ts`): Home · Train · **[+]** · Nutrition · Progress. The **[+]** centre
slot opens the quick-action sheet (B-03).

| Option | Consequence |
|---|---|
| **A. Today · Train · Food · Progress · Gym**, with B-03 as a floating action button | **Recommended.** This is what Momentum draws (docs/22 §3.1 "B-03 FAB menu", §6 tab bar). Five tabs keeps D2. |
| B. Keep today's five slots, with Gym reached from Today | No gym tab to explain, but the Momentum screens and prototypes no longer match the app. |
| C. Four tabs (Today · Train · Food · Progress) plus the floating button; Gym only inside Today | Fewer tabs, but gym members lose a one-tap way to check in (N-01 is a hero screen). |

**Sub-question: what does the Gym tab show to a member who has no gym?** No doc answers this. Gym
features are built only after the G12 "go" (OW-10).
- *Suggested default (not from any doc):* the Gym tab appears only once gym features ship **and** the
  member has joined a gym. Until then, members see four tabs and the floating button.
- *Alternative:* always show it, with the "Join a gym" screen (A-13a).

**Answer:** ______
**Sub-answer:** ______

---

## Q5 · Confirm the accent: volt lime `#C6F432`

You chose it on 4 Oct by a colour-blindness test. Ember orange failed against the error red (ΔE 1);
volt lime scored 20 against the error red and 18:1 contrast on dark (docs/22 §1).

What gets recorded:
- seed `#C6F432`;
- Dark mode accent `#CAFD00`;
- Light mode graphics `#556D00` (docs/22 §4).

The same entry supersedes D9.

Three rules go with it (docs/22 §9):
1. no green "success" colour (Q3);
2. no green chart series (Q3);
3. lime never as a thin line or small text on Light surfaces.

| Option | Consequence |
|---|---|
| **A. Confirm volt lime, with the three rules** | **Recommended.** DS-6 can redraw the icon and store art, which are still Iris violet `#5A31C4` (DS-6 card). |
| B. Re-open the accent | DS-1 (tokens) and DS-6 (icon) wait for a new colour-blindness test. |

**Answer:** ______

---

## Draft of the charter row (for the session to paste into `docs/08` §6)

> DRAFT, for the owner to review. The session fills it from your answers above.

| # | Decision | Date | Rationale |
|---|----------|------|-----------|
| D47 | **Momentum is the UI direction** (docs/22); **supersedes D9.** (1) Momentum. (2) From Coach OS, `main` keeps 48 dp targets (56 dp in the logger), Reduce Motion on press and the default stack animation; the rest stays on branch `codex/coach-os-redesign` (`b4a9ba9`). (3) No green: no green success colour, no green chart series. (4) Tabs Today · Train · Food · Progress · Gym, B-03 as a floating action button; the Gym tab shows once gym features ship and the member has a gym. (5) Accent volt lime, seed `#C6F432` (Dark `#CAFD00`, Light graphics `#556D00`); lime never as a thin line or small text on Light surfaces | 10 Oct | Owner. The only direction built to the expressive, platform-native, one-accent brief. The accent was chosen on 4 Oct by the same colour-vision test that chose D9 (docs/22 §1): ΔE 20 vs error red, 18:1 on dark. D9 rejected lime only because of a green chart series, which Momentum removes |
