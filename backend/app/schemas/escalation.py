"""Pydantic v2 schemas for the escalation endpoint.

POST /enquiry/{id}/escalate is idempotent — escalating an already-escalated
enquiry returns 409.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class EscalateRequest(BaseModel):
    """Request body for POST /enquiry/{id}/escalate.

    Attributes:
        reason: Required, non-empty reason for escalation.
    """

    reason: str = Field(
        ...,
        min_length=1,
        description="Reason for escalating this enquiry (required, non-empty)",
        examples=["Customer is a VIP account holder requesting immediate attention."],
    )


class EscalateResponse(BaseModel):
    """Response body for POST /enquiry/{id}/escalate.

    Attributes:
        enquiry_id: The escalated enquiry's identifier.
        status: Updated status (should be 'escalated').
        reason: The escalation reason that was recorded.
        message: Human-readable confirmation.
    """

    enquiry_id: str = Field(..., description="Enquiry identifier")
    status: str = Field(..., description="Updated enquiry status")
    reason: str = Field(..., description="Recorded escalation reason")
    message: str = Field(..., description="Human-readable confirmation")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "enquiry_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                    "status": "escalated",
                    "reason": "Customer is a VIP account holder requesting immediate attention.",
                    "message": "Enquiry escalated successfully.",
                }
            ]
        }
    }


class EscalationListItem(BaseModel):
    """A single escalation in GET /escalations — mirrors the frontend Escalation interface.

    Derived from an escalated Enquiry record. Urgency is inferred from
    escalation_reason keywords ('urgent', 'vip', 'critical' → high).
    """

    id: str
    enquiry_id: str
    channel: str
    customer_name: str
    reason: str
    urgency: str  # 'high' | 'medium'
    message_preview: str
    created_at: datetime

    model_config = {"from_attributes": False}


class EscalationListResponse(BaseModel):
    """Response body for GET /escalations."""

    data: list[EscalationListItem]
    total: int

