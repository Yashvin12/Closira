"""Enquiry routes — create and history.

POST /enquiry — accepts channel, customer_name, message. Returns job_id
instantly and fires a background task for SOP matching. Never blocks.

GET /enquiry/{id}/history — returns full message thread + status timeline.
"""

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.enquiry import (
    EnquiryCreate,
    EnquiryDetail,
    EnquiryEventResponse,
    EnquiryHistoryResponse,
    EnquiryResponse,
)
from app.services.enquiry_service import create_enquiry, get_enquiry_history
from app.workers.enquiry_processor import process_enquiry

router = APIRouter(tags=["Enquiries"])


@router.post(
    "/enquiry",
    response_model=EnquiryResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Create a new enquiry",
    description=(
        "Accepts a customer enquiry with channel, name, and message. "
        "Returns a job_id immediately and fires a background task for "
        "SOP matching. The endpoint never blocks — processing happens "
        "asynchronously via FastAPI BackgroundTasks."
    ),
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "channel": "whatsapp",
                        "customer_name": "Sarah Mitchell",
                        "message": "Hi, I'd like to know about your pricing plans for the enterprise tier.",
                    }
                }
            }
        }
    },
)
def create_enquiry_endpoint(
    body: EnquiryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> EnquiryResponse:
    """Create a new enquiry and fire background SOP matching.

    Args:
        body: Validated request body with channel, customer_name, message.
        background_tasks: FastAPI background task queue.
        db: Database session (injected).

    Returns:
        EnquiryResponse with the job_id and current status.
    """
    enquiry = create_enquiry(
        db=db,
        channel=body.channel.value,
        customer_name=body.customer_name,
        message=body.message,
    )

    # Fire-and-forget background task
    background_tasks.add_task(process_enquiry, enquiry.id)

    return EnquiryResponse(
        job_id=enquiry.id,
        status=enquiry.status,
        message="Enquiry received. Processing in background.",
    )


@router.get(
    "/enquiry/{enquiry_id}/history",
    response_model=EnquiryHistoryResponse,
    summary="Get enquiry history and timeline",
    description=(
        "Returns the full enquiry record plus a structured timeline of "
        "all lifecycle events (created, qualified, escalated, follow-up, etc.) "
        "with UTC timestamps. This is the complete audit trail."
    ),
    openapi_extra={
        "parameters": [
            {
                "name": "enquiry_id",
                "in": "path",
                "description": "UUID of the enquiry",
                "required": True,
                "schema": {"type": "string", "format": "uuid"},
                "example": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            }
        ]
    },
)
def get_history_endpoint(
    enquiry_id: str,
    db: Session = Depends(get_db),
) -> EnquiryHistoryResponse:
    """Fetch full enquiry details with ordered timeline events.

    Args:
        enquiry_id: UUID of the enquiry to look up.
        db: Database session (injected).

    Returns:
        EnquiryHistoryResponse with enquiry details and timeline.
    """
    result = get_enquiry_history(db=db, enquiry_id=enquiry_id)

    enquiry = result["enquiry"]
    timeline = result["timeline"]

    return EnquiryHistoryResponse(
        enquiry=EnquiryDetail(
            id=enquiry.id,
            channel=enquiry.channel,
            customer_name=enquiry.customer_name,
            message=enquiry.message,
            status=enquiry.status,
            sop_matched=enquiry.sop_matched,
            suggested_response=enquiry.suggested_response,
            escalation_reason=enquiry.escalation_reason,
            created_at=enquiry.created_at,
            updated_at=enquiry.updated_at,
        ),
        timeline=[
            EnquiryEventResponse(
                id=event.id,
                event_type=event.event_type,
                detail=event.detail,
                created_at=event.created_at,
            )
            for event in timeline
        ],
    )
