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
    bind = op.get_bind()
    _MEETING_ENUM.create(bind, checkfirst=True)
    # DB prod từng được vá tay / tự vá ở startup (main._heal_bookings_schema)
    # nên cột có thể đã tồn tại — kiểm tra trước để migration vẫn chạy được.
    columns = {c["name"] for c in sa.inspect(bind).get_columns("bookings")}
    if "meeting_method" in columns:
        return
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
