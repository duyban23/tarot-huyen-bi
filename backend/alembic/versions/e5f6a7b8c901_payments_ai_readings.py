"""payments + ai_readings tables

Revision ID: e5f6a7b8c901
Revises: d4e5f6a4b890
Create Date: 2026-10-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c901'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a4b890'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # KHÔNG dùng sa.Enum ở đây: op.create_table luôn emit CREATE TYPE kể cả
    # khi type đã tồn tại (lỗi DuplicateObject). Model vẫn khai báo Enum —
    # đọc/ghi string qua lại bình thường trên PG.
    op.create_table(
        'payments',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('code', sa.String(32), nullable=False, unique=True),
        sa.Column('service_type', sa.String(50), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False,
                  server_default='pending'),
        sa.Column('sepay_tx_id', sa.String(100), nullable=True, unique=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_payments_code', 'payments', ['code'], unique=True)
    op.create_index('ix_payments_status', 'payments', ['status'], unique=False)
    op.create_table(
        'ai_readings',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('service_type', sa.String(50), nullable=False),
        sa.Column('input_json', sa.Text(), nullable=False),
        sa.Column('input_hash', sa.String(64), nullable=False),
        sa.Column('computed_json', sa.Text(), nullable=False),
        sa.Column('basic_result', sa.Text(), nullable=False),
        sa.Column('full_result', sa.Text(), nullable=True),
        sa.Column('payment_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_ai_readings_service', 'ai_readings', ['service_type'], unique=False)
    op.create_index('ix_ai_readings_input_hash', 'ai_readings', ['input_hash'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_ai_readings_input_hash', table_name='ai_readings')
    op.drop_index('ix_ai_readings_service', table_name='ai_readings')
    op.drop_table('ai_readings')
    op.drop_index('ix_payments_status', table_name='payments')
    op.drop_index('ix_payments_code', table_name='payments')
    op.drop_table('payments')
