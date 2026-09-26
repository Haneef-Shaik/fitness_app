from dataclasses import dataclass
from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

#: The only environments there are. Anything else refuses to start.
ENVIRONMENTS = frozenset({"development", "test", "staging", "production"})


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    #: Hosted (L1, Supabase): the session pooler's URL with `?ssl=require` —
    #: `postgresql+asyncpg://postgres.<ref>:<pw>@<pooler-host>:5432/postgres?ssl=require`.
    #: Staging and production refuse a URL that does not insist on TLS (`app/db_engine.py`).
    database_url: str = "postgresql+asyncpg://fitlog:fitlog@localhost:5432/fitlog"
    test_database_url: str = "postgresql+asyncpg://fitlog:fitlog@localhost:5433/fitlog_test"

    # ------------------------------------------------------- database pooling
    #: "session" — one server connection per client connection: a direct
    #: connection or Supabase's session pooler (port 5432). "transaction" — the
    #: transaction pooler (port 6543), which cannot keep a prepared statement
    #: between transactions; `app/db_engine.py` turns them off for it.
    db_pool_mode: Literal["session", "transaction"] = "session"
    #: Per process, and session mode only (in transaction mode the pooler is the
    #: pool). API replicas × (size + overflow) + the worker + one migration must
    #: fit the pooler's pool size — docs/12 §3 has the arithmetic.
    db_pool_size: int = Field(default=5, ge=1)
    db_max_overflow: int = Field(default=5, ge=0)

    #: "development" (default), "test", "staging" or "production". Staging and
    #: production are held to the same startup rules (`validate`).
    environment: str = "development"

    @field_validator("environment", mode="before")
    @classmethod
    def _known_environment(cls, v: object) -> str:
        """One of four names, or no start at all.

        Every production rule hangs off `is_deployed`, an exact match — so
        `Production`, `prod` or `production ` used to switch all of them off
        at once: the dev JWT secret accepted, the admin reads open to any user
        (G11 security review). Case and spacing are forgiven; anything else is
        refused.
        """
        name = str(v).strip().lower()
        if name not in ENVIRONMENTS:
            raise ValueError(f"ENVIRONMENT must be one of {sorted(ENVIRONMENTS)}, not {v!r}")
        return name

    # ---------------------------------------------------------------- AI (G8)
    #: "stub" is the default ON PURPOSE. `git clone` → `pytest` → run the app
    #: needs no key and costs nothing; spending money is opt-in.
    ai_provider: str = "stub"
    ai_model: str = "claude-sonnet-5"
    #: Overridable so a proxy, a self-hosted gateway or a deliberately dead
    #: endpoint can be pointed at — the containment check uses the last of those.
    ai_base_url: str = "https://api.anthropic.com/v1/messages"
    #: Never has a default. Absent means the stub, and production validates.
    ai_api_key: str = ""
    #: A call without a timeout holds a worker slot until the process restarts.
    ai_timeout_seconds: float = 45.0
    #: 02 §5.4 — a per-user daily cap, stated in the UI before a photo is taken.
    ai_daily_quota: int = 25
    #: Below this, H-08 starts the item UNCHECKED (N04.3). One home for the rule.
    ai_low_confidence_threshold: float = 0.5
    worker_poll_seconds: float = 2.0

    # ----------------------------------------------------------- uploads (G8)
    #: "local" writes under `upload_root` — development and the suite. "s3" is
    #: any S3-compatible bucket; hosted, that is Supabase Storage (L1). Both are
    #: `app.storage.base.ObjectStore` (D26), so nothing above the store changes.
    storage_backend: Literal["local", "s3"] = "local"
    upload_root: str = "var/uploads"
    upload_max_bytes: int = 8 * 1024 * 1024
    #: Any request body, declared by Content-Length. Above the 8 MB photo and
    #: the 8 MB import (JSON-encoded, so a little larger), below "all the RAM".
    max_body_bytes: int = 12 * 1024 * 1024
    #: How long a signed URL lives — the upload PUT and the photo GET alike.
    upload_url_ttl_seconds: int = 600
    #: Its own secret. Reusing the JWT secret would mean one leak is two.
    upload_signing_secret: str = "dev-only-change-me"

    #: Supabase: `https://<ref>.storage.supabase.co/storage/v1/s3`. Empty means
    #: AWS itself, which finds the endpoint from the region.
    s3_endpoint_url: str = ""
    s3_region: str = ""
    #: A PRIVATE bucket (BRD §18). Nothing here makes an object public.
    s3_bucket: str = ""
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""

    # --------------------------------------------- Supabase (docs/14-SUPABASE)
    #: The project, `https://<ref>.supabase.co`. Signing in is Supabase Auth's:
    #: the API accepts only access tokens this project issued (`iss` is
    #: `<SUPABASE_URL>/auth/v1`) and verifies them against its JWKS. Required
    #: when deployed; in development the local stack's `http://127.0.0.1:54321`.
    supabase_url: str = ""
    #: The SECRET key (Settings → API Keys: `sb_secret_…`, or the legacy
    #: `service_role` key). Server-only, never in the app: deleting an account's
    #: sign-in, the web deletion page's one-time code, photo thumbnails.
    supabase_secret_key: str = ""
    #: Only for a project still signing tokens with the LEGACY HS256 secret
    #: (Settings → JWT Keys → Legacy JWT secret). Current projects and the local
    #: stack sign with asymmetric keys, which need nothing here.
    supabase_jwt_secret: str = ""

    # --------------------------------------------------------- crash reports
    #: Empty means crash reporting is off — the default, and what the suite runs.
    sentry_dsn: str = ""
    #: Which build is running: the image bakes in `fitlog-api@<git sha>`. Tags
    #: every crash report and is echoed by `/health`, which is how a deploy
    #: checks that the new build is the one answering.
    app_release: str = ""

    # ------------------------------------------------------------------ push
    #: "none" by default: nothing leaves for a push service until configured.
    push_provider: str = "none"
    #: Optional — only if "enhanced push security" is on in the Expo project.
    expo_access_token: str = ""

    # ------------------------------------------------------ L-08 (service status)
    #: Declared by whoever runs the service. Every call but health and status
    #: answers 503 MAINTENANCE with this message, which the app shows as it is.
    maintenance_mode: bool = False
    maintenance_message: str = ""
    #: "AI degraded" is observed: at least this many analyses in the window, and
    #: at least this share of them failed at the provider.
    ai_degraded_window_minutes: int = 15
    ai_degraded_min_samples: int = 5
    ai_degraded_failure_ratio: float = 0.5

    # ------------------------------------------------ operators (launch)
    #: The bearer that opens `/v1/admin/*` and `/metrics` in production. Never
    #: has a default, and production refuses to start without one: before it,
    #: any registered user could read the alert table and anybody at all could
    #: scrape the metrics.
    admin_token: str = ""
    #: The contact address the privacy policy and terms print. Empty shows an
    #: [OWNER: …] marker in its place, which keeps the DRAFT banner honest.
    support_email: str = ""
    #: Where people reach this API, e.g. https://api.fitlog.app — the policies
    #: print the account-deletion link from it (Google Play lists that link).
    #: Never derived from a request's Host header. Empty makes links relative.
    public_base_url: str = ""

    # ------------------------------------------- rate limiting (02 §8, launch)
    #: On everywhere except the test suite, which says why in tests/conftest.py.
    rate_limits_enabled: bool = True
    #: How many reverse proxies in front of the API APPEND to X-Forwarded-For.
    #: 0 ignores the header entirely: without a proxy that writes it, it is the
    #: caller's to write, and trusting it hands an attacker a fresh address per
    #: request and a way past every per-IP limit.
    trusted_proxy_count: int = Field(default=0, ge=0)
    #: Each is "<count>/<second|minute|hour|day>", validated at startup. A
    #: fixed window per address and per account; see app/core/ratelimit.py.
    #: Deletion, in the app and on the web page. The web page emails a one-time
    #: code and takes guesses at it, so it gets a login-shaped limit per hour.
    #: Signing in itself is limited by Supabase Auth (docs/14).
    rate_limit_account_delete_ip: str = "10/hour"
    rate_limit_account_delete_account: str = "5/hour"
    #: 02 §5.4's per-minute limit, on top of the daily quota: a burst costs
    #: money long before a day's allowance is used up.
    rate_limit_ai_ip: str = "30/minute"
    rate_limit_ai_account: str = "10/minute"
    #: An import parses up to 8 MB and may write years of history; feedback is
    #: stored for a person to read. Neither is something anyone does often.
    rate_limit_imports_ip: str = "20/hour"
    rate_limit_imports_account: str = "10/hour"
    rate_limit_feedback_ip: str = "20/hour"
    rate_limit_feedback_account: str = "10/hour"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_deployed(self) -> bool:
        """Staging and production. Staging is where production's settings are
        rehearsed, so a rule it skipped would be first exercised on real users."""
        return self.environment in ("staging", "production")


