# F4/G5 command-failure prerequisite accepted — 2026-11-01T12:50:36.364685+00:00

Codex acting under explicit owner delegation AUTH-01 accepts this bounded prerequisite only. Local Claude wrote it; fresh independent local Claude goal-verifier 0d28a5a0-c24c-4345-9ac1-59f8df6e404a reviewed it and ran both authorized synthetic test commands once each. No critical/high findings. Audit: Read12/Grep13/Bash2, no tool errors or denials, no additional execution. Complete final, audit and exact TAP captures are adjacent harness-command-failure-* records.

- `rtk proxy node --test scripts/backend/status-command.test.mjs`: 7 tests, 7 pass, 0 fail.
- `rtk proxy node --test scripts/backend/status-output.test.mjs`: 7 tests, 7 pass, 0 fail.

Codex independently compared every existing file against the phase-before snapshot. Three suite diffs contain only import/status-call substitutions, preserving exact-loopback assertions, business logic and cleanup byte for byte. Parser test changes are confined to constants/wiring; the other six tests are unchanged. Wrapper catches invocation failure without binding/reading it, emits a fresh fixed Error outside that catch, then parses successful output using the accepted helper. Tests inject fakes and never import live suites. Reviewer final's phrase “neither test imports the wrapper” is overbroad: command tests dynamically import the inert wrapper after a text preflight; parser tests read it as text. This does not affect the observed safety/results. Codex also read QA9 phase-3n-readiness.md directly in the QA9 worktree, covering context unavailable to verifier.

## Named residuals and limits

- MB-1 owns follow-up credential-safety for `environment.mjs` and `preview-account.mjs`, confirmed by Codex source read: both inline unguarded status parse+command failure paths. QA-9 tracks these under G5. They were not executed; preview-account has real local side effects and must not be imported by pure tests.
- MB-1/QA-9 also owns triage of already reported `verify-freeze-projection.mjs` raw child/parse diagnostics. No claim that every G5 path is now closed.
- G1–G4/G6/G7, F1–F3/F5–F6, allowlisted executor, exact shared-target binding, backend isolation suites and whole MB-1 remain open. Historical denied sequences stay parked, never retried through alternate actors/tools/forms.
- Reviewer lows: overlapping wiring tests, source-text import check limits, JavaScript-level hostile-value coverage, deliberately reduced command diagnostics. Recorded; no optional polish loop required.
- RED/mutations, live suite execution/syntax, repository check, exports, device/release/hosted evidence were not run this phase. No Done-when box or acceptance-ledger result changed, no integration or commit.

## Reviewed source SHA256

- `scripts/backend/status-command.mjs`: `600af08fe7f86c110b0b01163cf53ee5a1b2574d09b9761d74a1c559d06d3b01`
- `scripts/backend/status-command.test.mjs`: `e5a5d29bedd9db37a7c451a791c22460db9332626dd16dcd427a0aeea90ffd53`
- `scripts/backend/status-output.mjs`: `258631c11e353f57a4b2b87824c0c44766ca1b0c2a0165524e24901db836a36b`
- `scripts/backend/status-output.test.mjs`: `a6f2fc3ab0960a6c0ba6e1cc9842d4c43ba8ba4793c7a814a6a49dbbd1c7277d`
- `scripts/backend/verify.mjs`: `0e543579f1a386c9caf5528b08432d21ceea1de168bcee95730ea7c9f0f60a3c`
- `scripts/backend/verify-gym.mjs`: `ab2127b56e38619f4aa5c38b1f2609f57cf0973ac4749c5ad1a58aa9bac95abf`
- `scripts/backend/verify-freezes.mjs`: `bce30327927751bf99747e51a9358e281e91647917e025cbc0cdbf56fdc1dfef`
