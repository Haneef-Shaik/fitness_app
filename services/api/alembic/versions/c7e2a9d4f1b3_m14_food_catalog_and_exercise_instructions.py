"""m14 food catalog (datasets, portions, search) and exercise instructions

Q1 was answered "internal catalog for v1, grown by seed". This is the schema
that catalog needs:

- `food_datasets` — one row per published dataset, carrying its licence and
  the attribution it asks for, so a food's provenance is data rather than a
  comment (USDA FoodData Central asks to be named as the source).
- `foods` gains the label nutrients beyond the macros, provenance
  (`dataset`, `source_note`), `aliases` (02 §6 already specified the column)
  and `search_weight`, the prior that makes "egg" land on an egg.
- `food_portions` — household measures with gram weights (H-05 presets).
- `pg_trgm` and a trigram GIN index on `foods.name`, for word-prefix and
  typo-tolerant search over ~8,000 rows.
- `exercises.instructions` — D-02's "how to do it".

Revision ID: c7e2a9d4f1b3
Revises: 7efc09513fb5
Create Date: 2026-09-26 16:05:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'c7e2a9d4f1b3'
down_revision: str | Sequence[str] | None = '7efc09513fb5'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # A trusted extension since Postgres 13, so the app role can create it
    # without superuser; Supabase ships it. IF NOT EXISTS because a hosted
    # database may already have it installed.
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    op.create_table('food_datasets',
    sa.Column('slug', sa.String(length=40), nullable=False),
    sa.Column('name', sa.String(length=160), nullable=False),
    sa.Column('publisher', sa.String(length=200), nullable=False),
    sa.Column('version', sa.String(length=40), nullable=True),
    sa.Column('licence', sa.String(length=80), nullable=False),
    sa.Column('licence_url', sa.String(length=255), nullable=True),
    sa.Column('attribution', sa.String(length=500), nullable=False),
    sa.Column('url', sa.String(length=255), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('slug')
    )
    op.create_table('food_portions',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('food_id', sa.UUID(), nullable=False),
    sa.Column('label', sa.String(length=80), nullable=False),
    sa.Column('grams', sa.Numeric(precision=8, scale=2), nullable=False),
    sa.Column('sort_order', sa.SmallInteger(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['food_id'], ['foods.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('food_id', 'label', name='uq_food_portion_label')
    )
    op.add_column('exercises', sa.Column('instructions', sa.Text(), nullable=True))
    op.add_column('foods', sa.Column('sugar_g', sa.Numeric(precision=8, scale=2), nullable=True))
    op.add_column('foods', sa.Column('saturated_fat_g', sa.Numeric(precision=8, scale=2), nullable=True))
    op.add_column('foods', sa.Column('sodium_mg', sa.Numeric(precision=8, scale=2), nullable=True))
    op.add_column('foods', sa.Column('dataset', sa.String(length=40), nullable=True))
    op.add_column('foods', sa.Column('source_note', sa.String(length=300), nullable=True))
    op.add_column('foods', sa.Column('category', sa.String(length=80), nullable=True))
    op.add_column('foods', sa.Column('aliases', postgresql.ARRAY(sa.String(length=80)), server_default='{}', nullable=False))
    op.add_column('foods', sa.Column('search_weight', sa.SmallInteger(), server_default='0', nullable=False))
    op.create_index('ix_foods_name_trgm', 'foods', ['name'], unique=False, postgresql_using='gin', postgresql_ops={'name': 'gin_trgm_ops'})
    op.create_foreign_key('fk_foods_dataset', 'foods', 'food_datasets', ['dataset'], ['slug'], ondelete='RESTRICT')


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_foods_dataset', 'foods', type_='foreignkey')
    op.drop_index('ix_foods_name_trgm', table_name='foods', postgresql_using='gin', postgresql_ops={'name': 'gin_trgm_ops'})
    op.drop_column('foods', 'search_weight')
    op.drop_column('foods', 'aliases')
    op.drop_column('foods', 'category')
    op.drop_column('foods', 'source_note')
    op.drop_column('foods', 'dataset')
    op.drop_column('foods', 'sodium_mg')
    op.drop_column('foods', 'saturated_fat_g')
    op.drop_column('foods', 'sugar_g')
    op.drop_column('exercises', 'instructions')
    op.drop_table('food_portions')
    op.drop_table('food_datasets')
    # pg_trgm is deliberately LEFT INSTALLED. An extension belongs to the
    # database, not to this migration: a hosted Postgres may have had it before
    # m9 ran (hence IF NOT EXISTS above), and other schemas may use it. Leaving
    # it is harmless; dropping somebody else's extension is not.
