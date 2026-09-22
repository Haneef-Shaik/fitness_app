"""The muscle tree, as a query.

`muscle_groups.parent_id` is self-referencing (Chest -> Upper Chest -> ...), and
two normative rules read it:

  * **PRD §7.2** "previous chest day" — an exercise on Chest **or a descendant**
  * **D7** muscle volume — primary x1.0, secondary x0.5, recursed the same way

They must recurse identically, so the recursion lives here once. Two copies of a
tree walk drift, and the drift shows up as "the history screen and the analytics
screen disagree about what a chest day is" — which is how AC-06 fails later.

A one-level join is the tempting shortcut and it is wrong: it matches Upper Chest
and misses everything below it, while looking correct in any fixture whose tree
happens to be two levels deep. The seeded tree IS two levels deep.
"""
from __future__ import annotations

from sqlalchemy import Select, select

from app.models import MuscleGroup


def muscle_subtree_ids(root_slug: str) -> Select:
    """Selects the id of `root_slug` and of every group beneath it, at any depth.

    Usable directly as an `IN` operand:

        ExerciseMuscle.muscle_group_id.in_(muscle_subtree_ids("chest"))
    """
    root = (
        select(MuscleGroup.id)
        .where(MuscleGroup.slug == root_slug)
        .cte("muscle_subtree", recursive=True)
    )
    descendants = select(MuscleGroup.id).join(root, MuscleGroup.parent_id == root.c.id)
    tree = root.union_all(descendants)
    return select(tree.c.id)
