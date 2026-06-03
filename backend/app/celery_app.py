"""Celery application instance.

Import this anywhere you need to dispatch tasks:
    from app.celery_app import celery_app
"""

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "closira",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.enquiry_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    # Retry failed tasks automatically (up to 3 times, 60s apart)
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)
