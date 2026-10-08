# FitLog Coach OS

Coach OS is the mobile design system for FitLog's member, trainer and owner
surfaces. It is an instrument panel for a dim gym: graphite depth, quiet paper
type and a single electric action colour make the next action obvious without
turning every card into a billboard.

## Direction

- **Primary mood:** cinematic centre, selected by the deterministic gpt-taste
  plan. A clear focal card leads each route, followed by dense but calm utility
  rows.
- **Type:** Hanken Grotesk is the bundled production face. It replaces the old
  split Inter/Hanken treatment so labels, logs and figures share one rhythm.
  The wider Outfit direction from the concept pass is represented through
  weight and tracking until a separately licensed Outfit asset is available.
- **Colour:** dark mode is primary. `#0B0C0E` page, `#151719` surface,
  `#1D2023` raised panel, `#F6F7F2` ink and `#D7FF4F` action. Light mode keeps
  the same hierarchy with warm paper surfaces and a contrast-safe `#4F6400`
  action. Status colours are still reserved for fills and icons; text uses the
  `*Ink` tokens.
- **Shape:** 16dp cards, 10dp rows, 12dp controls and 999dp dots/avatar
  surfaces. Borders are hairlines in the same tonal family. Shadows are used
  only on focal cards and the central action.

## Layout contract

Every route uses `ScreenScaffold` for safe areas, a 72dp header and one scroll
surface. Tab roots use the native-feeling bottom rail with five peer actions and
one raised add action. Content padding is at least 16dp; bordered or coloured
containers have 12–24dp internal padding. Interactive controls are at least
44pt iOS / 48dp Android.

The page pattern is:

1. a clear focal card that answers “what should I do now?”;
2. one reviewable coach suggestion where AI can remove friction;
3. the evidence or data needed to make a decision;
4. deeper management rows at the bottom.

## AI helper contract

`src/features/coach/CoachPrompt.tsx` is the shared AI surface. It uses the
role label (`For your next move`, `Trainer copilot`, `Gym operations copilot`),
states that it is a suggestion, and always ends in an existing reviewable flow.
It never writes a workout, nutrition item, payment or message by itself. Owner
and trainer surfaces label Pro-gated ideas and require approval; member food and
training suggestions remain estimates until confirmation.

The gym workspace route (`app/gym/index.tsx`) is a UI-first role preview. Its
sample values are marked `Preview` and are deliberately isolated from the data
layer so the owner, trainer and member flows can be tested before the PRD's
gym APIs land.

## Motion contract

Motion has a purpose: **feedback**, **state indication** or **spatial
consistency**. Tab changes do not slide. Existing press feedback uses a small
0.98 scale and opacity response, capped under 150ms, while navigation stays on
Expo Router's native transition. Reduce Motion removes the scale while keeping
the state response. A future Reanimated pass should keep all
continuous gestures on the UI thread, use `transform`/`opacity`, and remove
translation and scale under Reduce Motion while preserving the state change.
No looping decoration or scroll-jacking is part of Coach OS.

## Accessibility and platform behavior

Dynamic Type/font scaling remains enabled. Text and layout must survive large
font sizes without hard-coded animated heights. Safe-area and keyboard insets
are owned by the scaffold. Back uses the platform stack. Dark/light colors are
semantic through `useTheme`; the contrast suite covers ink, muted, action and
status tones on page, surface and sunken backgrounds.
