"""Follow-up route.

POST /enquiry/{id}/followup — accepts delay_minutes (int, min 1) and
optional message_template. Validates enquiry exists and is open.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.followup import FollowUpRequest, FollowUpResponse
from app.services.enquiry_service import schedule_followup

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
