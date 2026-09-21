from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://volt:volt@localhost:5432/volt"
    test_database_url: str = "postgresql+asyncpg://volt:volt@localhost:5433/volt_test"

    # Secrets never have a usable default in production; startup validates this.
    jwt_secret: str = "dev-only-change-me"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 60

    environment: str = "development"

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
    return s
