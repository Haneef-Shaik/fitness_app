# DS-1 · Contrast matrix, both schemes

**Date** 2026-10-27; AppButton focus-ring rows added 1 Nov 2026 (source only, **UNRUN**); focus and
known-gap wording corrected 1 Nov 2026 after that day's review (records only) · **Method** WCAG
2.2 relative luminance and contrast ratio (`apps/mobile/src/theme/contrast.ts`), computed from the committed
`momentum.json` · **Kind** palette arithmetic. It is not a capture of rendered pixels on a device; rendered
checks belong to box 3 and DS-4.

Bars: **4.5:1** for text, figures and icon labels (SC 1.4.3); **3:1** for strokes and component boundaries
(SC 1.4.11). Every row below is a named case in `src/theme/__tests__/contrast.test.ts`, in both schemes.
- **Attempt-1 run (2026-10-27, inherited, not re-run):** the file had 139 cases.
- **Now: 145 cases authored, none run since.** That is 119 pair rows, 6 focus-ring rows, 1 known-gap pin,
  2 coverage checks, 9 light-lime cases and 8 helper cases. The 6 focus-ring rows are the only addition.

`outlineVariant` is the only role left unpinned; it is decorative (dividers) and listed as such in the test.
The ratios in the tables are the attempt-1 values. The known-gap section below was rewritten on 1 Nov 2026
to record the Codex decision (also in `docs/plan/runs/DS-1/handoff.md`). Its attempt-1 wording, which
counted violet ink as identifying a proposal, is withdrawn there.

## Dark

| Ink or stroke | surface | surfaceLow | surfaceContainer | surfaceHigh | surfaceHighest | Bar |
|---|---:|---:|---:|---:|---:|---:|
| onSurface `#FBF9F1` | 18.25 | 17.56 | 16.60 | 15.57 | 14.47 | 4.5 |
| onSurfaceVariant `#ACABA4` | 8.35 | 8.03 | 7.60 | 7.12 | 6.62 | 4.5 |
| primary / dataTrain / dataFuel / dataGold `#CAFD00` | 16.09 | 15.48 | 14.64 | 13.72 | 12.76 | 4.5 |
| dataStreak `#ACABA4` | 8.35 | 8.03 | 7.60 | 7.12 | 6.62 | 4.5 |
| error `#FF716C` | 7.17 | 6.90 | 6.53 | 6.12 | 5.69 | 4.5 |
| coachInk `#CDBDFF` | 11.29 | 10.86 | 10.27 | 9.63 | 8.95 | 4.5 |
| outline `#76766F` | 4.21 | 4.05 | 3.83 | 3.59 | 3.33 | 3 |

| Family | Foreground on container | Ratio | Bar | Result |
|---|---|---:|---:|---|
| action | onPrimary `#516700` on primary `#CAFD00` | 5.34 | 4.5 | pass |
| action | onPrimaryContainer `#495E00` on primaryContainer `#CAFD00` | 6.09 | 4.5 | pass |
| action | onSecondaryContainer `#CAD6A3` on secondaryContainer `#414B24` | 6.05 | 4.5 | pass |
| data | onDataGoldContainer `#CAD6A3` on dataGoldContainer `#414B24` | 6.05 | 4.5 | pass |
| data | dataStreak `#ACABA4` on dataStreakContainer `#252620` | 6.62 | 4.5 | pass |
| error | onErrorContainer `#FFA8A3` on errorContainer `#9F0519` | 4.53 | 4.5 | pass |
| coach | coachInk `#CDBDFF` on coachContainer `#1F201A` | 9.63 | 4.5 | pass |
| coach | onCoachContainer `#FBF9F1` on coachContainer `#1F201A` | 15.57 | 4.5 | pass |
| coach | coachOutline `#8F74F0` on coachContainer `#1F201A` | 4.63 | 3 | pass |
| gym | onGymBrand `#FFFFFF` on gymBrand `#C8262B` | 5.57 | 4.5 | pass |

## Light

| Ink or stroke | surface | surfaceLow | surfaceContainer | surfaceHigh | surfaceHighest | Bar |
|---|---:|---:|---:|---:|---:|---:|
| onSurface `#383833` | 11.48 | 11.18 | 10.67 | 10.11 | 9.64 | 4.5 |
| onSurfaceVariant `#65655E` | 5.72 | 5.57 | 5.32 | 5.04 | 4.80 | 4.5 |
| primary / dataTrain / dataFuel / dataGold `#556D00` | 5.72 | 5.57 | 5.32 | 5.04 | 4.81 | 4.5 |
| dataStreak `#65655E` | 5.72 | 5.57 | 5.32 | 5.04 | 4.80 | 4.5 |
| error `#B31B25` | 6.59 | 6.43 | 6.13 | 5.81 | 5.54 | 4.5 |
| coachInk `#6745C7` | 6.29 | 6.12 | 5.84 | 5.54 | 5.28 | 4.5 |
| outline `#81817A` | 3.82 | 3.72 | 3.55 | 3.37 | 3.21 | 3 |

| Family | Foreground on container | Ratio | Bar | Result |
|---|---|---:|---:|---|
| action | onPrimary `#FFFFFF` on primary `#556D00` | 5.88 | 4.5 | pass |
| action | onPrimaryContainer `#495E00` on primaryContainer `#CAFD00` | 6.09 | 4.5 | pass |
| action | onSecondaryContainer `#4C562E` on secondaryContainer `#DCE8B4` | 6.07 | 4.5 | pass |
| data | onDataGoldContainer `#4C562E` on dataGoldContainer `#DCE8B4` | 6.07 | 4.5 | pass |
| data | dataStreak `#65655E` on dataStreakContainer `#E9E9DE` | 4.80 | 4.5 | pass |
| error | onErrorContainer `#570008` on errorContainer `#FB5151` | 4.54 | 4.5 | pass |
| coach | coachInk `#6745C7` on coachContainer `#EFEEE4` | 5.54 | 4.5 | pass |
| coach | onCoachContainer `#383833` on coachContainer `#EFEEE4` | 10.11 | 4.5 | pass |
| coach | coachOutline `#9B7BFF` on coachContainer `#EFEEE4` | **2.70** | 3 | **known gap** |
| gym | onGymBrand `#FFFFFF` on gymBrand `#C1121F` | 6.22 | 4.5 | pass |