#: The S3 settings a bucket cannot be reached without.
_S3_REQUIRED = ("s3_bucket", "s3_region", "s3_access_key_id", "s3_secret_access_key")


def validate(s: Settings) -> Settings:
    """Refuses a configuration that would start and then fail on real requests.

    Better to refuse to start than to serve a feature that fails on every
    request — the host keeps the previous release running when a new one will
    not come up healthy. Storage first, then every other rule
    (`validate_settings`), all of which staging is held to as well.
    """
    if s.storage_backend == "s3":
        missing = [name.upper() for name in _S3_REQUIRED if not getattr(s, name)]
        if missing:
            raise RuntimeError(f"STORAGE_BACKEND=s3 needs {', '.join(missing)}")
    if s.is_deployed and s.storage_backend == "local":
        # A container's filesystem is gone at the next deploy, and a second
        # replica never had it: every photo would 404 by the next release.
        raise RuntimeError(
            f"STORAGE_BACKEND must be s3 in {s.environment}; local files do not survive a deploy"
        )
    return validate_settings(s)


#: Every field above that holds a rule, checked by name at startup.
RATE_LIMIT_FIELDS = tuple(name for name in Settings.model_fields if name.startswith("rate_limit_"))

#: Shorter than this is a token somebody typed, not one somebody generated.
ADMIN_TOKEN_MIN_LENGTH = 32

