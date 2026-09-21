"""m2 training core: catalog, programs, sessions, sets, records

Revision ID: 9068460637a8
Revises: e5849f31f31f
Create Date: 2026-09-21 20:21:15.543430

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '9068460637a8'
down_revision: str | Sequence[str] | None = 'e5849f31f31f'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('muscle_groups',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=60), nullable=False),
    sa.Column('slug', sa.String(length=60), nullable=False),
    sa.Column('parent_id', sa.UUID(), nullable=True),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['parent_id'], ['muscle_groups.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name'),
    sa.UniqueConstraint('slug')
    )
    op.create_table('exercises',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('owner_user_id', sa.UUID(), nullable=True),
    sa.Column('name', sa.String(length=120), nullable=False),
    sa.Column('equipment', sa.Enum('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'band', 'kettlebell', 'other', name='equipment'), nullable=False),
    sa.Column('movement_pattern', sa.String(length=60), nullable=True),
    sa.Column('aliases', postgresql.ARRAY(sa.String(length=80)), nullable=False),
    sa.Column('is_custom', sa.Boolean(), nullable=False),
    sa.Column('status', sa.Enum('active', 'archived', name='catalog_status'), nullable=False),
    sa.Column('tracks_load', sa.Boolean(), nullable=False),
    sa.Column('tracks_reps', sa.Boolean(), nullable=False),
    sa.Column('tracks_duration', sa.Boolean(), nullable=False),
    sa.Column('tracks_distance', sa.Boolean(), nullable=False),
    sa.Column('default_unit', sa.String(length=8), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['owner_user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_exercises_name', 'exercises', ['name'], unique=False)
    op.create_index('ix_exercises_owner_status', 'exercises', ['owner_user_id', 'status'], unique=False)
    op.create_table('workout_programs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=80), nullable=False),
    sa.Column('description', sa.String(length=500), nullable=True),
    sa.Column('status', sa.Enum('active', 'archived', name='program_status'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_programs_user_status', 'workout_programs', ['user_id', 'status'], unique=False)
    op.create_table('exercise_muscles',
    sa.Column('exercise_id', sa.UUID(), nullable=False),
    sa.Column('muscle_group_id', sa.UUID(), nullable=False),
    sa.Column('role', sa.Enum('primary', 'secondary', name='muscle_role'), nullable=False),
    sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['muscle_group_id'], ['muscle_groups.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('exercise_id', 'muscle_group_id'),
    sa.UniqueConstraint('exercise_id', 'muscle_group_id', name='uq_exercise_muscle')
    )
    op.create_index('ix_exercise_muscles_group_role', 'exercise_muscles', ['muscle_group_id', 'role', 'exercise_id'], unique=False)
    op.create_table('workout_plan_days',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('program_id', sa.UUID(), nullable=False),
    sa.Column('day_index', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=80), nullable=False),
    sa.Column('scheduled_weekday', sa.Integer(), nullable=True),
    sa.Column('notes', sa.String(length=2000), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['program_id'], ['workout_programs.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('program_id', 'day_index', name='uq_plan_day_index')
    )
    op.create_index('ix_plan_days_weekday', 'workout_plan_days', ['program_id', 'scheduled_weekday'], unique=False)
    op.create_table('plan_exercises',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('plan_day_id', sa.UUID(), nullable=False),
    sa.Column('exercise_id', sa.UUID(), nullable=False),
    sa.Column('order_index', sa.Integer(), nullable=False),
    sa.Column('target_sets', sa.Integer(), nullable=True),
    sa.Column('target_reps_min', sa.Integer(), nullable=True),
    sa.Column('target_reps_max', sa.Integer(), nullable=True),
    sa.Column('target_load', sa.Numeric(precision=7, scale=2), nullable=True),
    sa.Column('load_unit', sa.String(length=8), nullable=False),
    sa.Column('rest_seconds', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['plan_day_id'], ['workout_plan_days.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_plan_exercises_day_order', 'plan_exercises', ['plan_day_id', 'order_index'], unique=False)
    op.create_table('workout_sessions',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('plan_day_id', sa.UUID(), nullable=True),
    sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('status', sa.Enum('planned', 'in_progress', 'completed', 'cancelled', name='session_status'), nullable=False),
    sa.Column('notes', sa.String(length=2000), nullable=True),
    sa.Column('local_date', sa.Date(), nullable=False),
    sa.Column('logged_timezone', sa.String(length=64), nullable=False),
    sa.Column('total_volume_kg', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('duration_seconds', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['plan_day_id'], ['workout_plan_days.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_sessions_user_local_date', 'workout_sessions', ['user_id', 'local_date'], unique=False, postgresql_where=sa.text("status = 'completed'"))
    op.create_index('uq_one_active_session_per_user', 'workout_sessions', ['user_id'], unique=True, postgresql_where=sa.text("status = 'in_progress'"))
    op.create_table('session_exercises',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('session_id', sa.UUID(), nullable=False),
    sa.Column('exercise_id', sa.UUID(), nullable=False),
    sa.Column('order_index', sa.Integer(), nullable=False),
    sa.Column('notes', sa.String(length=2000), nullable=True),
    sa.Column('skipped', sa.Boolean(), nullable=False),
    sa.Column('plan_exercise_id', sa.UUID(), nullable=True),
    sa.Column('target_snapshot', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['plan_exercise_id'], ['plan_exercises.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['session_id'], ['workout_sessions.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('session_id', 'order_index', name='uq_session_exercise_order')
    )
    op.create_index('ix_session_exercises_exercise', 'session_exercises', ['session_id', 'exercise_id'], unique=False)
    op.create_table('workout_sets',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('session_exercise_id', sa.UUID(), nullable=False),
    sa.Column('set_index', sa.Integer(), nullable=False),
    sa.Column('set_type', sa.Enum('warmup', 'working', 'drop', 'failure', name='set_type'), nullable=False),
    sa.Column('reps', sa.Integer(), nullable=True),
    sa.Column('load_kg', sa.Numeric(precision=7, scale=2), nullable=True),
    sa.Column('duration_seconds', sa.Integer(), nullable=True),
    sa.Column('distance_m', sa.Numeric(precision=9, scale=2), nullable=True),
    sa.Column('rpe', sa.Numeric(precision=3, scale=1), nullable=True),
    sa.Column('rir', sa.Numeric(precision=3, scale=1), nullable=True),
    sa.Column('completed', sa.Boolean(), nullable=False),
    sa.Column('performed_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('note', sa.String(length=500), nullable=True),
    sa.Column('load_unit_entered', sa.String(length=8), nullable=False),
    sa.Column('e1rm_kg', sa.Numeric(precision=7, scale=2), nullable=True),
    sa.Column('formula_version', sa.String(length=20), nullable=True),
    sa.Column('is_pr', sa.Boolean(), nullable=False),
    sa.Column('client_id', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['session_exercise_id'], ['session_exercises.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('session_exercise_id', 'client_id', name='uq_set_client_id'),
    sa.UniqueConstraint('session_exercise_id', 'set_index', name='uq_set_index')
    )
    op.create_index('ix_sets_performed_at', 'workout_sets', ['performed_at'], unique=False, postgresql_where=sa.text('completed = true'))
    op.create_table('personal_records',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('exercise_id', sa.UUID(), nullable=False),
    sa.Column('record_type', sa.Enum('max_load', 'max_reps', 'volume', 'estimated_1rm', name='record_type'), nullable=False),
    sa.Column('value', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('unit', sa.String(length=8), nullable=False),
    sa.Column('achieved_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('workout_set_id', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['workout_set_id'], ['workout_sets.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'exercise_id', 'record_type', name='uq_pr_per_type')
    )
    op.create_index('ix_pr_user_exercise', 'personal_records', ['user_id', 'exercise_id', 'record_type'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_pr_user_exercise', table_name='personal_records')
    op.drop_table('personal_records')
    op.drop_index('ix_sets_performed_at', table_name='workout_sets', postgresql_where=sa.text('completed = true'))
    op.drop_table('workout_sets')
    op.drop_index('ix_session_exercises_exercise', table_name='session_exercises')
    op.drop_table('session_exercises')
    op.drop_index('uq_one_active_session_per_user', table_name='workout_sessions', postgresql_where=sa.text("status = 'in_progress'"))
    op.drop_index('ix_sessions_user_local_date', table_name='workout_sessions', postgresql_where=sa.text("status = 'completed'"))
    op.drop_table('workout_sessions')
    op.drop_index('ix_plan_exercises_day_order', table_name='plan_exercises')
    op.drop_table('plan_exercises')
    op.drop_index('ix_plan_days_weekday', table_name='workout_plan_days')
    op.drop_table('workout_plan_days')
    op.drop_index('ix_exercise_muscles_group_role', table_name='exercise_muscles')
    op.drop_table('exercise_muscles')
    op.drop_index('ix_programs_user_status', table_name='workout_programs')
    op.drop_table('workout_programs')
    op.drop_index('ix_exercises_owner_status', table_name='exercises')
    op.drop_index('ix_exercises_name', table_name='exercises')
    op.drop_table('exercises')
    op.drop_table('muscle_groups')

    # Postgres ENUM types are NOT dropped by drop_table. Without this,
    # `downgrade` then `upgrade` fails with "type already exists".
    # Autogenerate never emits these — see the same fix in the M1 revision.
    for enum_name in ['catalog_status', 'equipment', 'muscle_role', 'program_status', 'record_type', 'session_status', 'set_type']:
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
