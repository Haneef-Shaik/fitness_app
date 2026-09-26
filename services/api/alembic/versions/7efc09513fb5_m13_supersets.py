"""m13 supersets (E-13) — a group number on plan and session exercises

Nullable, no default: every existing exercise stays a straight set.

Revision ID: 7efc09513fb5
Revises: 0bc9ac1369a8
Create Date: 2026-09-26 16:15:11.214650

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '7efc09513fb5'
down_revision: str | Sequence[str] | None = '0bc9ac1369a8'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('plan_exercises', sa.Column('superset_group', sa.Integer(), nullable=True))
    op.add_column('session_exercises', sa.Column('superset_group', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('session_exercises', 'superset_group')
    op.drop_column('plan_exercises', 'superset_group')
