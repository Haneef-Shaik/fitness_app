# Full application delivery

Requested by the owner on 17 October 2026. Scope is the required member and gym MVP in PRD v2.1.
Phase 2/3 features retain their gates. Figma supplies layout; the PRD supplies behavior.

**Derived view.** Since 25 October this checklist is only a summary of the plan. The goals that own
each line are in brackets. A line is ticked only when all of its goals are Done on the
[plan board](../plan/README.md). Completion is decided by the goal contracts in
[GOALS.md](../plan/GOALS.md) and the [acceptance ledger](../plan/ACCEPTANCE.md), not by this file.

19 October checkpoint: connected member workflows and initial gym register/membership/payment/receipt
flows now run locally. Freeze requests, atomic approval/renewal shifts and early returns are also connected. The [implementation record](../architecture/002-connected-member-and-gym.md)
lists verified behavior, limitations and required remaining work. Broad checkboxes below stay open
until their entire PRD scope and acceptance gates pass.

- [ ] Expo + strict TypeScript, typed theme contract, system/light/dark settings, initial checks. [QA-1, DS-1] (built locally 17 Oct; not yet on `main` or reviewed)
- [ ] Versioned domain contracts, equivalent validation and relational ownership constraints. [AR-1]
- [ ] Auth: email/verification/recovery, Google/Apple/+91 provider adapters, session management. [MB-1, SC-5, G13, PL-3]
- [ ] Adult eligibility, notices, resumable onboarding and preferences/localization. [MB-1, SC-5, G14.app, G14.hi]
- [ ] Full native member navigation and current Figma component system/fonts. [DS-1–DS-5]
- [ ] Exercise library, custom versions, three reviewed starter programmes and programme/day editor. [CT-1, MB-2, SC-2, AP-1, OW-13]
- [ ] Scheduling/explicit occurrences, durable offline logger/outbox, recovery, rests/plates/supersets. [MB-2, MB-3, SC-1, SC-2]
- [ ] History/edit/delete/compare, volume/PR/e1RM/adherence analytics and formula fixtures. [MB-4, SC-2, SC-3, AP-2]
- [ ] Food catalog, diary/portions, custom foods, quick add, recipes/copy and effective-dated targets. [MB-5, SC-4, G14.data]
- [ ] AI consent/upload/dispatch/quota/review/confirmation; real provider and measured quality. [AI-1, AI-3, AI-2, G15.api]
- [ ] Body entries/private photos, numeric/manual goals and Today customization. [MB-6, SC-3]
- [ ] Profile/security/preferences, export/deletion, notifications/support and accessibility. [MB-7, SC-6, SC-7, QA-3]
- [ ] Gym workspaces/roles/register/import, membership/freeze, immutable finance/receipts. [G16.api, G16.app, G17.api, G17.app]
- [ ] Invites/visits/coverage/retention, programme offers, challenges/streaks/referrals. [G18–G22]
- [ ] Entitlements/store billing and guarded integration adapters. [G15.api, G15.app, OW-7]
- [ ] Device/large-text/screen-reader/offline/performance/security QA and hosted CI. [PL-1, QA-11, QA-3, QA-4, QA-12]
- [ ] Required vendor/legal/licensing/backup/beta/pilot/store release evidence. [M1, M5 and M6 owner goals; QA-5, QA-6, QA-7, G23]

External accounts/regions, phone/SMS, store commerce, AI procurement, legal/qualified review, actual
licensed content, reference devices and field evidence remain PRD §27 gates. Local development is
isolated; no production provisioning, real messaging, paid calls, store submission or deployment
is authorized merely by implementing an adapter. No complete-project claim while required ACs fail.
