# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

FitLog serves three equal workspaces: gym members who want a plan they can follow and progress they can trust; trainers who need a working roster, shared training context and fast plan assignment; and independent gym owners or staff who need a usable member register, dues ledger, attendance signals and renewal follow-ups on an Android phone.

## Product Purpose

FitLog is the shared system between a gym and its members. A member keeps their personal training, nutrition and progress record; a trainer can work from consented training data; and the gym gets free operational software that makes renewals, dues and member drift visible. Success means a member can reach the next useful action in one tap, a trainer can assign and review a plan quickly, and an owner can run the gym without a desk computer.

## Positioning

The gym is a relationship layer inside a member-owned fitness record. FitLog connects the gym card, trainer plan, training log, food record and owner register without making the gym own the member's personal data.

## Operating Context

The product is used on ₹8–10k Android phones, in gym basements with unreliable networks, in English, Hindi and Hinglish. Owners commonly use cash and UPI, trainers work on the gym floor, and members log workouts one handed between sets. Offline writes, explicit sync states and system Back/edge gestures are part of the experience.

## Capabilities and Constraints

- Phone sign-in, onboarding, training, workout logging, nutrition, body/progress, analytics, health sync, reminders, settings and account recovery already exist in the native app.
- Gym MVP surfaces include the member register, memberships, dues and payments, receipts, attendance without access control, absence alerts, trainer roster and plan assignment, reports, exports and offboarding.
- AI features are Pro-gated. AI output is an estimate the user confirms; it must never silently change a plan, issue a receipt, send a message or make a medical claim.
- A workout set commit must remain fast and local even when the network or AI is unavailable.
- Member sharing is purpose-specific and revocable. Private workouts must never appear as an empty history to staff.
- Under-18 account rules, pricing, visit eligibility, shared-phone identity and some assignment semantics remain open decisions in the PRD.

## Brand Commitments

The product is FitLog. The gym is the brand a member sees inside gym surfaces. The interface must remain useful in dark rooms and readable with larger system text. English, Hindi and Hinglish copy must be able to coexist without breaking layouts.

## Evidence on Hand

The current product implementation is in `apps/mobile`. The requirements source is `docs/16-PRD-GYMS.md`; the supplied Android captures are under `docs/screenshots/`; the previous design work is under `docs/design/gym-redesign/` and `docs/19-UIUX-GYMS-COACH-OS.md`. No production visual redesign has been approved yet.

## Product Principles

- The member owns their personal record; the gym sees only consented purpose-specific data.
- The owner's operational core remains free; AI is a paid helper, not the entry barrier.
- Nothing gates gym entry and no network failure blocks training.
- AI explains and suggests; the user confirms every consequential write.
- The app must work on low-cost Android hardware, in a gym basement, with readable native controls.

## Accessibility & Inclusion

Respect iOS Dynamic Type and Android font scaling, safe-area and IME insets, 44pt iOS and 48dp Android touch targets, system Back and Reduce Motion. Use high-contrast semantic colors in light and dark themes and keep important state readable without color alone.
