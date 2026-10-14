"""Application configuration loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings.

    All values are loaded from environment variables or a `.env` file.
    No secrets are hard-coded.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Core ──────────────────────────────────────────────────────────
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    SECRET_KEY: str = Field(..., min_length=32)
    CORS_ORIGINS: str = "http://localhost:3000"
    ALLOWED_HOSTS: str = "localhost,127.0.0.1"

    # ── Database ──────────────────────────────────────────────────────
    DATABASE_URL: str = Field(..., description="Pooled Neon connection string")
    DATABASE_URL_DIRECT: str = Field(
        default="",
        description="Direct Neon connection for migrations",
    )

    # ── Auth ──────────────────────────────────────────────────────────
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BCRYPT_ROUNDS: int = 12

    # ── Rate Limiting ─────────────────────────────────────────────────
    LOGIN_RATE_LIMIT_ATTEMPTS: int = 5
    LOGIN_RATE_LIMIT_WINDOW_MINUTES: int = 15

    # ── Integrations ──────────────────────────────────────────────────
    SMS_PROVIDER: Literal["console", "africas_talking"] = "console"
    SMS_API_KEY: str = ""
    SMS_SENDER_ID: str = "HaihuwaL"

    PAYMENT_PROVIDER: Literal["manual"] = "manual"
    PAYMENT_API_KEY: str = ""
    PAYMENT_WEBHOOK_SECRET: str = ""

    # ── Derived ───────────────────────────────────────────────────────
    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def allowed_host_list(self) -> list[str]:
        return [h.strip() for h in self.ALLOWED_HOSTS.split(",") if h.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v or v.startswith("change"):
            raise ValueError("DATABASE_URL must be configured")
        return v


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached singleton for application settings."""
    return Settings()  # type: ignore[call-arg]
