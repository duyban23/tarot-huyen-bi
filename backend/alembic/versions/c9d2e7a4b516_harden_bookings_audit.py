"""harden bookings + audit timestamps

Revision ID: c9d2e7a4b516
Revises: a7f3c1e9b204
Create Date: 2026-10-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9d2e7a4b516'
down_revision: Union[str, Sequence[str], None] = 'a7f3c1e9b204'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SLOT_PREDICATE = sa.text("status <> 'cancelled'")


def upgrade() -> None:
    """Timestamptz audit columns, anti-double-booking guard, FK/status indexes."""
    is_pg = op.get_bind().dialect.name == "postgresql"

    # 1. Naive timestamps inherit the server's local timezone. Existing rows
    # were written by UTC servers, so interpret them as UTC on conversion.
    # (All three tables are empty in practice; this is belt and suspenders.)
    for table in ("bookings", "idol_applications", "contact_messages"):
        if is_pg:
            op.execute(sa.text(
                f"ALTER TABLE {table} ALTER COLUMN created_at "
                f"TYPE timestamptz USING created_at AT TIME ZONE 'UTC'"
            ))

    # 2. DB-level backstop for the app-level availability guard: two
    # concurrent POSTs can both pass the SELECT check, so the database must
    # reject the loser. Cancelled bookings are excluded so a freed slot is
    # bookable again. Exact-match only — overlapping intervals of different
    # lengths remain the app guard's job.
    op.create_index(
        "bookings_slot_uniq",
        "bookings",
        ["appointment_date", "appointment_time"],
        unique=True,
        postgresql_where=_SLOT_PREDICATE,
        sqlite_where=_SLOT_PREDICATE,
    )

    # 3. FK join (availability joinedload) + admin status filters.
    op.create_index("ix_bookings_service_id", "bookings", ["service_id"],
                    unique=False)
    op.create_index("ix_bookings_status", "bookings", ["status"], unique=False)
    op.create_index("ix_idol_applications_status", "idol_applications",
                    ["status"], unique=False)

    # 4. Document the VND-integer convention where future DBAs will look.
    if is_pg:
        op.execute(sa.text(
            "COMMENT ON COLUMN services.price IS "
            "'Price in VND (integer, no subunit)'"
        ))


def downgrade() -> None:
    """Drop what upgrade added, restore naive timestamps."""
    is_pg = op.get_bind().dialect.name == "postgresql"

    if is_pg:
        op.execute(sa.text("COMMENT ON COLUMN services.price IS NULL"))

    op.drop_index("ix_idol_applications_status",
                  table_name="idol_applications")
    op.drop_index("ix_bookings_status", table_name="bookings")
    op.drop_index("ix_bookings_service_id", table_name="bookings")
    op.drop_index("bookings_slot_uniq", table_name="bookings")

    for table in ("bookings", "idol_applications", "contact_messages"):
        if is_pg:
            op.execute(sa.text(
                f"ALTER TABLE {table} ALTER COLUMN created_at "
                f"TYPE timestamp WITHOUT TIME ZONE"
            ))
