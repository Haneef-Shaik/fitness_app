"""m16 rate limit counters (launch)

A fixed-window counter per bucket, shared by every API instance: the limiter
increments it with INSERT … ON CONFLICT DO UPDATE … RETURNING, which is atomic
across processes. No user FK — a bucket is an address or a keyed hash of an
account, and an account that does not exist yet is still counted.

Holds nothing worth keeping (the longest window is a day), so the downgrade
simply drops it.

Revision ID: bfc4c2673715
Revises: cda78611d65c
Create Date: 2026-09-26 15:54:04.079521

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'bfc4c2673715'
down_revision: str | Sequence[str] | None = 'cda78611d65c'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('rate_limit_counters',
    sa.Column('bucket', sa.String(length=160), nullable=False),
    sa.Column('window_start', sa.DateTime(timezone=True), nullable=False),
    sa.Column('count', sa.Integer(), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('bucket', 'window_start')
    )
    op.create_index(
        op.f('ix_rate_limit_counters_expires_at'), 'rate_limit_counters', ['expires_at'],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_rate_limit_counters_expires_at'), table_name='rate_limit_counters')
    op.drop_table('rate_limit_counters')
