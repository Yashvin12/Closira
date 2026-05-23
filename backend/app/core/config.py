"""Application configuration via Pydantic Settings.

Reads from environment variables and .env file. All config values
are typed and validated at startup — no stringly-typed config elsewhere.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central application configuration.

    Attributes:
        app_name: Display name for the application.
        app_version: Semantic version string.
        debug: Enable debug mode (verbose errors, reload).
        database_url: SQLAlchemy connection string for the database.
        log_level: Python logging level name (DEBUG, INFO, WARNING, ERROR).
    """

    app_name: str = "Closira"
    app_version: str = "1.0.0"
    debug: bool = False
    database_url: str = "sqlite:///./closira.db"
    log_level: str = "INFO"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


settings = Settings()
