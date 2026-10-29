"""add query indexes

Revision ID: a7f3c1e9b204
Revises: c41f8e2a9d07
Create Date: 2026-10-03

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a7f3c1e9b204'
down_revision: Union[str, Sequence[str], None] = 'c41f8e2a9d07'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add indexes for the availability lookup and admin list sort orders."""
    # Hot path: GET /api/bookings/availability and the create-time race guard
    # both filter bookings by (appointment_date, status).
    op.create_index(
        'ix_bookings_date_status',
        'bookings',
        ['appointment_date', 'status'],
        unique=False,
    )
    op.create_index('ix_services_is_active', 'services', ['is_active'], unique=False)
    op.create_index('ix_bookings_created_at', 'bookings', ['created_at'], unique=False)
    op.create_index(
        'ix_idol_applications_created_at',
        'idol_applications',
        ['created_at'],
        unique=False,
    )
    op.create_index(
        'ix_contact_messages_created_at',
        'contact_messages',
        ['created_at'],
        unique=False,
    )


def downgrade() -> None:
    """Drop the query indexes."""
    op.drop_index('ix_contact_messages_created_at', table_name='contact_messages')
    op.drop_index('ix_idol_applications_created_at', table_name='idol_applications')
    op.drop_index('ix_bookings_created_at', table_name='bookings')
    op.drop_index('ix_services_is_active', table_name='services')
    op.drop_index('ix_bookings_date_status', table_name='bookings')