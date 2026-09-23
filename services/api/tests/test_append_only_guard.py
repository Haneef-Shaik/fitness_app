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

_MUTATING_SQL = re.compile(
    r"\b(update|delete\s+from)\s+(food_analysis_items|food_analyses)\b",
    re.IGNORECASE,
)


def _python_files(root: Path) -> list[Path]:
    return [p for p in root.rglob("*.py") if "__pycache__" not in p.parts]


def test_no_raw_sql_mutates_an_analysis_table():
    offenders: list[str] = []
    for path in _python_files(APP):
        for number, line in enumerate(path.read_text().splitlines(), 1):
            if _MUTATING_SQL.search(line):
                offenders.append(f"{path.relative_to(APP.parent)}:{number}: {line.strip()}")

    assert not offenders, (
        "analysis tables are append-only; these statements would mutate one:\n"
        + "\n".join(offenders)
    )


def test_nothing_asks_the_orm_to_delete_an_analysis_row():
    """`session.delete(row)` is the ORM's way of writing the same statement."""
    offenders: list[str] = []

    for path in _python_files(APP):
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
