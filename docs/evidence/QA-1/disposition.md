# QA-1 review disposition — 25 October 2026

Original review reports remain unchanged as historical findings. This table records subsequent
corrections, rather than treating their pre-fix blocker summaries as current state.

| Finding | Disposition | Evidence |
|---|---|---|
| Security F-1, High: deep-link session injection | Fixed in `a8d8f31` | PKCE-only exact callback handler; 99 additional mobile regression cases; fragment-guard mutation fails four behavioral cases; independent auth-callback-verification.md closes the High |
| Code G-1, High gate blocker: fresh database lacks catalogue fixture | Fixed in `a8d8f31` | Configured seed list includes development-catalogue.sql; pristine replay and all four backend suites passed without manual seed script |
| Code G-2: necessary source files untracked | Foundation committed in `4a7a6ea` and `a8d8f31` | Fresh clone of actual local main passed frozen install, check, backend suites and both JS exports |
| Auth R-1: local redirect list missing actual native callback | Fixed in `a8d8f31` | Local config has six exact callback URLs; restarted auth container matched every configured URL; sender and receiver share AUTH_CALLBACK_PATH |
| Security F-8i, Low: macOS-only preview credential output path | Fixed in `67e6d1c` | preview-account.mjs uses node:os tmpdir() and node:path join; basename and mode 0600 retained; syntax check passes. No account was created just to exercise this helper. |

Remaining lower findings, including Windows subprocess support if required and hosted strict-peer /
Expo compatibility checks, are assigned by goal in the QA-1 handoff. None is a release acceptance
claim. Native OAuth/recovery end-to-end tests and real-device validation remain with MB-1/SC-5 and
the platform/release goals.
