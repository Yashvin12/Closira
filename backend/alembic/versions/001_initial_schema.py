"""Initial schema migration — creates enquiries, enquiry_events, and users tables."""

import sqlalchemy as sa
from alembic import op

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "enquiries",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("channel", sa.String(20), nullable=False),
        sa.Column("customer_name", sa.String(255), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="new"),
        sa.Column("sop_matched", sa.String(255), nullable=True),
        sa.Column("suggested_response", sa.Text, nullable=True),
        sa.Column("escalation_reason", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )

    op.create_table(
        "enquiry_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "enquiry_id",
            sa.String(36),
            sa.ForeignKey("enquiries.id"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(30), nullable=False),
        sa.Column("detail", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )
    op.create_index(
        "idx_enquiry_events_enquiry_id", "enquiry_events", ["enquiry_id"]
    )


def downgrade() -> None:
    op.drop_index("idx_enquiry_events_enquiry_id", table_name="enquiry_events")
    op.drop_table("enquiry_events")
    op.drop_table("enquiries")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
