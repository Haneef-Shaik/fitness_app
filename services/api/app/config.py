from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://fitlog:fitlog@localhost:5432/fitlog"
    test_database_url: str = "postgresql+asyncpg://fitlog:fitlog@localhost:5433/fitlog_test"

    # Secrets never have a usable default in production; startup validates this.
    jwt_secret: str = "dev-only-change-me"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 60

    environment: str = "development"

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
    #: A local object store. The charter's standing rule is no cloud, so S3 is
    #: one more implementation of `app.storage.base.ObjectStore`, not a rewrite.
    upload_root: str = "var/uploads"
    upload_max_bytes: int = 8 * 1024 * 1024
    upload_url_ttl_seconds: int = 600
    #: Its own secret. Reusing the JWT secret would mean one leak is two.
    upload_signing_secret: str = "dev-only-change-me"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    if s.is_production:
        if s.jwt_secret == "dev-only-change-me":
            raise RuntimeError("JWT_SECRET must be set in production")
        if len(s.jwt_secret) < 32:
            raise RuntimeError("JWT_SECRET must be at least 32 bytes for HS256 (RFC 7518 §3.2)")
        if s.upload_signing_secret == "dev-only-change-me":
            raise RuntimeError("UPLOAD_SIGNING_SECRET must be set in production")
        if s.ai_provider != "stub" and not s.ai_api_key:
            # Better to refuse to start than to serve an AI feature that fails
            # on every request with a provider error.
            raise RuntimeError(f"AI_API_KEY must be set when AI_PROVIDER={s.ai_provider}")
    return s
