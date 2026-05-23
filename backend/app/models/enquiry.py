"""Enquiry ORM model.

Represents a customer enquiry received via whatsapp, email, or call.
Tracks the full lifecycle from creation through qualification/escalation.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Enquiry(Base):
    """A customer enquiry record.

    Attributes:
        id: UUID4 primary key.
        channel: Communication channel (whatsapp, email, call).
        customer_name: Name of the customer who submitted the enquiry.
        message: The original message content.
        status: Current lifecycle status (new, qualified, escalated, followed_up, resolved).
        sop_matched: Name of the matched SOP procedure, if any.
        suggested_response: AI-generated response based on the matched SOP.
        escalation_reason: Reason provided when the enquiry was escalated.
        created_at: UTC timestamp when the enquiry was created.
        updated_at: UTC timestamp of the last modification.
    """

    __tablename__ = "enquiries"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="new",
    )
    sop_matched: Mapped[str | None] = mapped_column(String(255), nullable=True)
    suggested_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    escalation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationship to timeline events
    events: Mapped[list["EnquiryEvent"]] = relationship(
        "EnquiryEvent",
        back_populates="enquiry",
        order_by="EnquiryEvent.created_at",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        """Return a developer-friendly string representation."""
        return f"<Enquiry id={self.id} channel={self.channel} status={self.status}>"


# Import at bottom to avoid circular import
from app.models.enquiry_event import EnquiryEvent  # noqa: E402, F811