## AppButton focus ring (rows added 1 Nov 2026, UNRUN)

AppButton draws its 2 dp inset border in its label colour on the fill it sits on, whenever React Native
reports focus. That includes focus reported while the button is disabled or loading. Whether a device
gives or keeps focus on such a button is **unverified**: RN's JS layer keeps it focusable and forwards
focus, but RN Android disables the native view (`BaseViewManager.java:387-389`). See
[focus-correction-2026-10-27T1605Z.md](focus-correction-2026-10-27T1605Z.md). Each case is
`$scheme · focus ring · $foreground on $background ≥ 3:1`.

| Scheme | Button state | Ring on fill | Ratio | Bar |
|---|---|---|---:|---:|
| dark | primary | onPrimaryContainer `#495E00` on primaryContainer `#CAFD00` | 6.09 | 3 |
| dark | secondary | onSecondaryContainer `#CAD6A3` on secondaryContainer `#414B24` | 6.05 | 3 |
| dark | disabled or loading | onSurfaceVariant `#ACABA4` on surfaceHigh `#1F201A` | 7.12 | 3 |
| light | primary | onPrimaryContainer `#495E00` on primaryContainer `#CAFD00` | 6.09 | 3 |
| light | secondary | onSecondaryContainer `#4C562E` on secondaryContainer `#DCE8B4` | 6.07 | 3 |
| light | disabled or loading | onSurfaceVariant `#65655E` on surfaceHigh `#EFEEE4` | 5.04 | 3 |

- **Where the ratios come from.** They are the attempt-1 values of the same pairs in the tables above,
  inherited and not re-run.
- **What these rows can catch.** Each pair is already pinned at 4.5:1 above, so these rows cannot fail
  unless those rows also fail. They record which pairs are focus rings. The component test
  (`src/ui/__tests__/app-button-focus.test.tsx`) ties them to AppButton by checking the exact role it
  draws.
- **Not measured here:** the ring against the surface outside the button. See
  [focus-correction-2026-10-27T1605Z.md](focus-correction-2026-10-27T1605Z.md), "Not claimed".

## The light-lime-as-container rule

The lime fill `primaryContainer` `#CAFD00` measures **1.16 / 1.13 / 1.08 / 1.03 / 1.02** against the five
light surfaces. That is below even the 3:1 graphics bar, so in Light it may only be a filled container
carrying `onPrimaryContainer` (6.09:1), never a line, icon or text. In Dark it measures 12.76–16.09.
The tests pin four things:

- the lime fails 3:1 on every light surface;
- its own label passes 4.5:1;
- no ink or stroke role reuses the lime value in Light;
- in both schemes the accent graphics (`dataTrain`, `dataFuel`, `dataGold`) equal `primary`. That is the
  darker `#556D00` in Light and the lime in Dark.

## Known gap: light coach outline (decided: decoration only)

The Figma-approved dashed border `#9B7BFF` on the light coach card `#EFEEE4` is 2.70:1, below the 3:1
non-text bar. The test pins it (`toBeCloseTo(2.7, 1)` and `< 3`): any palette change has to revisit it,
and fixing it forces the gap entry to be removed. DS-1 did not change the approved colour.

**Codex decision (AUTH-01 delegated, 27 Oct 2026): keep it.** The approved palette and its 33 curated
pins are preserved.
- **Decoration only.** The curated violet, as this border or as `coachInk`, is not accessibility
  evidence, and nothing may be identified by it.
- **Conditions.** That holds only while every AI proposal card:
  - (a) shows a visible text label naming it a proposal; a screen-reader label alone is not enough;
  - (b) if it can be acted on, is identifiable as interactive on its own, by a visible text control or a
    boundary of at least 3:1;
  - (c) has no state (accepted, unsure, ticked) that depends on the outline.
- **Who builds and tests them.** DS-4, on the proposal card; this matrix does not test them. The
  coordinator states that main's GOALS.md carries that DS-4 contract. This worktree's GOALS.md is an
  older copy, and main was not read.

**Withdrawn attempt-1 wording.** This section said: "The proposal is also identified by its label and
violet ink (5.54:1), so the border is a supplementary cue under SC 1.4.11." Violet ink is a colour, so it
identifies nothing. Its 5.54:1 is a text-contrast figure for `coachInk`; it is not evidence that the
card can be identified.

The options as recorded at attempt 1:
1. Keep it, with a text label on DS-4's AI proposal card. **Adopted**, and conditions (a) to (c) replace
   "a text label".
2. Use the existing `coachInk` `#6745C7` (5.54:1) for the light dashed border, which needs a Figma
   update. **The fallback, not adopted**, if DS-4 cannot guarantee (a) to (c).

Small margins worth knowing: dark `onErrorContainer` 4.53, light `onErrorContainer` 4.54, light
`onSurfaceVariant` and `dataStreak` on `surfaceHighest` 4.80, light `outline` on `surfaceHighest` 3.21.
docs/22 §4's statement that "every on-container pair ≥ 6.0:1" is not true for the error pairs; that is
reported to QA-2 rather than edited here.
