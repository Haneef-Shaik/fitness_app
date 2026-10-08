# FitLog Coach OS — visual direction v2

This is the second visual direction for the gym product. It is a deliberate reset of the first study: less admin dashboard, more responsive operating system for a person, a coach and a gym.

## Design read

FitLog is a mobile-first fitness operating system for three equally important roles. The interface uses a dark, tactile, high-contrast language with one signal color: electric lime. Hanken Grotesk carries both the display voice and the numerals, so the product feels specific without adding a decorative font. The layout uses asymmetry, nested surfaces and short editorial copy instead of a wall of equal cards.

The working dials are:

- Design variance: 8/10 — asymmetrical hero surfaces, orbit marks, and varied card proportions.
- Motion intensity: 7/10 — tactile presses, coach sheet springs, and small state reveals; tabs stay still.
- Visual density: 5/10 — enough operational detail for owners and trainers, with a clear next action on every screen.

## Figma deliverable

[Open the editable Figma file](https://www.figma.com/design/lMwyxjm3xVG4IvAZ920wMf)

The file contains two pages:

1. **Coach OS / Foundations** — signal palette, type voice, helper language, and mobile motion rules.
2. **Coach OS / Screens** — six 390×844 editable screens:
   - `01 / Member — Coach Pulse`
   - `02 / Member — Focused logger`
   - `03 / Trainer — Copilot roster`
   - `04 / Trainer — AI plan studio`
   - `05 / Owner — Gym pulse`
   - `06 / Owner — Collections copilot`

All content is built from editable Figma text, shapes and frames. No screen is a flattened screenshot.

## What changed in the product model

### Member

Home becomes an invitation to act. The first surface is a Coach Pulse with a reasoned next step: a workout that fits the available time, current readiness and recent training load. The helper offers three small follow-ups—swap a move, find a meal around training, or ask a question—without making the member enter a chat flow.

The logger becomes a focused tool. The user sees the next set, previous sets and a contextual form cue. “Ask Coach” is available at the point of uncertainty, while the primary “Log set” action remains fast and obvious.

### Trainer

The trainer home is a sorted roster, not a feed. Copilot surfaces “3 members need a nudge” and explains the pattern as plan drift, not just a missing scan. Privacy stays visible: a member whose workouts are not shared is shown as private, never as an empty history.

Plan Studio treats AI output as a draft. The trainer supplies constraints, sees a concrete three-day structure, and explicitly assigns it. The coach explains which constraints were used, so the system remains reviewable.

### Owner

Owner Pulse translates the gym into a short decision queue: renewals, visit gaps and capacity. Money keeps the ledger factual while Collections Copilot proposes the order of work, such as the ₹18,400 recoverable this week. A helper can suggest, filter and draft; it does not silently send messages or issue a receipt.

## AI helper boundaries

Every helper has a named job and a visible source of confidence:

| Helper | Role | It can suggest | It must never imply |
|---|---|---|---|
| Coach Pulse | Member | next workout, swap, meal idea, trend explanation | medical diagnosis or an automatic plan change |
| Form Check | Member | a cautious technique cue from the current set | that camera analysis is perfect or that pain is safe |
| Coach Copilot | Trainer | roster priority, pattern summary, plan draft | access to private workouts or unreviewed assignment |
| Owner Copilot | Owner | renewal, attendance and capacity queue | a completed payment, message or ledger write |
| Collections Copilot | Owner | order of follow-ups and partial-payment context | final receipt or external message delivery |

The implementation should keep the AI response in the same card as the decision it supports. The helper is secondary to the user’s action, and every write remains explicit.

## Motion contract for the native app

Motion is purposeful and runs on the UI thread through Reanimated. The first pass should implement:

- Press feedback: `scale 0.97`, 120ms, transform only; pair with one light haptic on commit.
- AI card reveal: opacity plus `translateY(12px)` with a strong ease-out; no layout animation.
- Coach sheet: spring, about 300ms perceived, with velocity carried through a drag.
- Set commit: the row settles with a short opacity/color change and one success haptic.
- Tab switches: no sliding transition; tabs are peers, not a depth stack.
- Reduced motion: keep color and opacity state changes, remove translation, scale and overshoot.

Do not animate `height`, `width`, `margin`, `top` or `left` in gesture/scroll handlers. Validate the feel in a release build on the slowest supported Android device.

## Implementation order

1. Replace the member Home and logger shells with the Coach OS tokens and hierarchy.
2. Add the contextual helper surfaces with synthetic, explainable data and explicit user confirmation.
3. Rebuild trainer roster and Plan Studio with sharing/privacy states visible in the first screen.
4. Rebuild owner Pulse and Money with a decision queue, partial-payment semantics and pending-sync states.
5. Add native motion primitives, reduced-motion behavior and haptic timing.
6. Run equal-weight member, trainer and owner pilot tasks in English and Hindi before expanding the helper catalogue.

The Figma file is a design direction and interaction contract. It is ready for critique and implementation planning; it does not connect to production data or send messages, payments or permissions.
