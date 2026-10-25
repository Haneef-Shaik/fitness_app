# Connected member and gym implementation — 19 October 2026

Status: local implementation in progress. PRD v2.1 and Momentum remain authoritative; this record
does not close goal cards or release gates. No production provisioning or deployment has occurred.

## Boundaries and decisions

`apps/mobile` consumes shared, versioned Zod contracts and calculations from `packages/domain`.
Screens use shared theme roles and UI components. Google Sans Flex, Roboto Condensed and Noto Sans
Devanagari are bundled with OFL notices. The app stores theme choice separately from account data.

Supabase is the current local implementation, under isolated project `fitlog_rebuild_20261017` on
ports 55321/55322. Historical containers and volumes are preserved. Production region, providers,
accounts and commercial decisions remain open. Client configuration contains no privileged keys.

Postgres owns authorization and transactional invariants. All exposed tables enable RLS and explicit
grants. Privileged implementations live in a non-exposed `private` schema, fix `search_path`, and
check verified identity, active account and current auth session. Public wrappers are invokers.
Gym roles are read from the database on each request; role revocation does not await JWT expiry.
Gym staff receive operational records only, with no new policy on personal health tables.

## Member paths

Email sign-in, signup/verification initiation and reset-link initiation connect to Auth. Adult
onboarding is checked on the server. Production notices and Google/Apple/phone setup are not complete.
Member screens use downloaded real account data and honest empty states, not manufactured progress.

Programme edits snapshot exercise versions. Scheduling is online configuration: future pending
occurrences can be replaced while completed/reserved history is preserved. Refresh maintains a rolling
one-year horizon. A scheduled start explicitly names an eligible occurrence; unscheduled starts do
not silently complete missed dates. Exercise snapshot bases and JSON shapes are checked in Postgres,
using shared generated JSON Schema plus SQL cross-field/ownership constraints. See
[Supabase JSON Schema validation](https://supabase.com/docs/guides/database/extensions/pg_jsonschema).

The local workout store serializes mutations. Data and outbox are committed together before UI
acknowledgment. Native storage requires SQLCipher with a key in SecureStore; web uses an account-scoped
IndexedDB cache encrypted with a nonextractable AES-GCM key. An outbox command has stable identity,
dependencies and base revisions. Server replays return the original outcome; changed replay input
and stale revisions fail for review. The logger recovers performed sets and rest deadlines after reload.
Completed-set corrections and workout delete/undo preserve private revision snapshots.

Manual meals/body/goals/targets require online confirmation; unsaved forms stay separate from totals.
Backdated diary/body entries resolve their chosen local date in the saved timezone. Full food versions,
recipes, copy, AI and comprehensive online record correction remain unfinished.

## Gym paths

Local setup creates an owner workspace. Member search uses server pagination (50 rows), deterministic
ordering and explicit archived lists. Owner/manager plan versions and sold membership snapshots preserve
duration/price/freeze allowance. Sold dates use start-inclusive/end-exclusive calendar rules. Overlaps
are rejected transactionally. Issuing a term and reviewing freeze requests are connected.

Freeze requests remain pending without changing dates or attendance eligibility. Owners/managers
review the sold allowance and every affected renewal before approval. One transaction extends the
current term, shifts overlapping future terms, and records approver plus old/new dates in the audit.
A preview binds the request, member revision and sold terms; competing approvals receive a conflict
and must refresh. Stable operation IDs make a lost acknowledgment safe to retry. Approval cannot move
an already-started renewal or exceed the sold allowance, including an explicit zero allowance.
Early returns restore unused days and show either the proposed earlier renewal dates or an explicit
inactive gap when agreed renewal dates are retained. Calendar dates, not elapsed hours, count days.
Rejected/withdrawn requests change no validity. These commands need a connection; unsaved inputs
remain device drafts. Financial records and issued receipt snapshots do not change.

Money is integer paise. Charges, charge adjustments, received principal, principal corrections,
allocations and receipt snapshots are separate records. Settled financial tables have no client write
grants; checked commands append events. Payment confirmation allocates only the new payment to oldest
open charges. Existing credit needs an explicit application command. Refund/reversal principal ranges
cannot overlap. Waivers release excess allocations into credit without reducing collections.

Payment/visit submissions first enter the account's encrypted durable outbox. A pending payment is
provisional and has no final receipt number. Server commit assigns a transactionally incremented
gym/year sequence; retries return the same receipt. The frontend renders the saved issue snapshot and
provides print/PDF/share actions. Those native OS actions still require device QA. Refund/reversal/
waiver commands have integration coverage, but their review screens are not yet implemented.

Gym account and dashboard RPCs use one consistent database statement for their read model, avoiding
REST row-limit truncation of balances. Member cards, plan/membership/payment review, receipts, visit
listing and Personal/Gym switching are connected. Staff setup/invites, imports, signed QR, broader membership request queues,
retention, programme offers, challenges, full reports/export and closure remain unfinished.

## Verification checkpoint

- Strict TypeScript, zero-warning lint and semantic design guard pass.
- 10 shared-domain tests, 27 mobile tests and 10 planner tests pass; 94-card graph validation passes.
- Local member, gym and freeze integration suites pass with disposable accounts/records and cleanup.
- Freeze checks cover the PRD October/November fixture, leap/DST dates, sold allowances, cascaded
  renewal shifts, early-return gaps, stale/cross-request previews, concurrent approvals, current-role
  permissions, attendance eligibility and unchanged balances.
- Gym cases cover tenant isolation, current roles/revocation, retired/minor restrictions, month-end
  dates, overlap rejection, immutable payments, receipt replay, refund/reversal portions, waivers,
  credits, personal-data isolation and 50 concurrent successful payments with unique gap-free receipt
  numbering. This is local evidence; target-environment load and operational testing remain required.
- Browser test: synthetic gym → member → plan → sold membership → reviewed payment → receipt; the
  initial ₹1,200/₹1,000 fixture shows dues ₹0, credit ₹200 and receipt `LOCAL1910/2026/000001`.
  A later sold renewal increases charges to ₹2,000. Approving the 18–21 November freeze moves current
  validity through 22 November and the renewal to 23 November–22 December, leaving dues ₹1,000 and
  credit ₹200 unchanged. Mobile-width review/outcome screenshots are in `.impeccable/review/`.
- Web and iOS/Android JS/Hermes exports pass. These do not establish native compilation or execution.
- All 14 recorded migrations replay in a shadow database; schema comparison reports no changes.
- Database security advisor reports no issues. Device accessibility/performance/encryption tests,
  hosted CI, production operations and PRD §27 release evidence remain open.

Full delivery is not complete. The working checklist remains in `docs/implementation/PROGRESS.md`;
all unmet required acceptance cases remain gates, including gaps implementable without vendor accounts.
