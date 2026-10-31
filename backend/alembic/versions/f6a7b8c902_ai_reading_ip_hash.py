"""add ai_readings.client_ip_hash for distributed free quota

Revision ID: f6a7b8c902
Revises: e5f6a7b8c901
Create Date: 2026-10-31

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f6a7b8c902'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c901'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'ai_readings',
        sa.Column('client_ip_hash', sa.String(64), nullable=True),
    )
    op.create_index(
        'ix_ai_readings_quota',
        'ai_readings',
        ['client_ip_hash', 'service_type', 'created_at'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index('ix_ai_readings_quota', table_name='ai_readings')
    op.drop_column('ai_readings', 'client_ip_hash')
