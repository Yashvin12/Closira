"""Celery tasks for enquiry background processing.

process_enquiry_task   — SOP matching + auto-escalation (async version)
send_followup_task     — future notification dispatch placeholder
"""

import logging

from app.celery_app import celery_app
from app.core.database import SessionLocal
from app.services import sop_matcher
from app.services.enquiry_service import (
    auto_escalate_enquiry,
    get_enquiry_or_raise,
    update_enquiry_from_sop,
)

logger = logging.getLogger("closira")


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    name="app.tasks.enquiry_tasks.process_enquiry_task",
)
def process_enquiry_task(self, enquiry_id: str) -> None:
    """Celery task: run SOP matching on a new enquiry.

    Used when you want SOP processing decoupled from the HTTP request cycle.
    The route already does synchronous SOP matching for instant feedback,
    so this task handles any re-processing or retry scenarios.

    Args:
        enquiry_id: UUID of the enquiry to process.
    """
    db = SessionLocal()
    try:
        logger.info(
            "Celery task started",
            extra={"event": "celery_task_started", "enquiry_id": enquiry_id, "detail": "process_enquiry_task"},
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
        else:
            auto_escalate_enquiry(db=db, enquiry_id=enquiry_id)

        logger.info(
            "Celery task completed",
            extra={"event": "celery_task_completed", "enquiry_id": enquiry_id, "detail": "SOP processing done"},
        )
    except Exception as exc:
        logger.error(
            "Celery task failed",
            extra={"event": "celery_task_error", "enquiry_id": enquiry_id, "detail": str(exc)},
        )
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task(
    name="app.tasks.enquiry_tasks.send_followup_task",
    max_retries=3,
    default_retry_delay=60,
)
def send_followup_task(enquiry_id: str, message_template: str | None = None) -> None:
    """Celery task: dispatch a follow-up notification.

    Runs at the scheduled eta (delay_minutes after the API call).
    Currently logs the notification; wire up email/WhatsApp SDK here.

    Args:
        enquiry_id: UUID of the follow-up enquiry.
        message_template: Optional custom message body.
    """
    logger.info(
        "Follow-up notification dispatched",
        extra={
            "event": "followup_notification_sent",
            "enquiry_id": enquiry_id,
            "detail": message_template or "default template",
        },
    )
