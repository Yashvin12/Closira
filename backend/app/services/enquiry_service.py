"""Enquiry business logic service.

All database operations and business rules for enquiries live here,
completely decoupled from FastAPI routes. Routes call these functions
and never touch SQLAlchemy directly.
"""

import json
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.enquiry import Enquiry
from app.models.enquiry_event import EnquiryEvent

logger = logging.getLogger("closira")


class NotFoundError(Exception):
    """Raised when an enquiry with the given ID does not exist."""

    def __init__(self, enquiry_id: str) -> None:
        self.enquiry_id = enquiry_id
        super().__init__(f"Enquiry {enquiry_id} not found")


class BusinessRuleError(Exception):
    """Raised when a business rule is violated (e.g., duplicate escalation)."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


def create_enquiry(
    db: Session,
    channel: str,
    customer_name: str,
    message: str,
) -> Enquiry:
    """Create a new enquiry record and log the 'created' event.

    Args:
        db: Active database session.
        channel: Communication channel (whatsapp, email, call).
        customer_name: Customer's full name.
        message: The enquiry message content.

    Returns:
        The newly created Enquiry ORM instance.
    """
    enquiry = Enquiry(
        channel=channel,
        customer_name=customer_name,
        message=message,
        status="new",
    )
    db.add(enquiry)
    db.flush()  # Populate the id before creating the event

    event = EnquiryEvent(
        enquiry_id=enquiry.id,
        event_type="created",
        detail=json.dumps({"channel": channel, "customer_name": customer_name}),
    )
    db.add(event)
    db.commit()
    db.refresh(enquiry)

    logger.info(
        "Enquiry created",
        extra={
            "event": "enquiry_created",
            "enquiry_id": enquiry.id,
            "detail": f"Channel: {channel}, Customer: {customer_name}",
        },
    )

    return enquiry


def get_enquiry_or_raise(db: Session, enquiry_id: str) -> Enquiry:
    """Fetch an enquiry by ID or raise NotFoundError.

    Args:
        db: Active database session.
        enquiry_id: The UUID of the enquiry to fetch.

    Returns:
        The Enquiry ORM instance.

    Raises:
        NotFoundError: If no enquiry with the given ID exists.
    """
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise NotFoundError(enquiry_id)
    return enquiry


def escalate_enquiry(
    db: Session,
    enquiry_id: str,
    reason: str,
) -> Enquiry:
    """Escalate an enquiry. Idempotent — returns 409 if already escalated.

    Args:
        db: Active database session.
        enquiry_id: The UUID of the enquiry to escalate.
        reason: The reason for escalation.

    Returns:
        The updated Enquiry ORM instance.

    Raises:
        NotFoundError: If the enquiry does not exist.
        BusinessRuleError: If the enquiry is already escalated.
    """
    enquiry = get_enquiry_or_raise(db, enquiry_id)

    if enquiry.status == "escalated":
        raise BusinessRuleError(
            f"Enquiry {enquiry_id} is already escalated. "
            f"Current reason: {enquiry.escalation_reason}"
        )

    enquiry.status = "escalated"
    enquiry.escalation_reason = reason
    enquiry.updated_at = datetime.now(timezone.utc)

    event = EnquiryEvent(
        enquiry_id=enquiry.id,
        event_type="escalated",
        detail=json.dumps({"reason": reason}),
    )
    db.add(event)
    db.commit()
    db.refresh(enquiry)

    logger.info(
        "Enquiry escalated",
        extra={
            "event": "enquiry_escalated",
            "enquiry_id": enquiry.id,
            "detail": f"Reason: {reason}",
        },
    )

    return enquiry


def schedule_followup(
    db: Session,
    enquiry_id: str,
    delay_minutes: int,
    message_template: str | None,
) -> Enquiry:
    """Schedule a follow-up for an enquiry.

    Validates that the enquiry exists and is in an open state
    (new, qualified — not resolved or already escalated without resolution).

    Args:
        db: Active database session.
        enquiry_id: The UUID of the enquiry.
        delay_minutes: Minutes to wait before sending follow-up.
        message_template: Optional custom message template.

    Returns:
        The updated Enquiry ORM instance.

    Raises:
        NotFoundError: If the enquiry does not exist.
        BusinessRuleError: If the enquiry is not in an open state.
    """
    enquiry = get_enquiry_or_raise(db, enquiry_id)

    closed_statuses = {"resolved"}
    if enquiry.status in closed_statuses:
        raise BusinessRuleError(
            f"Cannot schedule follow-up for enquiry {enquiry_id} — "
            f"status is '{enquiry.status}'. Only open enquiries accept follow-ups."
        )

    enquiry.status = "followed_up"
    enquiry.updated_at = datetime.now(timezone.utc)

    detail_payload = {"delay_minutes": delay_minutes}
    if message_template:
        detail_payload["message_template"] = message_template

    event = EnquiryEvent(
        enquiry_id=enquiry.id,
        event_type="followup_scheduled",
        detail=json.dumps(detail_payload),
    )
    db.add(event)
    db.commit()
    db.refresh(enquiry)

    logger.info(
        "Follow-up scheduled",
        extra={
            "event": "followup_scheduled",
            "enquiry_id": enquiry.id,
            "detail": f"Delay: {delay_minutes}min, Template: {message_template or 'default'}",
        },
    )

    return enquiry


def get_enquiry_history(
    db: Session,
    enquiry_id: str,
) -> dict[str, Enquiry | list[EnquiryEvent]]:
    """Get full enquiry details with timeline events.

    Args:
        db: Active database session.
        enquiry_id: The UUID of the enquiry.

    Returns:
        Dict with 'enquiry' (Enquiry) and 'timeline' (list of EnquiryEvent).

    Raises:
        NotFoundError: If the enquiry does not exist.
    """
    enquiry = get_enquiry_or_raise(db, enquiry_id)

    events = (
        db.query(EnquiryEvent)
        .filter(EnquiryEvent.enquiry_id == enquiry_id)
        .order_by(EnquiryEvent.created_at)
        .all()
    )

    return {"enquiry": enquiry, "timeline": events}


def update_enquiry_from_sop(
    db: Session,
    enquiry_id: str,
    sop_name: str,
    suggested_response: str,
) -> Enquiry:
    """Update an enquiry after successful SOP matching.

    Sets the sop_matched, suggested_response, and advances status to 'qualified'.

    Args:
        db: Active database session.
        enquiry_id: The UUID of the enquiry.
        sop_name: Name of the matched SOP.
        suggested_response: The SOP's suggested response text.

    Returns:
        The updated Enquiry ORM instance.

    Raises:
        NotFoundError: If the enquiry does not exist.
    """
    enquiry = get_enquiry_or_raise(db, enquiry_id)

    enquiry.sop_matched = sop_name
    enquiry.suggested_response = suggested_response
    enquiry.status = "qualified"
    enquiry.updated_at = datetime.now(timezone.utc)

    # Write sop_matched event
    sop_event = EnquiryEvent(
        enquiry_id=enquiry.id,
        event_type="sop_matched",
        detail=json.dumps({"sop_name": sop_name}),
    )
    db.add(sop_event)

    # Write qualified event
    qualified_event = EnquiryEvent(
        enquiry_id=enquiry.id,
        event_type="qualified",
        detail=json.dumps({"sop": sop_name, "suggested_response": suggested_response[:100]}),
    )
    db.add(qualified_event)

    db.commit()
    db.refresh(enquiry)

    logger.info(
        "Enquiry qualified via SOP",
        extra={
            "event": "enquiry_qualified",
            "enquiry_id": enquiry.id,
            "detail": f"SOP: {sop_name}",
        },
    )

    return enquiry


def auto_escalate_enquiry(
    db: Session,
    enquiry_id: str,
) -> Enquiry:
    """Auto-escalate an enquiry when no SOP matches.

    Args:
        db: Active database session.
        enquiry_id: The UUID of the enquiry.

    Returns:
        The updated Enquiry ORM instance.

    Raises:
        NotFoundError: If the enquiry does not exist.
    """
    reason = "No SOP matched — requires manual review"
    enquiry = get_enquiry_or_raise(db, enquiry_id)

    enquiry.status = "escalated"
    enquiry.escalation_reason = reason
    enquiry.updated_at = datetime.now(timezone.utc)

    event = EnquiryEvent(
        enquiry_id=enquiry.id,
        event_type="escalated",
        detail=json.dumps({"reason": reason, "auto": True}),
    )
    db.add(event)
    db.commit()
    db.refresh(enquiry)

    logger.warning(
        "Enquiry auto-escalated (no SOP match)",
        extra={
            "event": "enquiry_auto_escalated",
            "enquiry_id": enquiry.id,
            "detail": reason,
        },
    )

    return enquiry
