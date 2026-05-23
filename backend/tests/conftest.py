"""Test fixtures for the Closira backend test suite.

Provides a test database (file-based SQLite for cross-thread safety),
test client, and reusable helper fixtures for creating enquiries.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base, get_db
from app.main import app
from app.workers.enquiry_processor import set_session_factory

# File-based SQLite for test — needed because background tasks run
# in a separate thread and in-memory DBs are per-connection.
TEST_DATABASE_URL = "sqlite:///./test_closira.db"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    """Override the DB dependency to use the test database."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Wire the background task processor to use the test DB session
set_session_factory(TestSessionLocal)


@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables before each test, drop after.

    Yields:
        None — tables are available for the test duration.
    """
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client() -> TestClient:
    """Provide a FastAPI TestClient instance.

    Returns:
        A TestClient connected to the test application.
    """
    return TestClient(app)


@pytest.fixture
def db_session() -> Session:
    """Provide a raw database session for direct DB assertions.

    Yields:
        A SQLAlchemy Session connected to the test database.
    """
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def sample_enquiry(client: TestClient) -> dict:
    """Create a sample enquiry and return the response body.

    Args:
        client: The test client fixture.

    Returns:
        The JSON response body from POST /enquiry.
    """
    response = client.post(
        "/enquiry",
        json={
            "channel": "whatsapp",
            "customer_name": "Test Customer",
            "message": "I need pricing information for the enterprise plan.",
        },
    )
    return response.json()
