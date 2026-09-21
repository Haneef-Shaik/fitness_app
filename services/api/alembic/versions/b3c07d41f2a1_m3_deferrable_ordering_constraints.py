"""m3: make the ordering constraints deferrable

Densifying an ordered list — deleting set 0 of three, or plan day 0 of three — moves
row 1 into 0 and row 2 into 1 inside one transaction. Postgres checks a plain UNIQUE
constraint row by row as the UPDATEs are applied, so the renumber collides with a
value a neighbour has not yet vacated.

DEFERRABLE INITIALLY DEFERRED moves the check to COMMIT, where the ordering is dense
again. Only the three ORDERING constraints are deferred. uq_set_client_id stays
immediate on purpose: a race on the idempotency key must surface inside the request
handler as a friendly 409, not at commit time as an unattributable 500.

Revision ID: b3c07d41f2a1
Revises: 9068460637a8
Create Date: 2026-09-21
"""
from collections.abc import Sequence

from alembic import op

revision: str = "b3c07d41f2a1"
down_revision: str | None = "9068460637a8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# (constraint name, table, columns)
ORDERING_CONSTRAINTS = [
    ("uq_plan_day_index", "workout_plan_days", ["program_id", "day_index"]),
    ("uq_session_exercise_order", "session_exercises", ["session_id", "order_index"]),
    ("uq_set_index", "workout_sets", ["session_exercise_id", "set_index"]),
]


def upgrade() -> None:
    for name, table, cols in ORDERING_CONSTRAINTS:
        op.drop_constraint(name, table, type_="unique")
        op.create_unique_constraint(
            name, table, cols, deferrable=True, initially="DEFERRED"
        )


def downgrade() -> None:
    for name, table, cols in ORDERING_CONSTRAINTS:
        op.drop_constraint(name, table, type_="unique")
        op.create_unique_constraint(name, table, cols)
