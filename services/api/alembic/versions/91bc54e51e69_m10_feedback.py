"""m10 feedback — in-app problem reports and ideas

Revision ID: 91bc54e51e69
Revises: fa6e904e1821
Create Date: 2026-09-26 15:59:16.811136

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '91bc54e51e69'
down_revision: str | Sequence[str] | None = 'fa6e904e1821'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('feedback',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('category', sa.String(length=20), nullable=False),
    sa.Column('message', sa.String(length=2000), nullable=False),
    sa.Column('app_version', sa.String(length=40), nullable=True),
    sa.Column('platform', sa.String(length=40), nullable=True),
    sa.Column('request_id', sa.String(length=80), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_feedback_created', 'feedback', ['created_at'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_feedback_created', table_name='feedback')
    op.drop_table('feedback')
