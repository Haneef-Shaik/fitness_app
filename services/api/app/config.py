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

    # Secrets never have a usable default in production; startup validates this.
    jwt_secret: str = "dev-only-change-me"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 60

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

    #: The Supabase project (`https://<ref>.supabase.co`) and its SECRET key
    #: (Settings → API Keys: `sb_secret_…`, or the legacy `service_role` key).
    #: Server-only, never in the app. Used for photo thumbnails rendered by
    #: Storage (docs/14 S10); empty means no thumbnails and the app shows the
    #: original.
    supabase_url: str = ""
    supabase_secret_key: str = ""

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

    # ------------------------------------------------- email (A-05, A-06, K-02)
    #: "console" is the default for the reason "stub" is: a checkout sends no
    #: mail and needs no key. It keeps each message in memory (the suite follows
    #: links out of it) and echoes it to the log in development. Production
    #: refuses it — a reset request that sends nothing is a locked-out user.
    email_provider: str = "console"
    #: Never has a default. Production validates it when the provider needs one.
    email_api_key: str = ""
    #: The sender the provider has verified, e.g. `FitLog <no-reply@fitlog.app>`.
    email_from: str = ""
    email_base_url: str = "https://api.resend.com/emails"
    #: A send holds a request (or a background slot) until it answers.
    email_timeout_seconds: float = 10.0
    #: Where emailed links open. `fitlog` is the scheme in apps/mobile/app.json,
    #: so `fitlog://reset-password?token=…` lands on A-05 inside the app.
    app_link_base: str = "fitlog://"
    #: A-05. Short, because a reset link is a password for as long as it lives.
    password_reset_ttl_minutes: int = 30
    #: A-06. A day: people open their mail later than they sign up.
    email_verify_ttl_hours: int = 24
    #: One link per purpose per minute — the "Resend in 0:45" on A-05 and A-06.
    email_resend_cooldown_seconds: int = 60

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
    #: Login's pair is the one the launch plan names: ten a minute from one
    #: address, five a minute at one account from anywhere.
    rate_limit_login_ip: str = "10/minute"
    rate_limit_login_account: str = "5/minute"
    #: Every address together, for one account: a botnet's ceiling, loose
    #: enough that it takes one to lock the owner out.
    rate_limit_login_total_account: str = "30/hour"
    #: Sign-ups are rarer than logins, so the window is an hour — generous for
    #: a household behind one router, useless for a script making accounts.
    rate_limit_register_ip: str = "10/hour"
    rate_limit_register_account: str = "5/hour"
    #: The app refreshes about every 15 minutes per device and single-flights
    #: it (src/lib/api.ts), so this only ever meets something that is not the app.
    rate_limit_refresh_ip: str = "30/minute"
    rate_limit_refresh_account: str = "10/minute"
    #: Deletion checks a password, in the app and on the web form alike, so it
    #: is a password-guessing surface and gets a login-shaped limit per hour.
    rate_limit_account_delete_ip: str = "10/hour"
    rate_limit_account_delete_account: str = "5/hour"
    #: 02 §5.4's per-minute limit, on top of the daily quota: a burst costs
    #: money long before a day's allowance is used up.
    rate_limit_ai_ip: str = "30/minute"
    rate_limit_ai_account: str = "10/minute"
    #: A-05. "Forgot" mails a stranger's inbox and "reset" is a place to guess
    #: a link; both are counted together, per address and per email typed —
    #: the same answer for an address with or without an account.
    rate_limit_password_reset_ip: str = "10/hour"
    rate_limit_password_reset_account: str = "5/hour"
    rate_limit_password_reset_total_account: str = "20/day"
    #: A-06. Opening links is cheap and legitimate; this only stops a scan.
    rate_limit_email_verify_ip: str = "30/hour"
    rate_limit_email_verify_account: str = "30/hour"
    #: An import parses up to 8 MB and may write years of history; feedback is
    #: stored for a person to read. Neither is something anyone does often.
    rate_limit_imports_ip: str = "20/hour"
    rate_limit_imports_account: str = "10/hour"
    rate_limit_feedback_ip: str = "20/hour"
    rate_limit_feedback_account: str = "10/hour"
    #: K-02's password re-checks (change password, change email). Someone with
    #: a stolen session could otherwise guess the password without limit, and
    #: change-email with it is a takeover (G11 security review).
    rate_limit_reauth_ip: str = "20/hour"
    rate_limit_reauth_account: str = "10/hour"

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


#: Every EMAIL_PROVIDER `app.email.provider` knows how to build.
EMAIL_PROVIDERS = frozenset({"console", "resend"})

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
    if s.email_provider not in EMAIL_PROVIDERS:
        # Checked in every environment: the sender is built lazily, so a typo
        # would otherwise surface as a 500 on the first sign-up.
        raise RuntimeError(
            f"Unknown EMAIL_PROVIDER {s.email_provider!r}; use one of {sorted(EMAIL_PROVIDERS)}"
        )
    if not s.is_deployed:
        return s
    if s.jwt_secret == "dev-only-change-me":
        raise RuntimeError(f"JWT_SECRET must be set in {s.environment}")
    if len(s.jwt_secret) < 32:
        raise RuntimeError("JWT_SECRET must be at least 32 bytes for HS256 (RFC 7518 §3.2)")
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
    if s.email_provider == "console":
        # The console sender answers "we've sent you a link" and sends nothing,
        # so nobody could ever reset a password or verify an address.
        raise RuntimeError("EMAIL_PROVIDER must be a real provider in production, not console")
    if not s.email_api_key:
        raise RuntimeError(f"EMAIL_API_KEY must be set when EMAIL_PROVIDER={s.email_provider}")
    if not s.email_from:
        raise RuntimeError("EMAIL_FROM must be set to an address the provider has verified")
    if not s.email_base_url.startswith("https://"):
        # The request carries the API key and a live reset link.
        raise RuntimeError("EMAIL_BASE_URL must be https in production")
    if s.email_resend_cooldown_seconds < 30:
        # The only thing between the reset form and a stranger's inbox.
        raise RuntimeError("EMAIL_RESEND_COOLDOWN_SECONDS must be at least 30 in production")
    if not 5 <= s.password_reset_ttl_minutes <= 60:
        # A reset link is a password for as long as it lives.
        raise RuntimeError("PASSWORD_RESET_TTL_MINUTES must be between 5 and 60 in production")
    return s


@lru_cache
def get_settings() -> Settings:
    return validate(Settings())
