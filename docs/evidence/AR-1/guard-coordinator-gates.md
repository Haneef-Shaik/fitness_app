# AR-1 guard and runner verification — 26 October 2026

The three former native workers finished and were stopped before verification. The guarded backend
implementation needed only authorized obsolete-source deletion and root backend:test wiring; both
are complete on the isolated goal branch. Coordinator independently passed39/39 new guard tests.
`check-sql-sources.mjs` passes15migrations,14unchanged against main merge-base9f148c13e093,1new,
2configuredseeds, no straySQL. Claude also records39/39 tests and185 pnpmcheck tests after wiring.

Coordinator confirmed obsolete contracts.sql is a byte-identical prefix of validated_contracts.sql
(17640bytes). The other object/statement comparisons are phase2C.md's table. Removed only the four
specified unexecuted SQL drafts and their unused generator; original migrations are untouched.
LaneS2 notice is recorded as handoff text to future lane executors; no person or unrelated chat was
messaged. The coordinator accepted that lane notice as part of serialized ownership.

Real replay privilege check closes both uncertainties without source/DB alteration:
private.freeze_projection authenticated=false,anon=false; private.freeze_action authenticated=true,
anon=false. This matches the actual intended grants. No privilege migration is needed.

Initial guarded runner checks refused the DB-only replay project because no API_URL was reported.
`supabase start` while that DB already ran returned without starting API services. Coordinator then
stopped ONLY projectfitlog_ar1_replay_20261026 with normal volume preservation, restarted the same
owned project with gateway and REST and excluded auth/storage/worker/messaging services. No existing
project was stopped or changed. API56321/DB56322 are now available. Credentials/status outputs stayed
captured in local temporary logs and were never copied into evidence; recorded runner output holds
no keys. Real status, Docker exec and psql all execute; no fake-status injection was used.

Both actual guarded runners PASS on this owned stack:
[real-runners.log](real-runners.log). Exported main functions receive only
`{projectDir:'/tmp/fitlog-ar1-replay-20261026', expectedApiUrl:'http://127.0.0.1:56321'}`;
all commands and target checks otherwise run normally. Contracts match all8schemas with manifest
SHA25674914ca920f1f9c97957e74ea8b1bf5eea62dfbd26f7c5c80ba9cf91cdcc88e4.
Fixture matches exactbytesSHA256bc0672b5d26aa93b1e9be41219a0b20db1997913a37d6a9a0b2aac01ed1e1877,
16sets+2sessions pass;1pendingMB4session explicitly unasserted.

Actual runner mutation checks: [real-runner-probes.json](real-runner-probes.json).
All7 outcomes match expectations. A copied snapshot's changed persisted bound fails on BOTH manifest
hash and specific database schema pointer (M1.5). Copied fixture expected e1RM change(M4.3),
bodyweight-no-load null→zero(M4.4), missingAC03set and missingAC03session each fail. Final normal
contracts and fixture runs pass. Source snapshot/fixture never modified, originalbytehashes checked.
This also verifies hardened SQL R5 and actual psql notices with stdin line prefixes.

Earlier TypeScript and SQL formula mutations, replay/strictdiff/lint and original4 backend suites
are recorded in replay-verification.md. The new backend:test combines old4suites+39unittests+3guards.
Its full single-command invocation has not run against55321: that stack intentionally has not
received this branch's new formula migration. Existing4suite evidence is on55321; new SQL tools
run on the fully migrated owned56321/56322stack. This split is explicit; no bundled result invented.

Independent proposal review4 and guard review are running; AR-1 remains unmerged and requires final
all-box verification and ownerG1approval. No acceptance result changed.
