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


class MuscleTree:
    """The same edges as `muscle_subtree_ids`, walked the other way.

    The CTE answers "everything at or below this group", which is what a filter
    needs. Rolling volume up needs the inverse: given the group an exercise maps
    to, which groups should receive its volume. They are the same `parent_id`
    edges read in opposite directions, so they agree by construction — and they
    live in the same module so that stays true.

    Built once per request from the whole (small, fixed) table rather than one
    query per group: the tree is 22 rows and will not grow with a user's data.
    """

    def __init__(self, groups):
        self._by_id = {g.id: g for g in groups}

    def ancestors(self, group_id):
        """`group_id` and every group above it, nearest first.

        Volume on a grandchild of Chest is Upper Chest volume AND Chest volume;
        stopping at the first parent is the one-level bug in the other
        direction.
        """
        out = []
        current = self._by_id.get(group_id)
        seen = set()
        while current is not None and current.id not in seen:
            seen.add(current.id)          # a cycle would otherwise hang a request
            out.append(current)
            current = self._by_id.get(current.parent_id) if current.parent_id else None
        return out

    def slugs(self) -> dict:
        return {g.slug: g.name for g in self._by_id.values()}
