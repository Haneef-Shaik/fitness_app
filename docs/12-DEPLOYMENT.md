# Deployment Runbook — Supabase + a container host

**For:** the owner, doing it by hand the first time. **Decisions it implements:**
[L1 and L2](11-LAUNCH-PLAN.md#phase-0--decisions-the-owner-must-make-first) — Supabase (Pro) as
managed Postgres 16 and Storage for photos; the API and the AI worker as two processes from one
Docker image on a container host (Railway, Fly or Render — this runbook stays host-agnostic).
**FitLog keeps its own auth and API:** no Supabase Auth, no RLS, no Supabase client SDK anywhere.

Read §14 before trusting any of it: it says what was proven on a laptop and what cannot be until
the accounts exist. §15 is the checklist, in order. Dashboard paths (*Menu → Page → Setting*) are as
of September 2026; if a label has moved, search the dashboard for the setting's name.

---

## 1. What runs where

```
 phone ──HTTPS──▶ host's TLS proxy (api.<domain>)
                      │
                      ▼
          ┌────────────────────────┐      ┌─────────────────────────┐
          │ fitlog-api             │      │ fitlog-worker           │
          │ image, default command │      │ same image              │
          │ uvicorn on $PORT       │      │ python -m app.worker    │
          │ /health · /v1/…        │      │ no HTTP, heartbeat file │
          └──────┬─────────┬───────┘      └──────┬────────┬─────────┘
                 │         │ S3 (SigV4)          │        │
                 │         ▼                     │        ▼
                 │   Supabase Storage ◀──────────┼── private bucket, presigned GETs only
                 ▼                               ▼
          Supavisor session pooler :5432 (IPv4, TLS) ──▶ Postgres 16 (Supabase)

 GitHub: CI ──green on main──▶ Deploy: build image → GHCR
                                 → staging: migrate · tag · hook · wait for /health
                                 → [required reviewer] → production: the same, same image
```

Two processes, one image, because the worker must never be able to disagree with the API about the
schema or the job contract, and must be separate because a model call must never occupy a
request worker (**D25**, **I14**). The queue is Postgres (`FOR UPDATE SKIP LOCKED`), so there is
nothing else to host — no Redis, no broker.

---

## 2. Supabase — one project per environment

Do this twice: `fitlog-staging`, then `fitlog-production`. They share nothing: not a database, not a
bucket, not a key.

1. **Organisation and plan.** Create the organisation on the **Pro** plan. The free plan pauses a
   project after a week without traffic and keeps no usable backups — a staging project that
   pauses is a deploy that fails for no reason. Check the current price on supabase.com/pricing.
2. **Project.** New project, in the region nearest your users, and **put the host in the same
   region** (§7) — every query crosses that gap. Generate the database password with
   `openssl rand -base64 32`, store it in your password manager, never anywhere else.
3. **Turn off the Data API** — *Integrations → Data API → Enable Data API: off*. FitLog never uses
   it. With it on, Supabase serves the `public` schema over HTTP and grants its `anon` and
   `authenticated` roles privileges on every table created there — `users.password_hash`
   included — to anyone holding the project's anon key, which Supabase treats as public. The
   release step also revokes those grants on every deploy (`app/db_hardening.py`), so a toggle
   switched back on later does not reopen the door; this switch is the first half.
4. **Enforce TLS** — *Database → Settings → SSL Configuration → Enforce SSL on incoming
   connections: on*. FitLog also refuses a non-TLS URL itself (§3).
5. **Connection string** — *Connect* (top bar) → **Session pooler**. It looks like:

   ```
   postgresql://postgres.<project-ref>:<password>@<pooler-host>:5432/postgres
   ```

   Turn it into FitLog's form (§3): `postgresql+asyncpg://…:5432/postgres?ssl=require`.
6. **Bucket** — *Storage → New bucket*: name `fitlog-photos`, **Public bucket: off**. Set the file
   size limit to 8 MB (it matches `UPLOAD_MAX_BYTES`) and the allowed MIME types to
   `image/jpeg, image/png`. Add **no policies** — the API reaches the bucket with the S3 keys, and
   nothing else should reach it at all.
7. **S3 access keys** — *Project Settings → Storage → S3 Connection*: enable the connection, copy
   the **Endpoint** and **Region**, then **New access key** → copy the Access Key ID and the Secret
   (shown once). These keys can do everything to every bucket and bypass all policies: they go into
   the host's secret store (§7) and nowhere else.
8. **Backups** — *Database → Backups*. Pro keeps the last 7 days of daily backups. For production,
   decide on **point-in-time recovery**: an add-on that also needs at least the Small compute size;
   it turns a lost day into a lost couple of minutes. Staging does not need it. §11 is the restore
   drill — do it once before launch.

**Not in the database backups: the photos.** Supabase says so plainly — a database backup holds the
rows that *name* the objects, not the objects. Storage has no versioning either, so a deleted photo
is gone. For v1 that is accepted; if it is not, schedule a nightly copy of the bucket to a second
provider (`rclone sync` against both S3 endpoints) and add it to §11.

---

## 3. The database connection

### 3.1 Which URL

| Supabase gives you | Port | FitLog `DATABASE_URL` | `DB_POOL_MODE` |
|---|---|---|---|
| **Session pooler** (IPv4) — **use this** | 5432 | `postgresql+asyncpg://postgres.<ref>:<pw>@<pooler-host>:5432/postgres?ssl=require` | `session` |
| Direct connection (IPv6, or IPv4 with the paid add-on) | 5432 | `postgresql+asyncpg://postgres:<pw>@db.<ref>.supabase.co:5432/postgres?ssl=require` | `session` |
| Transaction pooler | 6543 | `postgresql+asyncpg://postgres.<ref>:<pw>@<pooler-host>:6543/postgres?ssl=require` | `transaction` |

- **The driver prefix changes** from `postgresql://` to `postgresql+asyncpg://`. Without it,
  SQLAlchemy looks for a driver the image does not have.
- **A password with `@ : / ? # %`** in it must be percent-encoded in the URL (`@` → `%40`), or
  generate one without them.
- **`?ssl=require` or `?sslmode=require`** — either works. asyncpg has no `sslmode` keyword, so
  `app/db_engine.py` moves the mode out of the URL into asyncpg's `ssl=` argument. Staging and
  production **refuse to start** with no mode or with one that can fall back to plaintext
  (`disable`, `allow`, `prefer`).
- **`verify-full`** also checks the server's certificate. Download Supabase's CA certificate
  (*Database → Settings → SSL Configuration*), put it in the container, and set
  `PGSSLROOTCERT=/path/to/prod-ca.crt`. `require` encrypts without verifying who answers; it is
  the minimum, `verify-full` is better once you have a way to ship the file.

**Why the session pooler.** The direct connection is IPv6-only unless you buy the IPv4 add-on, and
container hosts' outbound traffic is usually IPv4. The session pooler is IPv4, supports prepared
statements, and holds one server connection per client connection — exactly what a long-running
process with a small pool wants.

### 3.2 Transaction mode, if you ever need it

The transaction pooler hands consecutive transactions on one client connection to *different*
server connections, so a prepared statement from one is missing in the next. With
`DB_POOL_MODE=transaction`, `app/db_engine.py` turns off asyncpg's statement cache and
SQLAlchemy's, gives every statement a unique name, and drops the client-side pool (`NullPool` — the
pooler is the pool). Measured on 26 Sep through PgBouncer in transaction mode with server-side
prepared statements off (Supavisor's behaviour), 10 concurrent sessions × 15 rounds × 4
parameterised queries:

| Options | Succeeded | Failed |
|---|---|---|
| `DB_POOL_MODE=transaction` | 150 | 0 |
| session-mode options through the same pooler | 30 | 120 — `prepared statement "__asyncpg_stmt_…" does not exist`, and some bound to *another client's* same-named statement (`incorrect binary data format`) |

The cost is a new connection to the pooler per database session. Use session mode until the
connection budget below forces the switch.

### 3.3 The connection budget

In session mode every client connection holds a server connection, and the pooler's **pool size**
(*Database → Settings → Connection pooling*; it depends on the compute size) is the ceiling:

```
API replicas × (DB_POOL_SIZE + DB_MAX_OVERFLOW)
  + worker replicas × connections the worker opens (1–2: it works one job at a time)
  + 1 for a migration
  + a few for you in the SQL editor
  ≤ the pooler's pool size
```

Defaults are `DB_POOL_SIZE=5`, `DB_MAX_OVERFLOW=5`: one API replica uses at most 10, so one API, one
worker and a migration fit in 15. For a second API replica, halve them (`3` and `2`). On the worker
service, `DB_POOL_SIZE=2` and `DB_MAX_OVERFLOW=0` is plenty.

---

## 4. Every setting

Both services get the **same** variables (the worker ignores the HTTP ones). Staging and production
are held to the same startup rules: a missing secret, local storage, or a database URL without TLS
stops the process at boot, with a message naming the setting — the host keeps the previous release
serving. `services/api/.env.example` lists every one; a test fails if a setting is missing from it.

### 4.1 API and worker (host secret store)

| Variable | Staging / production | Example | Where it comes from |
|---|---|---|---|
| `ENVIRONMENT` | **required** | `production` / `staging` | You. Tags crash reports; turns on the startup rules. The image defaults to `production`, so **staging must set it**; any other spelling is refused at startup |
| `TRUSTED_PROXY_COUNT` | **required** | `1` | How many proxies in front of the API append to `X-Forwarded-For` — one on Render, Railway or Fly. The image runs uvicorn with `--no-proxy-headers`, so this is the only place the real client address is read from; 0 would rate-limit every user as the proxy's single address |
| `ADMIN_TOKEN` | **required** | `openssl rand -base64 48` | Opens `/metrics` and `/v1/admin/*` (feedback, product metrics, alerts) |
| `DATABASE_URL` | **required** | `postgresql+asyncpg://postgres.<ref>:<pw>@<pooler-host>:5432/postgres?ssl=require` | §2.5 and §3.1 |
| `DB_POOL_MODE` | optional | `session` | §3 — `transaction` only for port 6543 |
| `DB_POOL_SIZE` | optional | `5` (worker: `2`) | §3.3 |
| `DB_MAX_OVERFLOW` | optional | `5` (worker: `0`) | §3.3 |
| `JWT_SECRET` | **required** | 64 random characters | `openssl rand -base64 48`. ≥ 32 bytes, never the dev value. Different per environment |
| `JWT_ALGORITHM` | optional | `HS256` | Leave it |
| `ACCESS_TOKEN_TTL_MINUTES` | optional | `15` | Leave it |
| `REFRESH_TOKEN_TTL_DAYS` | optional | `60` | Leave it |
| `UPLOAD_SIGNING_SECRET` | **required** | 64 random characters | `openssl rand -base64 48`, **not** the JWT secret |
| `STORAGE_BACKEND` | **required** | `s3` | Must be `s3`; `local` is refused |
| `S3_ENDPOINT_URL` | **required** for Supabase | `https://<ref>.storage.supabase.co/storage/v1/s3` | §2.7. Empty means AWS itself |
| `S3_REGION` | **required** | `eu-central-1` | §2.7 — the project's region |
| `S3_BUCKET` | **required** | `fitlog-photos` | §2.6 |
| `S3_ACCESS_KEY_ID` | **required** | — | §2.7 |
| `S3_SECRET_ACCESS_KEY` | **required** | — | §2.7 |
| `UPLOAD_MAX_BYTES` | optional | `8388608` | Keep equal to the bucket's size limit |
| `UPLOAD_URL_TTL_SECONDS` | optional | `600` | How long an upload URL and a photo URL live |
| `UPLOAD_ROOT` | ignored when `s3` | — | Development only |
| `AI_PROVIDER` | **required** for real analyses | `anthropic` | `stub` is the free, fake default |
| `AI_API_KEY` | **required** when not `stub` | — | Anthropic Console → API keys. One key per environment, so staging can be revoked alone |
| `AI_MODEL` | optional | `claude-sonnet-5` | |
| `AI_BASE_URL` | optional | `https://api.anthropic.com/v1/messages` | |
| `AI_TIMEOUT_SECONDS` | optional | `45` | |
| `AI_DAILY_QUOTA` | optional | `25` | Per-user daily cap — the first cost control |
| `AI_LOW_CONFIDENCE_THRESHOLD` | optional | `0.5` | |
| `WORKER_POLL_SECONDS` | optional | `2` | |
| `SENTRY_DSN` | recommended | `https://<key>@o<org>.ingest.sentry.io/<project>` | §8. Empty = no crash reports |
| `APP_RELEASE` | **set by the image** | `fitlog-api@<git sha>` | The Dockerfile bakes it in. Do not set it on the host |
| `TEST_DATABASE_URL` | not used | — | The test suite only |
| `PORT` | set by most hosts | `8000` | The port uvicorn binds; the image defaults to 8000 |
| `WEB_CONCURRENCY` | leave unset | `1` | uvicorn processes per container. Keep 1 and scale with replicas: `/metrics` counters are per process |
| `PGSSLROOTCERT` | optional | `/app/certs/prod-ca.crt` | §3.1, for `ssl=verify-full` |

### 4.2 GitHub (Settings → Environments → `staging` / `production`)

| Name | Kind | Example | Used by |
|---|---|---|---|
| `DATABASE_URL` | secret | the session pooler URL, as above | the migration job (§5) |
| `DEPLOY_HOOK_URL` | secret | the host's deploy hook for the **API** service | §6 |
| `WORKER_DEPLOY_HOOK_URL` | secret, optional | the hook for the **worker** service | §6 |
| `API_BASE_URL` | variable | `https://api.example.com` | waits for `/health` to report the new release |

### 4.3 Mobile builds (build machine or EAS — inlined into the app at build time)

| Name | Example | Notes |
|---|---|---|
| `API_URL` → `EXPO_PUBLIC_API_URL` | `https://api.example.com` | `STORE=1` refuses anything but `https://` |
| `EXPO_PUBLIC_SENTRY_DSN` | the **mobile** project's DSN | Empty = the app sends nothing |
| `EXPO_PUBLIC_SENTRY_ENVIRONMENT` | `staging` | Defaults to `production` in a release build |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | — | Source-map upload (§8). Without the token the build skips the upload |
| `FITLOG_UPLOAD_STORE_FILE` … `_KEY_PASSWORD` | — | The upload key, as before (`scripts/build-release-apk.sh`) |

---

## 5. Migrations and seeds — the release step

`scripts/migrate.sh` runs, in order: `alembic upgrade head`, `alembic current`, the Data API revoke
(`app/db_hardening.py`), and the reference-data seed (idempotent: exercises, muscle groups, foods).
It needs **`DATABASE_URL` and nothing else** — not the JWT secret, not the storage keys — and it
refuses `ENVIRONMENT=production` unless `CONFIRM_PRODUCTION=1`.

- **Normally you never run it.** The deploy workflow runs it for each environment before the new
  release starts (§6). The first deploy to an empty project creates every table and seeds it.
- **By hand, if you must** (e.g. a first staging run before the host exists), from a checkout of the
  commit being deployed:

  ```bash
  cd services/api && uv sync --frozen --no-dev && cd ../..
  DATABASE_URL='postgresql+asyncpg://…:5432/postgres?ssl=require' ENVIRONMENT=staging scripts/migrate.sh
  ```

  Not against production from a laptop: production's URL belongs in GitHub and the host, not in a
  shell history.
- **Session pooler or direct, never the transaction pooler** for migrations: they run DDL in one
  transaction and take locks.
- **Forward-only, expand/contract** (02 §11). A migration must leave the schema usable by the
  release *before* it, because that release keeps serving until the host swaps. Rename = add the new
  column, deploy, backfill, deploy code that stops using the old one, then drop it.
- **Never run `scripts/seed_demo.py` against staging or production.** It creates
  `demo@fitlog.app` with a password that is in the repository.
- **A host's own release command instead** (Render *Pre-Deploy Command*, Fly `release_command`):
  `sh -c "alembic upgrade head && python scripts/harden_database.py && python scripts/seed_catalog.py"`.
  Choose one place — the GitHub job or the host — never both.

---

## 6. GitHub: environments, secrets and the deploy workflow

1. **Push `main`** and see `ci.yml` go green (launch plan Phase 1).
2. **Environments** — *Settings → Environments → New environment*: `staging`, then `production`.
   On `production`: **Required reviewers: you**, and **Deployment branches: `main` only**. That
   reviewer is the only thing between a merge and production.
3. **Secrets and the variable** per environment, as in §4.2. Leave `DEPLOY_HOOK_URL` empty until the
   host exists (§7) — the workflow then migrates and stops.
4. **Branch protection** on `main`, with the CI jobs required.

**What happens on every push to `main`:** `ci.yml` runs; when it is green, `deploy.yml`:

1. builds the image once from the commit CI tested and pushes `ghcr.io/<owner>/fitlog-api:<sha>`;
2. **staging** (`deploy-environment.yml`): `scripts/migrate.sh` with the staging `DATABASE_URL` →
   moves the `:staging` tag to this image → POSTs the deploy hook(s) → polls
   `API_BASE_URL/health` until it reports `fitlog-api@<sha>` (10 minutes, then fails);
3. **production**: waits for your approval, then the same steps with the production secrets — and
   the same image, never a rebuild.

A pull request's CI run never triggers it (it checks the run was a push to `main` in this
repository), and runs never overlap or cancel each other mid-migration. **With no secrets**, every
step after the build is skipped with a notice: a fork, or this repository today, gets a green run
that deployed nothing.

