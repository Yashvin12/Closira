"""Escalation route.

POST /enquiry/{id}/escalate — accepts reason (required, non-empty).
Idempotent: escalating an already-escalated enquiry returns 409.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.escalation import EscalateRequest, EscalateResponse
from app.services.enquiry_service import escalate_enquiry

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
