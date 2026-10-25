# AR-1 phase2A correction checks

Coordinator run26 October2026 in the isolated goal checkout, before integration:

- Standard `pnpm check` PASS:31 domain,126 mobile,22 planner tests (179 total), two domain TS
  compiles (including client-only), mobile TS, lint/design rules and generated plan/ledger checks.
- Independent local command probes: with CI=1 the missing, blank, all-zero and unresolvable
  baseline cases exit1; a trusted committed baseline exits0.
- The literal workflow validation Bash block was executed locally: missing, zero and malformed
  values exit1; a full real commit SHA exits0.
- `git diff --check` passes. Snapshots, model/wire contracts and lockfiles are unchanged.
- Independent scoped verification is still running; its final verdict is required before acceptance.

The first harness run used a malformed test SHA for the positive workflow case and correctly failed;
the harness was corrected to use the actual full07757a5 commit SHA, and all probes above passed.
This was a harness-input correction, not a workflow-code fix.

[Probe results](ci-correction-probes.json). Logs are `/tmp/fitlog-ar1-ci-*.log` and
`/tmp/fitlog-ar1-corrections-check.log`. No hosted CI, database, provider or release-device evidence
is claimed. Prior Android/iOS JS exports passed07757a5; these later changes touch only Node-side
snapshot tooling/tests/typecheck/CI and do not alter the client runtime graph.
