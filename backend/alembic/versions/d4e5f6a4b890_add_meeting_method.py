"""add bookings.meeting_method (online/offline)

Revision ID: d4e5f6a7b890
Revises: c9d2e7a4b516
Create Date: 2026-10-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a4b890'
down_revision: Union[str, Sequence[str], None] = 'c9d2e7a4b516'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_MEETING_ENUM = sa.Enum('online', 'offline', name='meeting_method')


def upgrade() -> None:
    _MEETING_ENUM.create(op.get_bind(), checkfirst=True)
    op.add_column(
        'bookings',
        sa.Column(
            'meeting_method',
            _MEETING_ENUM,
            nullable=False,
            server_default='online',
        ),
    )


def downgrade() -> None:
    op.drop_column('bookings', 'meeting_method')
    _MEETING_ENUM.drop(op.get_bind(), checkfirst=True)
