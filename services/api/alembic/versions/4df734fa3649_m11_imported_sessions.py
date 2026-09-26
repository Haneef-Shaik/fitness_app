"""m11 imported sessions — a stable key per workout brought in from Strong or Hevy

Unique per user, so re-importing the same export adds nothing. NULL for every
session logged in FitLog, and Postgres lets NULLs repeat under a unique index.

Revision ID: 4df734fa3649
Revises: 91bc54e51e69
Create Date: 2026-09-26 16:04:04.750250

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '4df734fa3649'
down_revision: str | Sequence[str] | None = '91bc54e51e69'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('workout_sessions', sa.Column('import_key', sa.String(length=64), nullable=True))
    op.create_unique_constraint('uq_session_import_key', 'workout_sessions', ['user_id', 'import_key'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_session_import_key', 'workout_sessions', type_='unique')
    op.drop_column('workout_sessions', 'import_key')
