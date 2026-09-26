"""A second, cheaper guard on the append-only rule.

The database trigger in migration `m6` is the guarantee — it holds against a
psql session, a migration, and code nobody has written yet. This file is the
guard that fails *at review time* rather than at runtime, by reading the
codebase for the statement that should not exist.

Two guards rather than one because they fail in different places: the trigger
tells you at 2am on a production write, and this tells you in CI on the pull
request that introduced it.
"""
from __future__ import annotations

import ast
import re
from pathlib import Path

APP = Path(__file__).parents[1] / "app"
MIGRATIONS = Path(__file__).parents[1] / "alembic" / "versions"

PROTECTED = ("food_analysis_items", "food_analyses")

#: **The one audited exception**, and it is an allow-list of exactly one file.
#:
#: G10's account deletion has to remove these rows — a user asking to be
#: forgotten outranks an audit trail about them — and it is the only place in
#: the product that may. Adding a second entry here should require the same
#: argument, which is why it is a list of one rather than a pattern.
#:
#: It moved from `app/api/routes/account.py` at launch, when the web deletion
#: page became a second caller: the exemption follows the one implementation,
#: and is still exactly one file.
DELETION_EXEMPT = {"app/services/account.py"}

_MUTATING_SQL = re.compile(
    r"\b(update|delete\s+from)\s+(food_analysis_items|food_analyses)\b",
    re.IGNORECASE,
)


def _python_files(root: Path) -> list[Path]:
    return [p for p in root.rglob("*.py") if "__pycache__" not in p.parts]


def test_no_raw_sql_mutates_an_analysis_table():
    offenders: list[str] = []
    for path in _python_files(APP):
        relative = str(path.relative_to(APP.parent))
        if relative in DELETION_EXEMPT:
            continue
        for number, line in enumerate(path.read_text().splitlines(), 1):
            if _MUTATING_SQL.search(line):
                offenders.append(f"{relative}:{number}: {line.strip()}")

    assert not offenders, (
        "analysis tables are append-only; these statements would mutate one:\n"
        + "\n".join(offenders)
    )


def test_the_only_exemption_is_account_deletion_and_it_is_only_a_delete():
    """The exemption is audited rather than trusted.

    G8's guard caught G10's own account deletion, which is the guard working.
    Exempting the file is only safe if the exemption stays narrow — so this
    asserts the exempt file deletes and never UPDATEs, and that the trigger it
    stands down is re-enabled in a `finally`.
    """
    for relative in DELETION_EXEMPT:
        source = (APP.parent / relative).read_text()

        updates = [
            line.strip() for line in source.splitlines()
            if re.search(r"\bupdate\s+food_analys", line, re.IGNORECASE)
        ]
        assert not updates, f"{relative} UPDATEs an append-only table: {updates}"

        # The trigger is stood down for one transaction. If it is not put back,
        # the append-only guarantee is gone for every later request too.
        assert "DISABLE TRIGGER food_analysis_items_no_update" in source
        assert "ENABLE TRIGGER food_analysis_items_no_update" in source
        disable = source.index("DISABLE TRIGGER food_analysis_items_no_update")
        enable = source.index("ENABLE TRIGGER food_analysis_items_no_update")
        assert "finally:" in source[disable:enable], (
            f"{relative} re-enables the trigger outside a finally — an exception "
            "in the middle would leave the table writable"
        )


def test_nothing_asks_the_orm_to_delete_an_analysis_row():
    """`session.delete(row)` is the ORM's way of writing the same statement."""
    offenders: list[str] = []

    for path in _python_files(APP):
        if str(path.relative_to(APP.parent)) in DELETION_EXEMPT:
            continue
        tree = ast.parse(path.read_text())
        for node in ast.walk(tree):
            if not isinstance(node, ast.Call):
                continue
            func = node.func
            if not (isinstance(func, ast.Attribute) and func.attr == "delete"):
                continue
            for arg in node.args:
                name = _model_name(arg)
                if name in {"FoodAnalysis", "FoodAnalysisItem"}:
                    offenders.append(f"{path.relative_to(APP.parent)}:{node.lineno}")

    assert not offenders, "an analysis row is being deleted at " + ", ".join(offenders)


def _model_name(node: ast.AST) -> str | None:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    return None


def test_the_trigger_that_actually_enforces_it_is_in_a_migration():
    """The guard above is a courtesy. This asserts the real one exists.

    Without it, deleting the trigger from the migration would leave a green
    suite and a promise nothing keeps.
    """
    text = "\n".join(p.read_text() for p in MIGRATIONS.glob("*.py"))

    assert "CREATE TRIGGER food_analysis_items_no_update" in text
    assert "BEFORE UPDATE OR DELETE ON food_analysis_items" in text
    assert "CREATE TRIGGER food_analyses_immutable" in text


def test_the_orm_relationship_cannot_cascade_a_delete():
    """`cascade="all, delete-orphan"` would let removing an analysis take its
    items with it, quietly, through the ORM."""
    from app.models import FoodAnalysis

    relationship = FoodAnalysis.__mapper__.relationships["items"]
    assert "delete-orphan" not in relationship.cascade
    assert "delete" not in relationship.cascade
