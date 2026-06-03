"""SQLAlchemy database engine and session management.

Uses PostgreSQL via psycopg2. The session factory provides scoped sessions
for request-level isolation via FastAPI's dependency injection.
"""

from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,   # Detect stale connections before use
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""

    pass


def get_db() -> Generator[Session, None, None]:
    """Yield a database session for dependency injection.

    The session is automatically closed after the request completes,
    regardless of whether an exception occurred.

    Yields:
        A SQLAlchemy Session instance.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Probe the database to verify connectivity.

    Returns:
        True if the database responds to a simple query, False otherwise.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
