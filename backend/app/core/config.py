"""Application configuration via Pydantic Settings.

Reads from environment variables and .env file. All config values
are typed and validated at startup — no stringly-typed config elsewhere.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central application configuration."""

    app_name: str = "Closira"
    app_version: str = "1.0.0"
    debug: bool = False
    log_level: str = "INFO"

    # ── Database ────────────────────────────────────────────────────────────
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/closira"

    # ── JWT Auth ────────────────────────────────────────────────────────────
    jwt_secret_key: str = "change-this-secret-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    # ── Redis / Celery ───────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


settings = Settings()
