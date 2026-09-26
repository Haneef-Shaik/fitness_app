"""m17 push tokens follow the sign-in

Revision ID: f20ee50320ee
Revises: bfc4c2673715
Create Date: 2026-09-26 17:42:03.676656

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'f20ee50320ee'
down_revision: str | Sequence[str] | None = 'bfc4c2673715'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('push_tokens', sa.Column('family_id', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_push_tokens_family_id'), 'push_tokens', ['family_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_push_tokens_family_id'), table_name='push_tokens')
    op.drop_column('push_tokens', 'family_id')