**By hand:** *Actions → Deploy → Run workflow* — `ref` (branch or SHA) and `migrate` (§13).

**The image.** GHCR packages start **private**. After the first run: *your profile → Packages →
fitlog-api → Package settings* — link it to the repository and keep it private. The host needs a
credential to pull it: a GitHub **classic** personal access token with only `read:packages`,
entered as the host's registry credential (username: your GitHub user).

---

## 7. The container host: two services from one image

The same on every host; the host-specific names are in the table after.

| | **fitlog-api** | **fitlog-worker** |
|---|---|---|
| Image | `ghcr.io/<owner>/fitlog-api:<environment>` | the same |
| Command | the image default (uvicorn on `$PORT`) | `python -m app.worker` |
| Public HTTP | yes — health check path `/health` | none (a "background worker" / no domain) |
| Instances | 1 to start; 2 for deploys with no gap (mind §3.3) | 1 (several are safe: `SKIP LOCKED`) |
| Env vars | all of §4.1 | all of §4.1 (with the smaller pool) |
| Region | the Supabase project's | the same |

- **Health.** `/health` touches no database on purpose: a database blip must not make the host
  restart every replica at once. The image's `HEALTHCHECK` (`python -m app.healthcheck`) serves both
  services — the API is judged by `/health`, the worker by a heartbeat file it touches every loop
  (stale after 300 s, the worker's own lock timeout). Hosts that ignore Docker health checks lose
  nothing: a crashed worker exits and is restarted.
- **Shutdown.** uvicorn is PID 1 and finishes requests in flight for up to 20 s after SIGTERM. A
  worker killed mid-job leaves the job locked; another worker reclaims it after 300 s.
- **Size.** Measured idle on 26 Sep: the API at 75 MiB, the worker at 61 MiB; the image is 393 MB.
  The smallest plan with 512 MB is enough to start — watch the host's memory graph in the first
  week rather than guessing further.

| Host | API service | Worker service | Deploy hook | Notes |
|---|---|---|---|---|
| **Render** | Web Service → *Deploy an existing image* | Background Worker, same image, command `python -m app.worker` | *Settings → Deploy Hook* — one per service; paste them into `DEPLOY_HOOK_URL` / `WORKER_DEPLOY_HOOK_URL` | Fits `deploy.yml` with no glue: the hook redeploys the tag the workflow just moved |
| **Railway** | Service from a Docker image | Second service, same image, *Start Command* `python -m app.worker`, no domain | No plain hook URL | Either put a small endpoint (a function calling Railway's API) behind `DEPLOY_HOOK_URL`, or redeploy from Railway after the workflow moves the tag |
| **Fly.io** | an app with `[processes] api = …` | `worker = "python -m app.worker"` in the same `fly.toml` | No hook URL | Deploy with `fly deploy --image ghcr.io/…:<sha>` (a step you add with `FLY_API_TOKEN`), or a hook endpoint that calls the Machines API |

None of these has been tried (§14): pick one, follow its current docs for the clicks, and keep the
table above as the contract.

---

## 8. Crash reporting (Sentry)

**What is sent, and what never is.** Errors only — no performance tracing. `send_default_pii=False`,
no request bodies, no stack-frame local variables, and every event passes a scrubber
(`app/observability/crash_reporting.py`, `apps/mobile/src/lib/crashReporting.ts`) that drops
cookies, auth and forwarded-for headers, and URL query strings (an upload URL's query *is* its
signature), replaces emails and tokens anywhere in the event, and keeps only the user's id. The
suite asserts it on the shapes Sentry really sends, and once end to end through the real app.

1. **Organisation** at sentry.io — choose the **EU data region** if your users are in the EU (it
   cannot be changed later).
2. **Two projects:** `fitlog-api` (Python → FastAPI) and `fitlog-mobile` (React Native).
3. **In both projects** — *Settings → Security & Privacy*: **Data Scrubber: on**, **Use Default
   Scrubbers: on**, **Prevent Storing of IP Addresses: on**. The code already strips them; this is
   the server-side belt.
4. **API:** set `SENTRY_DSN` (the `fitlog-api` DSN) on **both** services. Events are tagged
   `process=api` or `process=worker`, `environment` from `ENVIRONMENT`, and the release from the
   image (`fitlog-api@<sha>`). An unhandled API error carries the `request_id` the user sees, so a
   support email leads straight to the stack trace.
5. **Prove it** once per environment, from the image the host runs:

   ```bash
   docker run --rm -e SENTRY_DSN='<dsn>' -e ENVIRONMENT=staging ghcr.io/<owner>/fitlog-api:<sha> \
     python -c "import sentry_sdk; from app.config import Settings; \
   from app.observability.crash_reporting import init_crash_reporting; \
   init_crash_reporting(Settings(), process='smoke'); \
   sentry_sdk.capture_message('FitLog smoke test'); sentry_sdk.flush()"
   ```

6. **Mobile:** build with `EXPO_PUBLIC_SENTRY_DSN` (and `EXPO_PUBLIC_SENTRY_ENVIRONMENT=staging` for
   test builds). For readable stack traces, also give the build `SENTRY_AUTH_TOKEN` (*Settings →
   Auth Tokens → organisation token*), `SENTRY_ORG` and `SENTRY_PROJECT=fitlog-mobile`; the
   `@sentry/react-native/expo` plugin uploads the source maps. **Without the token the build script
   skips the upload** — the plugin otherwise fails the whole build — and reports arrive minified.
   Never commit the token.
7. **Alerts:** *Alerts → Create → Issues → "A new issue is created"* → email you, in both projects.

The SDK is `@sentry/react-native ~6.10.0`, the version Expo SDK 52 pins
(`expo/bundledNativeModules.json`); upgrade it with the Expo SDK, not on its own.

---

## 9. Custom domain and HTTPS

1. In the host, add the custom domain `api.<your-domain>` to **fitlog-api** (only — the worker has no
   HTTP). It shows a DNS target.
2. At your DNS provider, create the **CNAME** `api` → that target (or the A/AAAA records the host
   asks for). The host issues and renews the TLS certificate once DNS resolves.
3. Check: `curl -sS https://api.<your-domain>/health` returns
   `{"success":true,"data":{"status":"ok","release":"fitlog-api@<sha>"},…}`.
4. Turn on the host's **HTTP → HTTPS redirect** and, if it offers one, **HSTS** (02 §8 asks for it;
   the API does not set the header itself yet).
5. Set `API_BASE_URL` in the GitHub environment (§4.2) and build the store app against it:
   `STORE=1 API_URL=https://api.<your-domain> … bash scripts/build-release-apk.sh`.

---

## 10. Monitoring, uptime and spend

- **Uptime** (UptimeRobot, Better Stack or similar): an HTTPS check of
  `https://api.<domain>/health` every 1–5 minutes, expecting `200` and the text `"status":"ok"`,
  alerting your phone. One for staging too, alerting email only.
- **The worker.** Uptime checks cannot see it. Its failure mode is analyses that never finish, which
  02 §9's `ai_queue_waiting` alert (oldest job > 60 s) detects — but `/metrics` and
  `/v1/admin/alerts` are not yet locked down or scraped (launch plan Phase 3 and 4). Until they
  are, a weekly glance at the worker's logs, and Sentry for its crashes.
- **Spend alerts — set every one of these on day one:**
  - **Anthropic Console** → billing: a monthly **spend limit** and email notifications below it.
    `AI_DAILY_QUOTA` caps each user; this caps the account.
  - **Supabase** → organisation billing: keep the **spend cap on** at first (it blocks usage beyond
    the plan's quota rather than billing it) and watch the usage emails.
  - **The host**: its usage alert or hard limit, if it has one; otherwise a weekly look at the
    invoice for the first month.
  - **Sentry**: the default spike protection, and a monthly event quota.

---

## 11. Backups, PITR and the restore drill

What exists: 7 days of daily backups (Pro), point-in-time recovery if you enabled it (§2.8), and
**nothing for the photos** (§2). A backup nobody has restored is a hope, so the launch plan's
"Done when" is a restore that shows yesterday's data. Do the drill **before launch and then
quarterly**; it takes under an hour.

**Before the first drill, once:** in production, register a dedicated account
(`restore-drill@<your-domain>`, password in your password manager) and log one workout with it.
The drill signs in as that account — never as a real user.

1. **Record** the time, and from the SQL editor:
   `SELECT count(*) FROM workout_sets;` and `SELECT max(created_at) FROM workout_sessions;`
2. **Restore into a new project** — *Database → Backups* → the most recent backup (or a point in
   time) → **Restore to a new project**. Never restore over production for a drill.
3. **Wait**, and note how long it took: that is your recovery time.
4. **Check the schema:** with the new project's session-pooler URL,
   `DATABASE_URL='…?ssl=require' uv run alembic current` (from `services/api`) → the head revision.
5. **Check the data:** the two queries from step 1. The difference from what you recorded is your
   recovery point — at most a day on daily backups, minutes with PITR.
6. **Check it end to end:** run the API locally against the restored database
   (`DATABASE_URL=… STORAGE_BACKEND=local uv run uvicorn app.main:app`), sign in as the drill
   account (`POST /v1/auth/login`), and read `/v1/history/workouts`: the drill workout is there.
7. **Write it down** in `docs/measurements/restore-drill-<date>.md`: backup time, restore duration,
   data age, and anything that surprised you.
8. **Delete the scratch project.**

**In a real incident:** stop the worker; restore (PITR to just before the damage, or the last good
backup) — in place if the whole database is lost, into a new project if you only need rows back;
point `DATABASE_URL` at it if it moved; run `scripts/migrate.sh` (it is a no-op at head); start
the worker; tell users what window was lost.

---

## 12. Staging and production

| | Staging | Production |
|---|---|---|
| Supabase project, bucket, S3 keys | its own | its own |
| Host services | `fitlog-api-staging`, `fitlog-worker-staging` | `fitlog-api`, `fitlog-worker` |
| `ENVIRONMENT` | `staging` — **same startup rules** as production | `production` |
| Secrets (`JWT_SECRET`, `UPLOAD_SIGNING_SECRET`, `AI_API_KEY`) | its own values | its own values |
| `AI_PROVIDER` | `anthropic` with its own key and a low Anthropic spend limit | `anthropic` |
| Sentry | same projects, `environment: staging` | `environment: production` |
| PITR | no | yes, once there are users |
| Deploys | automatically, on every green `main` | after your approval |
| Mobile builds pointing at it | internal testing / TestFlight | store releases only |

Staging holds **no real user data**, ever. Copying production into staging to debug something is a
data transfer that needs the same care as a breach.

---

## 13. Deploying and rolling back

**A normal release:** merge to `main` → CI green → staging migrated and live → approve production in
*Actions* → production migrated and live. Then: `/health` shows the new release, Sentry stays
quiet, and you sign in on a phone.

**Rolling back code** (the usual case — a bad release, a good schema):

- **Fastest:** the host's own "rollback to previous deploy", if it has one.
- **Through the workflow:** *Actions → Deploy → Run workflow* with `ref` = the last good SHA and
  **`migrate` unticked**. The database stays where it is: migrations are forward-only, and
  expand/contract is what lets the older build run on the newer schema. With `migrate` ticked, an
  older build fails at `alembic upgrade head` — it does not know the newer revision — which is the
  workflow refusing, not breaking.

**Rolling back a migration:** don't. Write the next migration that fixes it (fix forward). Restoring
a backup (§11) is for lost or corrupted **data**, not for a bad deploy.

**Before any risky migration** (a backfill, a column drop): note the time first, so a
point-in-time restore has a target.

---

## 14. What was verified here, and what was not

On the build machine, 26 Sep 2026, without any cloud account:

| Claim | Evidence |
|---|---|
| The image builds, runs as uid 10001 on Python 3.13, and serves `/health` with its release | `docker build … services/api`; `docker run` against the dev database → `{"status":"ok","release":"fitlog-api@localtest"}`; `/metrics` read the queue from Postgres |
| The worker runs from the same image, and both containers report healthy | `docker run … python -m app.worker` → Docker health `healthy` for both; the worker judged by its heartbeat |
| A misconfigured production container refuses to boot | `ENVIRONMENT=production` with the dev JWT secret, with `STORAGE_BACKEND=local`, and with a URL without TLS → each stops with the setting named |
| The S3 store honours the storage contract | 26 tests against moto's S3 server in the suite, and against a real S3-compatible server (SeaweedFS): presigned URLs expire (403 after the TTL), the bare object URL is refused, `uploads/u1` never deletes `uploads/u10` |
| Account deletion empties the user's bucket folder and nobody else's | `tests/test_signed_reads.py`, routes against an S3 bucket |
| Transaction-pooler options work through a transaction pooler | §3.2, PgBouncer |
| Migrations need only `DATABASE_URL`; production needs confirmation and TLS | `tests/test_release_scripts.py`, `tests/test_db_engine.py` |
| Supabase's API roles lose their grants on every release | `tests/test_db_hardening.py` (probe roles, rolled back) |
| The mobile release build works with the Sentry plugin | `bash scripts/build-release-apk.sh` → APK with `libsentry.so`; the upload task alone, without a token, fails the build — which is why the script skips it |
| The workflows are well-formed | `actionlint` clean |

**Not verified — no account exists:** a real Supabase project (its S3 endpoint, presigned URLs
through its gateway, the session pooler, a restore), any container host, the push to GHCR, the
deploy hooks, `workflow_run` firing on GitHub, and a real Sentry project receiving events. The first
staging deploy is their first test. Do not read a missing run as a passing one.

---

## 15. The owner's checklist

1. [ ] Push `main`; CI green; branch protection on (§6).
2. [ ] Supabase **staging** project: Pro, region, password, **Data API off**, SSL enforced, session
       pooler URL, private bucket, S3 keys (§2).
3. [ ] GitHub environment `staging`: `DATABASE_URL`. Run *Deploy* by hand → staging migrated and
       seeded, nothing deployed yet (§5, §6).
4. [ ] Sentry organisation and the two projects, privacy settings on (§8).
5. [ ] Anthropic staging key with a low spend limit (§10).
6. [ ] Host: `fitlog-api-staging` and `fitlog-worker-staging` from the image, env vars of §4.1, GHCR
       pull credential (§6, §7).
7. [ ] `DEPLOY_HOOK_URL`, `WORKER_DEPLOY_HOOK_URL`, `API_BASE_URL` in `staging`; push a commit and
       watch the whole pipeline go green (§6).
8. [ ] Sentry smoke test against staging (§8); a staging build of the app, used for a day.
9. [ ] Re-run `./scripts/verify-containment.sh`'s scenario against staging: AI down must not touch
       training (I14, launch plan Phase 4).
10. [ ] Repeat 2, 3, 5, 6 and 7 for **production**, with the `production` environment's required
        reviewer set (§6, §12).
11. [ ] Domain and HTTPS for production (§9); uptime check (§10); every spend alert (§10).
12. [ ] PITR decision for production (§2.8); the **restore drill**, written down (§11).
13. [ ] Store build against the production URL, with the Sentry DSN and token (§4.3, §8).