_UNITS = {"second": 1, "minute": 60, "hour": 3600, "day": 86_400}


@dataclass(frozen=True)
class Rule:
    """At most `count` requests per fixed window of `seconds`."""

    count: int
    seconds: int


def parse_rule(value: str) -> Rule:
    """`"10/minute"` → `Rule(10, 60)`. Lives with the settings it validates."""
    count, sep, unit = value.partition("/")
    if not sep or not count.strip().isdigit() or unit.strip() not in _UNITS:
        raise ValueError(f"{value!r} is not '<count>/<{'|'.join(_UNITS)}>'")
    rule = Rule(count=int(count.strip()), seconds=_UNITS[unit.strip()])
    if rule.count < 1:
        # Zero would lock the endpoint for everybody. Turning a limit off is
        # RATE_LIMITS_ENABLED, said out loud, not a number that means "never".
        raise ValueError(f"{value!r} allows nothing at all")
    return rule


def validate_settings(s: Settings) -> Settings:
    """Refuse to start rather than start wrong.

    Separate from `get_settings` so the rules can be tested against a
    constructed `Settings` without touching the cached one every other module
    holds — and so a rule added here is a rule with a test.
    """
    for name in RATE_LIMIT_FIELDS:
        try:
            parse_rule(getattr(s, name))
        except ValueError as e:
            raise RuntimeError(f"{name.upper()} is not a rate limit: {e}") from e
    if not s.is_deployed:
        return s
    if not s.supabase_url.startswith("https://"):
        # Every signed-in request is verified against this project's keys; an
        # unset or plain-HTTP URL is an API nobody can sign in to, or one whose
        # keys anyone on the path could replace.
        raise RuntimeError(f"SUPABASE_URL must be the project's https:// address in {s.environment}")
    if not s.supabase_secret_key:
        # Without it an account cannot be deleted — which both stores require.
        raise RuntimeError(f"SUPABASE_SECRET_KEY must be set in {s.environment}")
    if s.upload_signing_secret == "dev-only-change-me":
        raise RuntimeError("UPLOAD_SIGNING_SECRET must be set in production")
    if s.ai_provider != "stub" and not s.ai_api_key:
        # Better to refuse to start than to serve an AI feature that fails
        # on every request with a provider error.
        raise RuntimeError(f"AI_API_KEY must be set when AI_PROVIDER={s.ai_provider}")
    if s.public_base_url and not s.public_base_url.startswith("https://"):
        # It is printed as the account-deletion link; a policy that sends
        # a password form over plain HTTP is not one to publish.
        raise RuntimeError("PUBLIC_BASE_URL must be an https:// address in production")
    if len(s.admin_token) < ADMIN_TOKEN_MIN_LENGTH:
        # Unset would leave /metrics and the alert table open to the
        # internet; short would leave them one guess away.
        raise RuntimeError(
            f"ADMIN_TOKEN must be set in production, at least {ADMIN_TOKEN_MIN_LENGTH} "
            "characters (generate: openssl rand -base64 48)"
        )
    return s


@lru_cache
def get_settings() -> Settings:
    return validate(Settings())
