"""Pydantic v2 schemas for enquiry endpoints.

Defines request bodies, response models, and the history/timeline structure
returned by GET /enquiry/{id}/history.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class ChannelEnum(str, Enum):
    """Supported communication channels."""

    WHATSAPP = "whatsapp"
    EMAIL = "email"
    CALL = "call"


class EnquiryCreate(BaseModel):
    """Request body for POST /enquiry.

    Attributes:
        channel: Communication channel (whatsapp, email, or call).
        customer_name: Full name of the customer.
        message: The enquiry message content.
    """

    channel: ChannelEnum = Field(
        ...,
        description="Communication channel: whatsapp, email, or call",
        examples=["whatsapp"],
    )
    customer_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Full name of the customer",
        examples=["Sarah Mitchell"],
    )
    message: str = Field(
        ...,
        min_length=1,
        description="The enquiry message content",
        examples=["Hi, I'd like to know about your pricing plans for the enterprise tier."],
    )


class EnquiryResponse(BaseModel):
    """Response body for POST /enquiry (202 Accepted).

    Attributes:
        job_id: The unique identifier for the created enquiry / background job.
        status: Current status of the enquiry.
        message: Human-readable confirmation message.
    """

    job_id: str = Field(..., description="Unique enquiry/job identifier (UUID)")
    status: str = Field(..., description="Current enquiry status")
    message: str = Field(..., description="Human-readable confirmation")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "job_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                    "status": "new",
                    "message": "Enquiry received. Processing in background.",
                }
            ]
        }
    }


class EnquiryEventResponse(BaseModel):
    """A single event in the enquiry timeline.

    Attributes:
        id: Unique event identifier.
        event_type: Type of lifecycle event.
        detail: Event-specific metadata (JSON string or null).
        created_at: UTC timestamp of the event.
    """

    id: str
    event_type: str
    detail: str | None
    created_at: datetime


class EnquiryDetail(BaseModel):
    """Full enquiry record with all fields.

    Attributes:
        id: Unique enquiry identifier.
        channel: Communication channel.
        customer_name: Customer's full name.
        message: Original message content.
        status: Current lifecycle status.
        sop_matched: Name of the matched SOP, if any.
        suggested_response: AI-generated response, if any.
        escalation_reason: Escalation reason, if applicable.
        created_at: UTC creation timestamp.
        updated_at: UTC last-modified timestamp.
    """

    id: str
    channel: str
    customer_name: str
    message: str
    status: str
    sop_matched: str | None
    suggested_response: str | None
    escalation_reason: str | None
    created_at: datetime
    updated_at: datetime


class EnquiryHistoryResponse(BaseModel):
    """Response body for GET /enquiry/{id}/history.

    Contains the full enquiry record plus a structured timeline of events.

    Attributes:
        enquiry: The full enquiry details.
        timeline: Ordered list of lifecycle events.
    """

    enquiry: EnquiryDetail
    timeline: list[EnquiryEventResponse]

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "enquiry": {
                        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                        "channel": "whatsapp",
                        "customer_name": "Sarah Mitchell",
                        "message": "What are your pricing plans?",
                        "status": "qualified",
                        "sop_matched": "Pricing Inquiry",
                        "suggested_response": "Thank you for your interest! Our pricing starts at $99/month...",
                        "escalation_reason": None,
                        "created_at": "2025-01-15T10:30:00Z",
                        "updated_at": "2025-01-15T10:30:01Z",
                    },
                    "timeline": [
                        {
                            "id": "evt-001",
                            "event_type": "created",
                            "detail": '{"channel": "whatsapp"}',
                            "created_at": "2025-01-15T10:30:00Z",
                        },
                        {
                            "id": "evt-002",
                            "event_type": "qualified",
                            "detail": '{"sop": "Pricing Inquiry"}',
                            "created_at": "2025-01-15T10:30:01Z",
                        },
                    ],
                }
            ]
        }
    }
