"""Escalation route.

POST /enquiry/{id}/escalate — accepts reason (required, non-empty).
Idempotent: escalating an already-escalated enquiry returns 409.

GET  /escalations — returns all currently escalated enquiries.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.escalation import (
    EscalateRequest,
    EscalateResponse,
    EscalationListItem,
    EscalationListResponse,
)
from app.services.enquiry_service import escalate_enquiry, list_escalations

router = APIRouter(tags=["Escalations"])



@router.post(
    "/enquiry/{enquiry_id}/escalate",
    response_model=EscalateResponse,
    status_code=status.HTTP_200_OK,
    summary="Escalate an enquiry",
    description=(
        "Escalates the specified enquiry with a required reason. "
        "This operation is idempotent — attempting to escalate an "
        "already-escalated enquiry returns HTTP 409 Conflict with "
        "a clear message indicating the current escalation reason."
    ),
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "reason": "Customer is a VIP account holder requesting immediate attention."
                    }
                }
            }
        }
    },
)
def escalate_enquiry_endpoint(
    enquiry_id: str,
    body: EscalateRequest,
    db: Session = Depends(get_db),
) -> EscalateResponse:
    """Escalate an enquiry with a required reason.

    Args:
        enquiry_id: UUID of the enquiry to escalate.
        body: Validated request body with the escalation reason.
        db: Database session (injected).

    Returns:
        EscalateResponse confirming the escalation.
    """
    enquiry = escalate_enquiry(
        db=db,
        enquiry_id=enquiry_id,
        reason=body.reason,
    )

    return EscalateResponse(
        enquiry_id=enquiry.id,
        status=enquiry.status,
        reason=body.reason,
        message="Enquiry escalated successfully.",
    )


@router.get(
    "/escalations",
    response_model=EscalationListResponse,
    summary="List all active escalations",
    description=(
        "Returns all enquiries with status 'escalated', shaped as Escalation items. "
        "Urgency is inferred from the escalation_reason text: "
        "'urgent', 'vip', 'critical', 'asap', or 'immediate' keywords → high; otherwise medium."
    ),
)
def list_escalations_endpoint(
    db: Session = Depends(get_db),
) -> EscalationListResponse:
    """List all active escalations.

    Args:
        db: Database session (injected).

    Returns:
        EscalationListResponse with list of escalation items.
    """
    _HIGH_KEYWORDS = {"urgent", "vip", "critical", "asap", "immediate", "priority"}

    enquiries = list_escalations(db=db)
    items = [
        EscalationListItem(
            id=f"esc-{e.id}",
            enquiry_id=e.id,
            channel=e.channel,
            customer_name=e.customer_name,
            reason=e.escalation_reason or "Manual escalation",
            urgency=(
                "high"
                if any(kw in (e.escalation_reason or "").lower() for kw in _HIGH_KEYWORDS)
                else "medium"
            ),
            message_preview=e.message[:120] + ("…" if len(e.message) > 120 else ""),
            created_at=e.created_at,
        )
        for e in enquiries
    ]
    return EscalationListResponse(data=items, total=len(items))

