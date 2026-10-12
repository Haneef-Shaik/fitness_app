# Project tracker — FitLog rebuild

| Field | Value |
| --- | --- |
| Updated | 11 October 2026 |
| Current baseline | No application implementation exists on this branch. |
| Requirements | [PRD](PRD.md) |
| Delivery sequence | [Master plan](23-MASTER-PLAN.md) |
| Goal status | [plan/status.json](plan/status.json) |

## Evidence rules

This tracker records evidence produced by the new implementation only: accepted decisions, tests,
measurements, security reviews, releases, pilot evidence and goal handoffs. A goal is not done until
its evidence is recorded here and its live status is marked done in `plan/status.json`.

Do not import or cite the deleted v1 implementation as proof. Its committed Git history remains
recoverable, but it is not evidence for this rebuild.

## Current state

| Area | State | Next evidence |
| --- | --- | --- |
| Product requirements | Complete, consolidated in `docs/PRD.md` | External gate evidence; product rules selected in v2.1 |
| Design | Relevant Momentum PRD v2.1 journeys updated in Figma and reviewed | Full Hindi/platform variants, real assets and implementation QA |
| Planning | 94 goal cards retained | Selected v2.1 scope plus reset-aware foundation reconciliation |
| Application | Not started | New foundation architecture and first passing test |
| Platform | Not started | New environment and deployment decision record |
| Gym pilot | Not started | Fresh field-validation notes and counsel guidance |

## Decision log

Record a decision in this format:

| Date | ID | Decision | Why | Linked requirement / goal |
| --- | --- | --- | --- | --- |
| 2026-10-11 | RST-1 | Rebuild from a documentation-only baseline | The old implementation and its documentation no longer matched the expanded product scope or Figma screens. | Reset baseline; QA-1, QA-2 |
| 2026-10-11 | PROD-01 | Remove dedicated trainer role and all gym private-health reads/writes; retain owner/manager gym programme offers as member-owned copies | Simplifies roles while protecting personal fitness data; no permission transfer to staff | GT01–GT04 retired; PRD12/16/19; G16/G21/G24/G29 |
| 2026-10-11 | PROD-02 | India first public launch, member-before-gym release split, four auth methods, full English/Hindi,≥200 exercises/≥500 Indian foods/three starters; international structure retained | Focused launch without a later data-model rewrite; US/Europe needs separate external gates | PRD2/3/5/6/9/27; OW-1/OW-2 |
| 2026-10-11 | PROD-03 | Reversal corrects erroneous payment; refund returns actual money; principal portions disjoint, cash/charges/credit/allocations separate | Avoids reopened dues or double cash impact from ambiguous corrections | PRD13.3–13.4; AC35; G17 |
| 2026-10-11 | PROD-04 | Month anniversary when date exists; missing day includes whole shorter-month final day; Jan31→Feb28 inclusive/non-leap, renewalMar1 | Predictable member-facing expiry; explicitly replaces v2.0 last-dayFeb27 rule | PRD13.1/14; AC22/36; G17/G20 |
| 2026-10-11 | PROD-05 | Sold freeze allowance wins;30-day creation default; cross-expiry permitted; overlap shift atomic or freeze rejected; early-return gap explicit | Prevents overlapping sold entitlements and silent free extensions | PRD13.2; AC36; G17 |
| 2026-10-11 | PROD-06 | Offline operational roster minimal,24h staff mutation freshness/72h purge; current role and historical eligibility rechecked; authorized reconciliation | Supports real front-desk receipts/visits without stale authority or private-health caching | PRD20.1.1; AC37; G16/G17/G19 |
| 2026-10-11 | PROD-07 | Explicit occurrence selection;≤7-day late completion, one session/occurrence, historic date preserved; deletion resets Pending/Missed | Avoids silently crediting wrong weekday or double adherence | PRD6.3/8; AC38 |
| 2026-10-11 | PROD-08 | Ordinary private streak uses eligible visits independently of challenge enrollment; later status changes preserve history; opt-out/rejoin rule explicit | Challenges remain optional and historical standings remain reproducible | PRD15/17; AC39; G19/G22 |
| 2026-10-11 | PROD-09 | AI allowance reserve/consume/release tied to original UTC bucket; dispatch ordering handles consent/expiry/cancel; ready confirmation retained | No surprise dispatch/billing or quota leaks from cancellation races | PRD10.3; AC40 |
| 2026-10-11 | PROD-10 | Pilot every gym≥40% link/≥25% weekly logging with minimum cohorts,≥5-point renewal gain in≥3 gyms and20 expiry samples/gym/window; Unknown evidence excluded | Prevents large-gym averages and weak evidence masking failure; no invented outcomes | PRD15/23; AC41; OW-12 |
| 2026-10-11 | PROD-11 | Strength goal metric/load basis/version/window explicit; no pre-baseline progress; front desk prepares membership requests but cannot approve | Avoids misleading goals and ambiguous financial authority | PRD11.2/12.1; AC42/43 |
| 2026-10-11 | PROD-12 | Workouts offline; meal/body drafts preserved but Save online. Personal image1GiB/2,000 cap with export/delete/manual logging available; no downgrade eviction | Keeps MVP sync bounded and storage costs predictable without paid manual-data limits | PRD18.1/20/27; AC44 |

The product owner selected trainer removal and explicitly delegated remaining product decisions.
PROD records do not assert counsel/vendor/licensing approval or completed implementation. Actual
external gates remain in PRD27. Reset evidence/statuses preserved; the product-decision pass changed no app code. The subsequent Figma pass is recorded below.

## Handoff log

Record each completed goal in this format:

| Date | Goal | Outcome | Evidence | Follow-on work |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

## Design evidence — 11 October 2026

Actual Momentum Figma screens were updated to PRD v2.1, including owner/manager programme templates
and member acceptance, membership/freeze dates, finance adjustments, operational permissions, offline
handoff, planned occurrences, strength baselines, privacy/storage and food AI lifecycle. The trainer
page is retired with no prototype entry points. Food AI is MVP; added voice/review/question/owner
assistant concepts are visibly Phase 2, with MVP links into deferred features removed.

The [live screen inventory](22-UI-MOMENTUM.md#live-v21-screen-evidence) contains verified node links.
The final structural audit passed for 97 reviewed frames (editable text/components, no missing fonts
or whole-screen raster fills), and representative dark/light screens passed visual review after repairs.
Full Hindi screens, full iOS coverage and photographs remain incomplete; prototypes simulate selected
journeys rather than production behavior. No application implementation or goal completion is claimed.
