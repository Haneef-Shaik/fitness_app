"""m18 signing in moves to Supabase Auth

Revision ID: 452a8b0dd238
Revises: f20ee50320ee
Create Date: 2026-09-26 23:30:00

Supabase Auth now owns passwords, sessions and emailed links (docs/14): the
password hash, FitLog's own verification timestamp, refresh-token families and
emailed-link tokens go. A push token now names the Supabase sign-in
(`session_id`) that registered it; the tokens on file named refresh families
that no longer mean anything, so they are cleared — each phone registers again
on its next sign-in.

Downgrade restores the columns and tables, empty: the passwords are Supabase's
and are not coming back, so an account restored by it cannot sign in with the
old flow until it resets its password.
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '452a8b0dd238'
down_revision: str | Sequence[str] | None = 'f20ee50320ee'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index('ix_account_tokens_user_purpose', table_name='account_tokens')
    op.drop_table('account_tokens')
    sa.Enum(name='account_token_purpose').drop(op.get_bind(), checkfirst=True)

    op.drop_index(op.f('ix_refresh_tokens_token_hash'), table_name='refresh_tokens')
    op.drop_index(op.f('ix_refresh_tokens_family_id'), table_name='refresh_tokens')
    op.drop_table('refresh_tokens')

    op.drop_column('users', 'password_hash')
    op.drop_column('users', 'email_verified_at')

    op.execute('DELETE FROM push_tokens')
    op.drop_index(op.f('ix_push_tokens_family_id'), table_name='push_tokens')
    op.drop_column('push_tokens', 'family_id')
    op.add_column('push_tokens', sa.Column('session_id', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_push_tokens_session_id'), 'push_tokens', ['session_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_push_tokens_session_id'), table_name='push_tokens')
    op.drop_column('push_tokens', 'session_id')
    op.add_column('push_tokens', sa.Column('family_id', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_push_tokens_family_id'), 'push_tokens', ['family_id'], unique=False)

    op.add_column('users', sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True))
    # NOT NULL as it was; existing rows get an empty hash, which matches nothing.
    op.add_column('users', sa.Column(
        'password_hash', sa.String(length=255), nullable=False, server_default='',
    ))
    op.alter_column('users', 'password_hash', server_default=None)

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
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_refresh_tokens_family_id'), 'refresh_tokens', ['family_id'], unique=False)
    op.create_index(op.f('ix_refresh_tokens_token_hash'), 'refresh_tokens', ['token_hash'], unique=True)

    op.create_table('account_tokens',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('purpose', sa.Enum('password_reset', 'verify_email', 'change_email', name='account_token_purpose'), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('email', sa.String(length=254), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_hash'),
    )
    op.create_index('ix_account_tokens_user_purpose', 'account_tokens', ['user_id', 'purpose'], unique=False)
