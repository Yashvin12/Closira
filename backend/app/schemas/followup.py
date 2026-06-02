"""Pydantic v2 schemas for the follow-up endpoint.

POST /enquiry/{id}/followup accepts a delay and optional message template.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class FollowUpRequest(BaseModel):
    """Request body for POST /enquiry/{id}/followup.

    Attributes:
        delay_minutes: Minutes to wait before sending follow-up (min 1).
        message_template: Optional custom message template for the follow-up.
    """

    delay_minutes: int = Field(
        ...,
        ge=1,
        description="Minutes to wait before sending the follow-up (minimum 1)",
        examples=[30],
    )
    message_template: str | None = Field(
        default=None,
        description="Optional custom message template for the follow-up",
        examples=["Hi {customer_name}, just following up on your enquiry about {topic}."],
    )


class FollowUpResponse(BaseModel):
    """Response body for POST /enquiry/{id}/followup.

    Attributes:
        enquiry_id: The enquiry this follow-up is scheduled for.
        status: Updated enquiry status.
        delay_minutes: Confirmed delay in minutes.
        message: Human-readable confirmation.
    """

    enquiry_id: str = Field(..., description="Enquiry identifier")
    status: str = Field(..., description="Updated enquiry status")
    delay_minutes: int = Field(..., description="Confirmed delay in minutes")
    message: str = Field(..., description="Human-readable confirmation")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "enquiry_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                    "status": "followed_up",
                    "delay_minutes": 30,
                    "message": "Follow-up scheduled in 30 minutes.",
                }
            ]
        }
    }


class FollowUpListItem(BaseModel):
    """A single follow-up in GET /followups — mirrors the frontend FollowUp interface.

    Derived from a followed_up Enquiry record. due_at is approximated as
    updated_at + 30 minutes since the actual delay isn't persisted separately.
    """

    id: str
    enquiry_id: str
    customer_name: str
    channel: str
    message_preview: str
    due_at: datetime
    status: str  # 'pending' | 'done'

    model_config = {"from_attributes": False}


class FollowUpListResponse(BaseModel):
    """Response body for GET /followups."""

    data: list[FollowUpListItem]
    total: int

