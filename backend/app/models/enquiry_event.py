"""EnquiryEvent ORM model.

Every status change writes a row to this table with a UTC timestamp.
This forms the status timeline returned by GET /enquiry/{id}/history.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EnquiryEvent(Base):
    """A single event in an enquiry's lifecycle timeline.

    Attributes:
        id: UUID4 primary key.
        enquiry_id: Foreign key to the parent enquiry.
        event_type: Type of event (created, sop_matched, qualified, escalated,
                    followup_scheduled, followup_sent, resolved).
        detail: JSON string with event-specific metadata.
        created_at: UTC timestamp when this event occurred.
    """

    __tablename__ = "enquiry_events"
    __table_args__ = (
        Index("idx_enquiry_events_enquiry_id", "enquiry_id"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    enquiry_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("enquiries.id"),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(30), nullable=False)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationship back to parent enquiry
    enquiry: Mapped["Enquiry"] = relationship(
        "Enquiry",
        back_populates="events",
    )

    def __repr__(self) -> str:
        """Return a developer-friendly string representation."""
        return f"<EnquiryEvent id={self.id} type={self.event_type}>"


# Import at bottom to avoid circular import
from app.models.enquiry import Enquiry  # noqa: E402, F811
