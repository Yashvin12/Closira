"""Background task processor for enquiry SOP matching.

Runs as a FastAPI BackgroundTask — not Celery. This is intentional:
1. SQLite doesn't support concurrent writes well → single-process is safer.
2. The SOP matching is CPU-trivial (keyword substring check), not I/O-bound.
3. No additional infrastructure (Redis/RabbitMQ) required for an intern assignment.

The processor creates its own DB session since BackgroundTasks run after
the response is sent (the request session is already closed).
"""

import logging
from collections.abc import Callable

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.services import sop_matcher
from app.services.enquiry_service import (
    auto_escalate_enquiry,
    get_enquiry_or_raise,
    update_enquiry_from_sop,
)

logger = logging.getLogger("closira")

# Configurable session factory — allows test override
_session_factory: Callable[[], Session] = SessionLocal


def set_session_factory(factory: Callable[[], Session]) -> None:
    """Override the session factory used by background tasks.

    This is used in tests to inject a test database session.

    Args:
        factory: A callable that returns a new SQLAlchemy Session.
    """
    global _session_factory
    _session_factory = factory


def process_enquiry(enquiry_id: str) -> None:
    """Process a newly created enquiry in the background.

    1. Fetches the enquiry from the database.
    2. Runs SOP keyword matching against the message.
    3. If matched → updates with sop_matched, suggested_response, status 'qualified'.
    4. If no match → auto-escalates with reason "No SOP matched".

    Args:
        enquiry_id: The UUID of the enquiry to process.
    """
    db = _session_factory()
    try:
        logger.info(
            "Background processing started",
            extra={
                "event": "background_task_started",
                "enquiry_id": enquiry_id,
                "detail": "SOP matching initiated",
            },
        )

        enquiry = get_enquiry_or_raise(db, enquiry_id)
        result = sop_matcher.match(enquiry.message)

        if result is not None:
            update_enquiry_from_sop(
                db=db,
                enquiry_id=enquiry_id,
                sop_name=result["name"],
                suggested_response=result["suggested_response"],
            )
            logger.info(
                "Background processing completed — SOP matched",
                extra={
                    "event": "background_task_completed",
                    "enquiry_id": enquiry_id,
                    "detail": f"Matched SOP: {result['name']}",
                },
            )
        else:
            auto_escalate_enquiry(db=db, enquiry_id=enquiry_id)
            logger.info(
                "Background processing completed — auto-escalated",
                extra={
                    "event": "background_task_completed",
                    "enquiry_id": enquiry_id,
                    "detail": "No SOP match, auto-escalated",
                },
            )
    except Exception as exc:
        logger.error(
            "Background processing failed",
            extra={
                "event": "background_task_error",
                "enquiry_id": enquiry_id,
                "detail": str(exc),
            },
        )
        raise
    finally:
        db.close()
