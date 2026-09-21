"""m1 foundations: users, profiles, goals, refresh tokens

Revision ID: e5849f31f31f
Revises: 
Create Date: 2026-09-21 20:09:03.519336

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'e5849f31f31f'
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('users',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('email', sa.String(length=254), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('status', sa.Enum('active', 'disabled', 'deleted', name='user_status'), nullable=False),
    sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_table('fitness_goals',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('goal_type', sa.Enum('fat_loss', 'muscle_gain', 'maintenance', 'strength', 'custom', name='goal_type'), nullable=False),
    sa.Column('metric_key', sa.String(length=40), nullable=False),
    sa.Column('direction', sa.String(length=10), nullable=False),
    sa.Column('start_value', sa.Numeric(precision=8, scale=2), nullable=True),
    sa.Column('target_value', sa.Numeric(precision=8, scale=2), nullable=False),
    sa.Column('target_unit', sa.String(length=16), nullable=False),
    sa.Column('start_date', sa.Date(), nullable=False),
    sa.Column('target_date', sa.Date(), nullable=True),
    sa.Column('status', sa.Enum('active', 'completed', 'paused', name='goal_status'), nullable=False),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_goals_user_status', 'fitness_goals', ['user_id', 'status'], unique=False)
    op.create_table('refresh_tokens',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('token_hash', sa.String(length=64), nullable=False),
    sa.Column('family_id', sa.UUID(), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('device_label', sa.String(length=80), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_refresh_tokens_family_id'), 'refresh_tokens', ['family_id'], unique=False)
    op.create_index(op.f('ix_refresh_tokens_token_hash'), 'refresh_tokens', ['token_hash'], unique=True)
    op.create_table('user_profiles',
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('display_name', sa.String(length=80), nullable=True),
    sa.Column('height_cm', sa.Numeric(precision=5, scale=1), nullable=True),
    sa.Column('birth_date', sa.Date(), nullable=True),
    sa.Column('sex', sa.String(length=20), nullable=True),
    sa.Column('preferred_unit_system', sa.Enum('metric', 'imperial', name='unit_system'), nullable=False),
    sa.Column('timezone', sa.String(length=64), nullable=False),
    sa.Column('week_starts_on', sa.Integer(), nullable=False),
    sa.Column('activity_level', sa.Enum('sedentary', 'light', 'moderate', 'very', 'extra', name='activity_level'), nullable=False),
    sa.Column('daily_calorie_target', sa.Integer(), nullable=True),
    sa.Column('protein_g_target', sa.Integer(), nullable=True),
    sa.Column('carbs_g_target', sa.Integer(), nullable=True),
    sa.Column('fat_g_target', sa.Integer(), nullable=True),
    sa.Column('onboarding_completed', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('user_profiles')
    op.drop_index(op.f('ix_refresh_tokens_token_hash'), table_name='refresh_tokens')
    op.drop_index(op.f('ix_refresh_tokens_family_id'), table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
    op.drop_index('ix_goals_user_status', table_name='fitness_goals')
    op.drop_table('fitness_goals')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')

    # Postgres ENUM types are NOT dropped by drop_table — they outlive the table.
    # Without this, `downgrade base` then `upgrade head` fails with
    # "type user_status already exists". Autogenerate does not emit these.
    for enum_name in ("goal_status", "goal_type", "activity_level", "unit_system", "user_status"):
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
