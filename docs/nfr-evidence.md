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
| **Performance** | tap → set rendered p95 < 100 ms ([D16](08-PROJECT-CHARTER.md#6-decision-log)) | [commit-p95-g10.md](measurements/commit-p95-g10.md), same phone and flow as G4 | **MISSED, not regressed** — see below |
| **Performance** | cold start → dashboard interactive < 2.5 s | [cold-start.md](measurements/cold-start.md): **median 5.97 s** (5.67–6.34 s, n=5) in Expo Go `__DEV__`, fetching and compiling a 14.5 MB dev bundle every launch. Android's own first frame: ~0.6 s | **Measured as a dev upper bound; release figure unmeasured (DR4)**. Not shown to meet the budget |
| **Performance** | JS bundle size, tracked | [bundle-size.md](measurements/bundle-size.md) — 4.33 MiB Hermes bytecode, first reading = baseline | **recorded** |
| **Availability** | Core workout logging usable when AI is down | `scripts/verify-containment.sh`: two real processes, the AI endpoint on a closed port. Analysis failed `ai_unavailable`; a whole workout, history, analytics and a manual meal all worked. Plus `test_i14_the_whole_logger_still_works_with_the_gateway_dead` | **verified, by killing it** |
| **Offline** | Local logging + sync | SQLite draft + outbox (D14), proven on hardware in G4 and again in G10's offline flow (server killed, force-quit, relaunch, drain, **no duplicate `client_id`**). G10 on the phone, API stopped: the **offline banner** now appears (it could not before — finding 11); a queued weigh-in saves in **3.4 s instead of >30 s** (finding 12); writes stay **pending however long the outage** instead of failing after eight attempts (finding 13); three weigh-ins queued offline all reached the server once it returned, none duplicated. **L-02** exercised on the phone: retry one, discard with inline confirm, retry all, empty state | **verified on a device** |
| **Scalability** | AI processing independently scalable and async | The worker is a **separate process** over a Postgres `SKIP LOCKED` queue (D25). `POST /food-analysis/*` returns **202** and an id; nothing holds a request open. Several workers are safe — a locked row is skipped, not waited on | design + `test_ai_nutrition.py` |
| **Observability** | Monitor API latency, failed writes, AI latency, model and resolution failures | `/metrics` exports RED by route template, set commits, AI outcomes and durations, and food-resolution outcomes. Every row of the [02 §9](02-SYSTEM-ARCHITECTURE.md) alert table is a **rule that is evaluated**, not a document — `GET /v1/admin/alerts`. **One was deliberately fired**: see below | **verified, by firing one** |
| **Data quality** | Confidence + correction paths | Confidence is on the H-08 card with the required sentence ("how sure we are we spotted the food — not how accurate the calories are"). **Q7 → no**: nothing is ever auto-confirmed, at any threshold, asserted twice. **AC-10** asserts byte-identity of the raw analysis after a correction | AC-10 + `test_ai_nutrition.py` |
| **Extensibility** | New exercise types, nutrition fields, measurements, analytics | `meal_type` is a slug with a user-owned category table (D21); `body_metrics.metric_key` is open; B-02's dashboard is a section registry; the food resolver and the AI gateway are both Protocols with a swappable implementation | D21, D23, D26, D29 |
| **Accessibility** | WCAG 2.2 AA `[ASSUMPTION]` | [a11y-audit.md](a11y-audit.md): **keyboard-only diary pass and keyboard-only logging done on the phone** (a food added and a set of 82.5 kg × 8 saved with keys alone, both confirmed on the server); both themes; contrast of every text tone pinned at 4.5:1 by a test. **22 findings: 16 fixed, 1 fixed forward with the backward half dated, 4 dated, 1 accepted.** The **TalkBack session is not done** — it needs a person on the phone | **OPEN — screen reader** |
| **Security** | Encryption, private storage, per-user authz, deletion | Refresh tokens in the keychain (D10); uploads are HMAC-signed over key+type+size+owner and **EXIF-stripped server-side** (G8); every route authorises by owner, with "another user cannot…" tests across every domain; **account deletion removes every row and every file**, asserted table by table from the schema's own list | `test_account.py` + `test_uploads.py` |

## Performance on the mid-tier Android, next to G4

Samsung SM-E546B (Galaxy M54 5G, Exynos 1380), Android 16. Expo Go, `__DEV__`,
the same 100-commit flow both times.

| | G4 | G10 | Change |
|---|---|---|---|
| tap → set p50 | 244 ms | **184.8 ms** | −24% |
| tap → set p95 | 396.4 ms | **296.5 ms** | −25% |
| worst | 407.6 ms | 310.4 ms | −24% |
| budget (D16) | 100 ms | 100 ms | still ~3× over |
| cold start → B-01 | not measured | **5.97 s** median (dev) | first reading |
| JS bundle | not measured | **4.33 MiB** Hermes bytecode | first reading = baseline |

**Not a regression**, so not a release blocker under the contract's rule — but
still a missed budget. Both readings are dev builds; DR4 rules out a release
build on this machine, so the production figure is unmeasured.
