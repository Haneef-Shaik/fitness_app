# NFR evidence — the release gate

Every non-functional requirement in [PRD §9](01-PRD.md#9-non-functional-requirements-brd-19)
with a **number, a recording, or a named test**. G10's standing rule is
evidence, not assertion: "it feels fast" and "we have alerting" are opinions,
and this table is the place they are not allowed.

> The G10 contract refers to "PRD §11". §11 is the release plan; the
> non-functional requirements are **§9**. This table follows §9.

| Area | Requirement | Evidence | Verdict |
|------|-------------|----------|---------|
| **Performance** | < 300 ms API latency for common reads/writes | RED histograms per route template, exported at `/metrics` (02 §9). The **alert** is p95 > 300 ms on the common set, and `set_commit_failures` is the tightest rule in the table. Set commits never await the network at all (**I10**) — `commitPath.test.ts` asserts the commit is synchronous | evidence recorded |
| **Performance** | tap → set rendered p95 < 100 ms ([D16](08-PROJECT-CHARTER.md#6-decision-log)) | [release-build.md](measurements/release-build.md): an installed **release APK**, the same 100-commit flow as G4 — **p95 67.4 ms**, p50 54.7 ms, worst 79.3 ms (n=99). The dev-build reading ([commit-p95-g10.md](measurements/commit-p95-g10.md), 296.5 ms) carried Expo Go and `__DEV__` overhead, and predates memoised set rows and the no-op sync-state skip | **MET on a release build** (24 Sep) |
| **Performance** | cold start → dashboard interactive < 2.5 s | [release-build.md](measurements/release-build.md): an installed **release APK**, **median 1.02 s** (0.95–1.48 s, n=5) from process start to the dashboard holding its data, read from logcat's own timestamps. A first run the same day read median 1.23 s (1.07–2.52 s; its first launch followed a fresh install). The Expo Go dev figure ([cold-start.md](measurements/cold-start.md), 5.97 s) fetched and compiled a 14.5 MB bundle every launch | **MET on a release build** (24 Sep) |
| **Performance** | JS bundle size, tracked | [bundle-size.md](measurements/bundle-size.md) — 4.33 MiB Hermes bytecode, first reading = baseline | **recorded** |
| **Availability** | Core workout logging usable when AI is down | `scripts/verify-containment.sh`: two real processes, the AI endpoint on a closed port. Analysis failed `ai_unavailable`; a whole workout, history, analytics and a manual meal all worked. Plus `test_i14_the_whole_logger_still_works_with_the_gateway_dead` | **verified, by killing it** |
| **Offline** | Local logging + sync | SQLite draft + outbox (D14), proven on hardware in G4 and again in G10's offline flow (server killed, force-quit, relaunch, drain, **no duplicate `client_id`**). G10 on the phone, API stopped: the **offline banner** now appears (it could not before — finding 11); a queued weigh-in saves in **3.4 s instead of >30 s** (finding 12); writes stay **pending however long the outage** instead of failing after eight attempts (finding 13); three weigh-ins queued offline all reached the server once it returned, none duplicated. **L-02** exercised on the phone: retry one, discard with inline confirm, retry all, empty state | **verified on a device** |
| **Scalability** | AI processing independently scalable and async | The worker is a **separate process** over a Postgres `SKIP LOCKED` queue (D25). `POST /food-analysis/*` returns **202** and an id; nothing holds a request open. Several workers are safe — a locked row is skipped, not waited on | design + `test_ai_nutrition.py` |
| **Observability** | Monitor API latency, failed writes, AI latency, model and resolution failures | `/metrics` exports RED by route template, set commits, AI outcomes and durations, and food-resolution outcomes. Every row of the [02 §9](02-SYSTEM-ARCHITECTURE.md) alert table is a **rule that is evaluated**, not a document — `GET /v1/admin/alerts`. **One was deliberately fired**: see below | **verified, by firing one** |
| **Data quality** | Confidence + correction paths | Confidence is on the H-08 card with the required sentence ("how sure we are we spotted the food — not how accurate the calories are"). **Q7 → no**: nothing is ever auto-confirmed, at any threshold, asserted twice. **AC-10** asserts byte-identity of the raw analysis after a correction | AC-10 + `test_ai_nutrition.py` |
| **Extensibility** | New exercise types, nutrition fields, measurements, analytics | `meal_type` is a slug with a user-owned category table (D21); `body_metrics.metric_key` is open; B-02's dashboard is a section registry; the food resolver and the AI gateway are both Protocols with a swappable implementation | D21, D23, D26, D29 |
| **Accessibility** | WCAG 2.2 AA `[ASSUMPTION]` | [a11y-audit.md](a11y-audit.md): keyboard-only diary and logging on the phone; both themes; every text tone pinned at 4.5:1 by a test; and the **TalkBack session** — a workout logged start to summary and the diary read with TalkBack speaking, twice (before and after its fixes), recorded utterance by utterance in [talkback-session.md](measurements/talkback-session.md). **37 findings: 34 fixed (#15 with its Shift+Tab half dated 2026-12-15), 1 closed as not reproduced, 1 dated (2026-12-15), 1 accepted** | **verified on a device, with a screen reader** |
| **Security** | Encryption, private storage, per-user authz, deletion | Sign-in is Supabase Auth's (D30): its session in the keychain (D10), access tokens verified against the project's JWKS and refused the moment their sign-in ends, a re-sign-in within 10 minutes to delete an account (`test_supabase_auth.py`, docs/14); uploads are HMAC-signed over key+type+size+owner and **EXIF-stripped server-side** (G8); every route authorises by owner, with "another user cannot…" tests across every domain; **account deletion removes every row and every file**, asserted table by table from the schema's own list | `test_account.py` + `test_uploads.py` |

## Performance on the mid-tier Android, next to G4

Samsung SM-E546B (Galaxy M54 5G, Exynos 1380), Android 16. Expo Go, `__DEV__`,
the same 100-commit flow both times.

| | G4 | G10 | Change |
|---|---|---|---|
| tap → set p50 | 244 ms | **184.8 ms** | −24% |
| tap → set p95 | 396.4 ms | **296.5 ms** | −25% |
| worst | 407.6 ms | 310.4 ms | −24% |
| budget (D16) | 100 ms | 100 ms | still ~3× over in dev |
| **release APK** p95 | — | **67.4 ms** (p50 54.7) | **within budget** |
| cold start → B-01 | not measured | **5.97 s** median (dev) · **1.02 s** (release) | first reading |
| JS bundle | not measured | **4.33 MiB** Hermes bytecode | first reading = baseline |

The dev rows are Expo Go with `__DEV__` on; they are kept to compare with G4
on equal terms. **The release figures are the ones the budgets are judged on**:
a release APK was built on this machine after all (`assembleRelease`, see
[release-build.md](measurements/release-build.md)), and on it both budgets are
met — p95 67.4 ms against 100 ms, cold start 1.02 s against 2.5 s.

## The alert, deliberately fired — `scripts/trigger-alert.sh`, 25 Sep

Re-run for the release gate against a fresh API process on the dev database:

```
One bad commit, with almost no traffic behind it
  ✓ set_commit_failures silent: 1 failure out of 1 is 100% and means nothing
Now 250 real commits, so the rate means something
  ✓ 250 committed
What is firing
  set commits: 251 total, 1 failed
  FIRING  set_commit_failures: 0.40% (threshold 0.10%)
  FIRING  abandoned_sessions: 4 (threshold 1)
```

`set_commit_failures` — the tightest rule in the [02 §9](02-SYSTEM-ARCHITECTURE.md) table — fired
only once there was enough traffic for its rate to mean something (the 200-commit minimum
sample), and stayed silent on a sample of one. `abandoned_sessions` fired too, and correctly: the
dev database held four sessions open for over a day, left by earlier runs of this very script,
which never closed the session it opened. The script now cancels it, and its sample-of-one check
asks about the rule under test rather than about every rule (it had failed on exactly this).

