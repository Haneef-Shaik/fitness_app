"""The food-resolution benchmark: what a model actually says, and what it should land on.

A resolver change is only an improvement if it resolves MORE of these to the
RIGHT food, so each phrase carries the words its match must contain. "Resolved"
alone is not the measure — ladder step 4 used to turn "chicken curry" into
plain chicken, which counts as resolved and is wrong.

Phrased the way the AI gateway phrases them (quantities, plurals, "a bowl of"),
because that is the input the ladder sees in production. Used by
`scripts/measure_food_resolution.py` and pinned by `tests/test_food_search.py`.
"""
from __future__ import annotations

#: (detected name, words the resolved food's name must ALL contain — lowercase).
#: A leading "-" marks a word it must NOT contain: "butter" landing on peanut
#: butter contains the word and is still the wrong food.
MEAL_PHRASES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("2 rotis", ("roti",)),
    ("chapati", ("chapati",)),
    ("paneer", ("paneer",)),
    ("a bowl of dal", ("dal",)),
    ("grilled chicken breast", ("chicken", "breast")),
    ("oats", ("oat",)),
    ("a banana", ("banana",)),
    ("rice", ("rice", "-flour", "-cake", "-cracker")),
    ("2 eggs", ("egg", "-plant", "-noodle", "-nog")),
    ("greek yogurt", ("greek", "yogurt")),
    ("chicken biryani", ("biryani",)),
    ("3 idlis", ("idli",)),
    ("masala dosa", ("dosa",)),
    ("a glass of milk", ("milk",)),
    ("almonds", ("almond",)),
    ("brown rice", ("brown", "rice")),
    ("an apple", ("apple",)),
    ("2 slices whole wheat bread", ("bread",)),
    ("peanut butter", ("peanut", "butter")),
    ("salmon", ("salmon",)),
    ("sweet potato", ("sweet", "potato")),
    ("broccoli", ("broccoli",)),
    ("chicken curry", ("chicken", "curry")),
    ("butter naan", ("naan",)),
    ("aloo paratha", ("paratha",)),
    ("sambar", ("sambar",)),
    ("poha", ("poha",)),
    ("rajma", ("rajma",)),
    ("chole", ("chole",)),
    ("a bowl of curd", ("curd",)),
    ("ghee", ("ghee",)),
    ("butter", ("butter", "-peanut", "-almond", "-naan")),
    ("cheddar cheese", ("cheddar",)),
    ("pasta", ("pasta",)),
    ("oatmeal", ("oat",)),
    ("avocado", ("avocado",)),
    ("tuna", ("tuna",)),
    ("spinach", ("spinach",)),
    ("tofu", ("tofu",)),
    ("samosa", ("samosa",)),
)


def is_correct(resolved_name: str | None, expected: tuple[str, ...]) -> bool:
    """A resolution counts only when the food it landed on is the food asked for."""
    if resolved_name is None:
        return False
    name = resolved_name.lower()
    return all(
        (word[1:] not in name) if word.startswith("-") else (word in name)
        for word in expected
    )
