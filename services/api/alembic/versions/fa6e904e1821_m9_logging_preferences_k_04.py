"""m9 logging preferences (K-04)

Every column has a server default, so existing profiles get exactly the
behaviour they had: warm-ups out of volume (D6), no inline RPE/RIR, the plan's
own rest, 2.5 kg steps, a 20 kg bar and the standard plate set (null).

Revision ID: fa6e904e1821
Revises: d204e60c092c
Create Date: 2026-09-26 15:45:40.761424

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'fa6e904e1821'
down_revision: str | Sequence[str] | None = 'd204e60c092c'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('user_profiles', sa.Column('warmups_in_volume', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('user_profiles', sa.Column('show_rpe', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('user_profiles', sa.Column('show_rir', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('user_profiles', sa.Column('default_rest_seconds', sa.Integer(), nullable=True))
    op.add_column('user_profiles', sa.Column('load_step_kg', sa.Numeric(precision=4, scale=2), server_default='2.5', nullable=False))
    op.add_column('user_profiles', sa.Column('bar_weight_kg', sa.Numeric(precision=5, scale=2), server_default='20', nullable=False))
    op.add_column('user_profiles', sa.Column('plate_inventory_kg', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('user_profiles', 'plate_inventory_kg')
    op.drop_column('user_profiles', 'bar_weight_kg')
    op.drop_column('user_profiles', 'load_step_kg')
    op.drop_column('user_profiles', 'default_rest_seconds')
    op.drop_column('user_profiles', 'show_rir')
    op.drop_column('user_profiles', 'show_rpe')
    op.drop_column('user_profiles', 'warmups_in_volume')
