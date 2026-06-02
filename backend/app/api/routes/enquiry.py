"""Enquiry routes — create, list, history, resolve, and complete.

POST /enquiry              — accepts channel, customer_name, message.
                              Runs SOP matching synchronously and returns
                              the fully processed enquiry (201 Created).
GET  /enquiries            — returns all enquiries, newest first.
                              Supports optional ?status= filter.
GET  /enquiry/{id}/history — returns full message thread + status timeline.
POST /enquiry/{id}/resolve — marks an escalated enquiry as resolved.
POST /enquiry/{id}/complete-followup — marks a follow-up as completed.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.enquiry import (
    EnquiryCreate,
    EnquiryDetail,
    EnquiryEventResponse,
    EnquiryHistoryResponse,
    EnquiryListItem,
    EnquiryListResponse,
    EnquiryResponse,
)
from app.services import sop_matcher
from app.services.enquiry_service import (
    auto_escalate_enquiry,
    create_enquiry,
    get_enquiry_history,
    list_enquiries,
    resolve_enquiry,
    complete_followup,
    update_enquiry_from_sop,
)

router = APIRouter(tags=["Enquiries"])



@router.post(
    "/enquiry",
    response_model=EnquiryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new enquiry",
    description=(
        "Accepts a customer enquiry with channel, name, and message. "
        "Runs SOP matching synchronously and returns the fully processed "
        "enquiry with sop_matched, suggested_response, and final status."
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
    db: Session = Depends(get_db),
) -> EnquiryResponse:
    """Create a new enquiry with synchronous SOP matching.

    SOP matching is a sub-millisecond keyword check — no need for async.
    Running it synchronously eliminates the race condition where the
    frontend polls before the background task completes.

    Args:
        body: Validated request body with channel, customer_name, message.
        db: Database session (injected).

    Returns:
        EnquiryResponse with the enquiry_id, final status, and SOP data.
    """
    enquiry = create_enquiry(
        db=db,
        channel=body.channel.value,
        customer_name=body.customer_name,
        message=body.message,
    )

    # Synchronous SOP matching — sub-ms keyword check
    result = sop_matcher.match(body.message, enquiry_id=enquiry.id)

    if result is not None:
        enquiry = update_enquiry_from_sop(
            db=db,
            enquiry_id=enquiry.id,
            sop_name=result["name"],
            suggested_response=result["suggested_response"],
        )
    else:
        enquiry = auto_escalate_enquiry(db=db, enquiry_id=enquiry.id)

    return EnquiryResponse(
        enquiry_id=enquiry.id,
        status=enquiry.status,
        sop_matched=enquiry.sop_matched,
        suggested_response=enquiry.suggested_response,
        message=(
            f"Enquiry processed — matched SOP: {enquiry.sop_matched}"
            if enquiry.sop_matched
            else "Enquiry processed — no SOP match, escalated for review."
        ),
    )


@router.get(
    "/enquiries",
    response_model=EnquiryListResponse,
    summary="List all enquiries",
    description=(
        "Returns all enquiries ordered by creation date (newest first). "
        "Optionally filter by status: new, qualified, escalated, followed_up, resolved."
    ),
)
def list_enquiries_endpoint(
    status: Optional[str] = Query(
        default=None,
        description="Filter by enquiry status",
        examples=["escalated"],
    ),
    db: Session = Depends(get_db),
) -> EnquiryListResponse:
    """List all enquiries with optional status filter.

    Args:
        status: Optional status string to filter results.
        db: Database session (injected).

    Returns:
        EnquiryListResponse with list of enquiry items and total count.
    """
    enquiries = list_enquiries(db=db, status_filter=status)
    items = [
        EnquiryListItem(
            id=e.id,
            channel=e.channel,
            customer_name=e.customer_name,
            message=e.message,
            status=e.status,
            sop_matched=e.sop_matched,
            suggested_response=e.suggested_response,
            ai_summary=None,  # Not persisted — generated at processing time
            escalation_reason=e.escalation_reason,
            created_at=e.created_at,
            updated_at=e.updated_at,
        )
        for e in enquiries
    ]
    return EnquiryListResponse(data=items, total=len(items))

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


@router.post(
    "/enquiry/{enquiry_id}/resolve",
    response_model=EnquiryDetail,
    summary="Resolve an escalated enquiry",
    description=(
        "Marks an escalated enquiry as resolved. The enquiry must exist "
        "and be in 'escalated' status."
    ),
)
def resolve_enquiry_endpoint(
    enquiry_id: str,
    db: Session = Depends(get_db),
) -> EnquiryDetail:
    """Resolve an escalated enquiry.

    Args:
        enquiry_id: UUID of the enquiry to resolve.
        db: Database session (injected).

    Returns:
        EnquiryDetail with updated status.
    """
    enquiry = resolve_enquiry(db=db, enquiry_id=enquiry_id)

    return EnquiryDetail(
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
    )


@router.post(
    "/enquiry/{enquiry_id}/complete-followup",
    response_model=EnquiryDetail,
    summary="Complete a follow-up",
    description=(
        "Marks a follow-up enquiry as resolved/completed. The enquiry "
        "must exist and be in 'followed_up' status."
    ),
)
def complete_followup_endpoint(
    enquiry_id: str,
    db: Session = Depends(get_db),
) -> EnquiryDetail:
    """Complete a pending follow-up.

    Args:
        enquiry_id: UUID of the enquiry to complete.
        db: Database session (injected).

    Returns:
        EnquiryDetail with updated status.
    """
    enquiry = complete_followup(db=db, enquiry_id=enquiry_id)

    return EnquiryDetail(
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
    )
