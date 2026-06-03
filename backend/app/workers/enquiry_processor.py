"""Background enquiry processor — now delegates to Celery tasks.

Kept for backward compatibility with any test code that calls process_enquiry directly.
In production, tasks are dispatched via Celery from the route layer.
"""

import logging

logger = logging.getLogger("closira")


def process_enquiry(enquiry_id: str) -> None:
    """Dispatch enquiry processing to the Celery task queue.

    Args:
        enquiry_id: The UUID of the enquiry to process.
    """
    from app.tasks.enquiry_tasks import process_enquiry_task

    process_enquiry_task.delay(enquiry_id)
    logger.info(
        "Enquiry dispatched to Celery",
        extra={
            "event": "enquiry_dispatched",
            "enquiry_id": enquiry_id,
            "detail": "process_enquiry_task queued",
        },
    )
