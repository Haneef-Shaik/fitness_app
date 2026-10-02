# Study validation — 2 October 2026

**Scope:** review of the proposed [browser study](index.html), against [the UX brief](../../18-UIUX-GYMS-REDESIGN.md), PRD v2 and the current Android UI. Checks below were reported by the lead reviewer using the Codex browser controls. This report does not certify the native application or approve a replacement design system. The final independent finish review returned **Ship for concept review**, limited to the four prior findings below.

## Evidence

- Baseline: 172 Android PNG captures across 12 screenshot folders, covering 92 screen IDs according to the screenshot README; visually reviewed through contact sheets. Captures include continuations and empty/system states. Detailed implementation still needs full-resolution review of each affected screen.
- Current visual authority: `apps/mobile/src/theme/tokens.ts`, with blue accents, Hanken Grotesk headings/data and Inter body/labels. Existing mobile code, approved product documents and the older iris gallery were preserved.
- Review captures: desktop/member/trainer, 390px mobile roles, owner light theme and 320px member; interaction captures are saved in `review/`. Corrected states are captured in [dues filter](review/dues-filter-desktop.jpg), [template preview](review/template-preview-desktop.jpg) and [pending assignment](review/assignment-pending-desktop.jpg).

## Browser verification

| Area | Observed result |
|---|---|
| Member workout | Set stepper changes values; commit adds a local set; Undo reverses it. |
| Food and Pro | Food search and household portions are selectable; Pro has an explicit exit to manual logging. |
| Navigation | Member, owner and trainer destinations open their respective study surfaces. |
| Owner money | Dues opens a filtered register. Recording a synthetic ₹500 against ₹1,200 leaves ₹700; the chosen payment method is retained. Offline final receipt remains pending. |
| Trainer privacy | Aman’s unshared workout state is explicit; missing access is not presented as an empty workout history. |
| Trainer plans | All three templates have selectable previews. Offline assignment stays pending until the explicit **Simulate sync** action. |
| Responsive/comparison | Comparison images loaded. No outside horizontal overflow was observed at 390px or 320px in the checked states. |
| Runtime | No browser console errors were observed during these checks. |

The initial review found four issues: dues opened without filtering, navigation used proxies, template preview was generic, and offline assignment falsely implied delivery. The final reviewer inspected the current source and four fresh screenshots and marked all four findings resolved: contextual dues/expiring filters, real navigation hubs, concrete template previews, and a captured pending assignment that clears only through explicit sync simulation. Browser interactions were separately checked by the lead reviewer. The finish verdict applies to that finding list, not whole-surface usability or native validation.

A hook finding for a missing image `src` was fixed. A later padding finding identified the mobile preview stage's colored boundary: the narrow stage now has a transparent background, while the phone retains its internal content padding. The redundant phone shadow was also removed. Inter is intentionally retained from the current app tokens; one exact-value `overused-font` exception for `inter` is recorded in `.impeccable/config.json`. No entire rule or file was ignored. The subsequent detector run returned no findings. These checks cover the observed paths and states, not every possible state or the whole product surface.

## Limits and next validation

All names, amounts, food portions and progress figures are synthetic. The study uses local browser state that resets on reload. No real financial write, external message, camera/location permission request or store purchase was performed.

No native-device, API/backend, tenancy/authorization, persistence/sync integration, performance, screen-reader or user-research tests were run. Browser offline labels and the sync control demonstrate intended semantics; they do not establish production delivery or retry correctness. The Hindi switch covers selected gym/workspace copy only. Full English/Hindi coverage, Devanagari rendering and long-text layouts remain unverified.

Before implementation, resolve the brief’s open PRD questions on age gating, visit eligibility, shared-phone identity, store pricing/trial eligibility, assignment replacement/start dates and past-session editing. Validate equally weighted member, owner and trainer tasks with pilot users in English and Hindi on the reference low-cost Android device. Task times, mis-taps, comprehension, accessibility and production reliability remain to be measured.
