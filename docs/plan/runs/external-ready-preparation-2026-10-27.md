# External ready goals — preparation and actual execution gates

Prepared 27 October 2026 under AUTH-01. This separates planner dependency readiness from
account access and real-world evidence. No account was opened, message sent, fee paid,
registration submitted, tester enrolled or interview conducted in this pass.

The seven ready technical/design goals have isolated implementation workers. These five goals
remain dependency-ready; their actual external steps require the concrete inputs below. Existing
owner delegation covers routine technical choices and does not supply identity, account or field proof.

| Goal | Prepared execution sequence | Required real input or evidence | Safe parallel preparation |
| --- | --- | --- | --- |
| OW-3 Platform accounts | Inventory existing owner-controlled accounts; record owner/region; provision separate staging and production only with access and specific external-action authorization; configure spend alerts; store secrets privately | Owner-controlled platform/domain/email/monitoring/AI/OAuth/EAS access, approved billing limits, actual region and alert evidence | Use the frozen architecture to fill a non-secret inventory: service, owner, environment, region, spend cap, alert recipient, proof link and recovery owner. Never paste key values into the repository |
| OW-4 Store accounts and signing | Confirm both store memberships; prepare Android upload signing and two private backups; configure fingerprints/OAuth and Apple sign-in; verify evidence | Active Play/Apple accounts, identity/enrolment details and fees where required, signing custody and two backup confirmations | Inventory required identifiers and private storage locations; prepare signing/restore verification commands for review. No generated key or credential enters Git |
| OW-5 SMS and WhatsApp registrations | Reconcile selected providers against ADR003; prepare entity/sender/OTP template and business-verification submissions; set real-send budget; submit only with authorized access | Actual entity records, provider/Meta ownership, number custody, required verification and dated real delivery/approval proof | Assemble submission field list and template text from PRD5.1/14.2; validate purposes and variables locally. A draft template is not DLT approval or an OTP-delivery result |
| OW-8 Beta recruitment | Freeze beta eligibility, dates and feedback route; recruit adults privately after explicit messaging authorization; obtain 12–20 commitments | Real adult participants in India, private roster, actual dates and an accessible feedback channel | Prepare an unsent invitation, consent/privacy explanation, roster fields and feedback form. No private tester identity belongs in public repository evidence |
| OW-9 Gym field validation | Prepare research guide and metric protocol; obtain qualified notices; conduct owner/member interviews; sign five gyms; capture baseline cohorts and terms; sign metric protocol before day1 | Actual interviews, signed agreements, reviewed private registers/notices and the exact PRD23.3 cohorts, denominators, windows and exclusions | Prepare interview guide and private-record index schema. Preserve the card counts:20–30 owners,30–50 adult members, at least50 eligible adults per gym and20 fully observed baseline renewal terms. Never fill unknown outcomes with invented measurements |

## Evidence templates

For account evidence, record only: goal, service, owner role, environment, region, billing-cap status,
alert status, observation date, private evidence reference, and remaining action. A blank field is
unknown; it is not a completed requirement. Do not expose account recovery material or secrets.

For the private beta roster, prepare: pseudonymous tester ID, adult eligibility confirmed,
India eligibility confirmed, platform, actual participation window, invitation/consent status,
feedback route, and private contact reference. Keep contacts outside this public repository.

For field evidence, prepare: pseudonymous gym/interview ID, actual consent/protocol version,
observation window, cohort inclusion/exclusion counts, denominator source, register completeness,
unknown outcomes and private evidence reference. The goal card and PRD own metric definitions.

## Unsent beta invitation draft

We are preparing an India beta of FitLog for adults. Participation would run for14 days on
Android or iOS, with a feedback channel for issues and suggestions. Dates and availability will
be confirmed before enrolment. Reply only if you would like the participation and privacy details.

This is a draft only. No invitation has been sent and no commitment is recorded.

## Field interview guide draft

1. Describe the current register, renewal, receipt, attendance and follow-up workflow.
2. Walk through a recent real case, using consented/redacted material in private research storage.
3. Identify missing or uncertain outcomes; record uncertainty without substituting estimates.
4. Confirm cohort eligibility and whether the required baseline period is fully observable.
5. Record stated price reactions separately from any purchase or commercial commitment.
6. Before pilot activation, obtain the real protocol and qualified notice review required by OW-9.

No external execution or acceptance result is claimed by this preparation document.
