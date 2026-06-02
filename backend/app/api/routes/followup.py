"""Follow-up route.

POST /enquiry/{id}/followup — accepts delay_minutes (int, min 1) and
optional message_template. Validates enquiry exists and is open.

GET  /followups — returns all enquiries with status 'followed_up'.
"""

from datetime import timedelta

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.followup import (
    FollowUpListItem,
    FollowUpListResponse,
    FollowUpRequest,
    FollowUpResponse,
)
from app.services.enquiry_service import list_followups, schedule_followup

router = APIRouter(tags=["Follow-ups"])


@router.post(
    "/enquiry/{enquiry_id}/followup",
    response_model=FollowUpResponse,
    status_code=status.HTTP_200_OK,
    summary="Schedule a follow-up for an enquiry",
    description=(
        "Schedules a follow-up message for the specified enquiry. "
        "Requires delay_minutes (minimum 1) and an optional message_template. "
        "The enquiry must exist and be in an open state (not resolved)."
    ),
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "delay_minutes": 30,
                        "message_template": "Hi {customer_name}, just following up on your enquiry.",
                    }
                }
            }
        }
    },
)
def schedule_followup_endpoint(
    enquiry_id: str,
    body: FollowUpRequest,
    db: Session = Depends(get_db),
) -> FollowUpResponse:
    """Schedule a follow-up for an existing enquiry.

    Args:
        enquiry_id: UUID of the enquiry to follow up on.
        body: Validated request body with delay_minutes and optional template.
        db: Database session (injected).

    Returns:
        FollowUpResponse confirming the scheduled follow-up.
    """
    enquiry = schedule_followup(
        db=db,
        enquiry_id=enquiry_id,
        delay_minutes=body.delay_minutes,
        message_template=body.message_template,
    )

    return FollowUpResponse(
        enquiry_id=enquiry.id,
        status=enquiry.status,
        delay_minutes=body.delay_minutes,
        message=f"Follow-up scheduled in {body.delay_minutes} minutes.",
    )


@router.get(
    "/followups",
    response_model=FollowUpListResponse,
    summary="List all pending follow-ups",
    description=(
        "Returns all enquiries with status 'followed_up', shaped as FollowUp items. "
        "due_at is approximated as updated_at + 30 minutes."
    ),
)
def list_followups_endpoint(
    db: Session = Depends(get_db),
) -> FollowUpListResponse:
    """List all pending follow-ups.

    Args:
        db: Database session (injected).

    Returns:
        FollowUpListResponse with list of follow-up items.
    """
    enquiries = list_followups(db=db)
    items = [
        FollowUpListItem(
            id=e.id,
            enquiry_id=e.id,
            customer_name=e.customer_name,
            channel=e.channel,
            message_preview=e.message[:120] + ("…" if len(e.message) > 120 else ""),
            # Approximate due_at: updated_at (when followup was scheduled) + 30 min
            due_at=e.updated_at + timedelta(minutes=30),
            status="pending",
        )
        for e in enquiries
    ]
    return FollowUpListResponse(data=items, total=len(items))

