"""Build the food-catalog seed from USDA FoodData Central.

    uv run python scripts/import_usda.py                 # download (cached) and build
    uv run python scripts/import_usda.py --cache var/fdc # choose the download cache

Q1 was answered "internal catalog for v1, grown by seed": nothing is fetched at
runtime, so this script is the whole of the "provider". It reads USDA's bulk
CSV releases and writes two committed files that `app/seed/foods.py` loads:

- `app/seed/data/usda_fdc.json.gz` — every Foundation food and every SR Legacy
  food except the categories below, normalised to FitLog's per-100 g model
  with FDC's household portions.
- `app/seed/data/indian_foods.json` — the curated Indian dishes in
  `scripts/indian_foods.py`, valued from FNDDS / SR Legacy records or
  calculated from a stated recipe of SR Legacy ingredients.

**Only Foundation + SR Legacy (+ FNDDS for the Indian dishes).** Branded Foods
is ~400k rows of label data for products that come and go; it would make the
repository enormous and the search worse. Barcode lookup (H-17) is out of v1.

**Reproducible.** Release URLs are pinned below; the zips are cached in
`--cache` (default `var/fdc`, which git ignores) and never committed. Running
this twice produces byte-identical output, so a diff of the data files is a
diff of the data.

Licence: FoodData Central is public domain, published under CC0 1.0. USDA asks
to be named as the source — `docs/data-sources.md` and the `food_datasets` rows
carry that attribution. See also `scripts/indian_foods.py` for how each Indian
dish was valued.
"""
from __future__ import annotations

import argparse
import csv
import gzip
import io
import json
import re
import sys
import urllib.request
import zipfile
from collections import defaultdict
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path

HERE = Path(__file__).resolve().parent
API_ROOT = HERE.parent
sys.path.insert(0, str(HERE))

from indian_foods import DISHES, INGREDIENTS, OVERRIDES, Dish

OUT_DIR = API_ROOT / "app" / "seed" / "data"
FDC = "https://fdc.nal.usda.gov/fdc-datasets"


@dataclass(frozen=True)
class Release:
    key: str
    dataset: str          # the `food_datasets.slug` its rows are filed under
    zip_name: str
    data_type: str        # food.csv `data_type` of the records we keep

    @property
    def url(self) -> str:
        return f"{FDC}/{self.zip_name}"


FOUNDATION = Release(
    "foundation", "usda_fdc_foundation",
    "FoodData_Central_foundation_food_csv_2026-04-30.zip", "foundation_food",
)
SR_LEGACY = Release(
    "sr_legacy", "usda_fdc_sr_legacy",
    "FoodData_Central_sr_legacy_food_csv_2018-04.zip", "sr_legacy_food",
)
FNDDS = Release(
    "fndds", "usda_fndds",
    "FoodData_Central_survey_food_csv_2024-10-31.zip", "survey_fndds_food",
)

#: SR Legacy categories left out: infant formula and baby food are not what an
#: adult logs, and would outrank real food for "oatmeal" or "banana".
EXCLUDED_CATEGORIES = frozenset({"Baby Foods", "Quality Control Materials"})

#: Categories that are real food but rarely what a search means. Kept, ranked
#: lower: "chicken" should not open on a fast-food nugget.
DEMOTED_CATEGORIES = frozenset({
    "Fast Foods", "Restaurant Foods", "Meals, Entrees, and Side Dishes",
    "American Indian/Alaska Native Foods",
})

# ---------------------------------------------------------------- nutrients
# FDC's nutrient ids (SR Legacy, Foundation). FNDDS files use the older
# nutrient NUMBERS in the same column, hence the second table. Order is the
# preference order: Foundation reports energy as Atwater factors (2048/2047)
# where SR reports 1008, and carbohydrate "by summation" where SR has "by
# difference".
NUTRIENT_IDS: dict[str, tuple[str, ...]] = {
    "calories": ("1008", "2048", "2047"),
    "protein_g": ("1003",),
    "carbs_g": ("1005", "1050"),
    "fat_g": ("1004", "1085"),
    "fiber_g": ("1079",),
    "sugar_g": ("2000", "1063"),
    "saturated_fat_g": ("1258",),
    "sodium_mg": ("1093",),
}
FNDDS_NUMBERS: dict[str, tuple[str, ...]] = {
    "calories": ("208",), "protein_g": ("203",), "carbs_g": ("205",), "fat_g": ("204",),
    "fiber_g": ("291",), "sugar_g": ("269",), "saturated_fat_g": ("606",),
    "sodium_mg": ("307",),
}
FIELDS = tuple(NUTRIENT_IDS)

_FDP = re.compile(r"\s*\(Includes foods for USDA's Food Distribution Program\)", re.IGNORECASE)
_SPACES = re.compile(r"\s{2,}")
#: A brand in an SR name is written in capitals: "QUAKER", "KRAFT", "McDONALD'S".
_BRAND = re.compile(r"\b(?:[A-Z][A-Z'&.-]{2,}|Mc[A-Z]{3,})\b")

MAX_PORTIONS = 8
#: FDC portions that are not a way anyone measures a meal.
_SKIP_PORTION = re.compile(
    r"quantity not specified|surface inch|cubic inch|container", re.IGNORECASE
)


# ------------------------------------------------------------------ reading

def fetch(release: Release, cache: Path) -> zipfile.ZipFile:
    """The release's zip, downloaded once into the cache."""
    cache.mkdir(parents=True, exist_ok=True)
    target = cache / release.zip_name
    if not target.exists():
        print(f"  downloading {release.url}")
        # A pinned https URL on USDA's own host, never user input.
        with urllib.request.urlopen(release.url, timeout=300) as resp:
            target.write_bytes(resp.read())
    return zipfile.ZipFile(target)


def read_csv(archive: zipfile.ZipFile, name: str) -> Iterator[dict[str, str]]:
    member = next(n for n in archive.namelist() if n.endswith(f"/{name}") or n == name)
    with archive.open(member) as raw:
        yield from csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8", newline=""))


def clean_name(description: str) -> str:
    return _SPACES.sub(" ", _FDP.sub("", description)).strip()


def _number(text: str) -> float | None:
    try:
        return float(text)
    except (TypeError, ValueError):
        return None


def _fmt_amount(amount: float) -> str:
    return f"{amount:g}"


def load_nutrients(
    archive: zipfile.ZipFile, ids: set[str], table: dict[str, tuple[str, ...]]
) -> dict[str, dict[str, float]]:
    """{fdc_id: {field: value per 100 g}} for the wanted foods, by preference."""
    wanted = {nid for options in table.values() for nid in options}
    raw: dict[str, dict[str, float]] = defaultdict(dict)
    for row in read_csv(archive, "food_nutrient.csv"):
        if row["fdc_id"] in ids and row["nutrient_id"] in wanted:
            value = _number(row["amount"])
            if value is not None:
                raw[row["fdc_id"]][row["nutrient_id"]] = value

    out: dict[str, dict[str, float]] = {}
    for fdc_id, values in raw.items():
        picked = {}
        for field, options in table.items():
            found = next((values[o] for o in options if o in values), None)
            if found is not None:
                picked[field] = round(found, 2)
        out[fdc_id] = picked
    return out


def load_portions(archive: zipfile.ZipFile, ids: set[str]) -> dict[str, list[tuple[str, float]]]:
    """{fdc_id: [(label, grams)]} in FDC's own order, deduplicated by label."""
    units = {r["id"]: r["name"] for r in read_csv(archive, "measure_unit.csv")}
    rows = [r for r in read_csv(archive, "food_portion.csv") if r["fdc_id"] in ids]
    rows.sort(key=lambda r: (int(r["fdc_id"]), _number(r["seq_num"]) or 0, int(r["id"])))

    out: dict[str, list[tuple[str, float]]] = defaultdict(list)
    for row in rows:
        label = _portion_label(row, units)
        grams = _number(row["gram_weight"])
        if not label or not grams or grams <= 0 or _SKIP_PORTION.search(label):
            continue
        if label.lower() in {existing.lower() for existing, _ in out[row["fdc_id"]]}:
            continue
        if len(out[row["fdc_id"]]) < MAX_PORTIONS:
            out[row["fdc_id"]].append((label, round(grams, 1)))
    return out


def _portion_label(row: dict[str, str], units: dict[str, str]) -> str:
    """"1 cup, chopped", "1 large", "0.5 breast, bone and skin removed"."""
    description = row["portion_description"].strip()
    modifier = row["modifier"].strip()
    unit = units.get(row["measure_unit_id"], "undetermined")
    amount = _number(row["amount"])

    if description and not description.isdigit():
        label = description                                   # FNDDS: "1 cup"
    elif unit != "undetermined" and amount:
        label = f"{_fmt_amount(amount)} {unit}" + (f", {modifier}" if modifier else "")
    elif modifier and not modifier.isdigit():
        label = f"{_fmt_amount(amount or 1)} {modifier}"       # SR: "1 large"
    else:
        return ""
    label = _SPACES.sub(" ", label)
    return label if len(label) <= 80 else label[:79].rstrip(" ,") + "…"


# --------------------------------------------------------------- the build

def _weight(dataset: str, category: str, name: str) -> int:
    """The search prior (see `Food.search_weight`). Deliberately coarse: it
    breaks ties between rows that match equally well, it does not decide."""
    weight = 20 if dataset == FOUNDATION.dataset else 10
    if category in DEMOTED_CATEGORIES:
        weight -= 25
    if _BRAND.search(name):
        weight -= 10
    return weight


def build_usda(cache: Path) -> list[dict]:
    foods: list[dict] = []
    seen_names: set[str] = set()
    # Foundation first: where both publish "Broccoli, raw", Foundation's
    # newer analytical values win and the SR twin is dropped.
    for release in (FOUNDATION, SR_LEGACY):
        archive = fetch(release, cache)
        categories = {r["id"]: r["description"] for r in read_csv(archive, "food_category.csv")}
        records = _latest_by_name(
            r for r in read_csv(archive, "food.csv") if r["data_type"] == release.data_type
        )
        ids = {r["fdc_id"] for r in records}
        nutrients = load_nutrients(archive, ids, NUTRIENT_IDS)
        portions = load_portions(archive, ids)

        kept = 0
        for record in sorted(records, key=lambda r: int(r["fdc_id"])):
            name = clean_name(record["description"])
            category = categories.get(record["food_category_id"], "")
            values = nutrients.get(record["fdc_id"], {})
            if category in EXCLUDED_CATEGORIES or "calories" not in values:
                continue
            if name.lower() in seen_names:
                continue
            seen_names.add(name.lower())
            foods.append(_usda_row(release, record, name, category, values,
                                   portions.get(record["fdc_id"], [])))
            kept += 1
        print(f"  {release.key}: {kept} foods")
    return foods


def _latest_by_name(records: Iterator[dict[str, str]]) -> list[dict[str, str]]:
    """Foundation republishes a food under a new id; keep the newest of each."""
    best: dict[str, dict[str, str]] = {}
    for record in records:
        key = record["description"].lower()
        current = best.get(key)
        if current is None or (record["publication_date"], int(record["fdc_id"])) > (
            current["publication_date"], int(current["fdc_id"])
        ):
            best[key] = record
    return list(best.values())


def _usda_row(release, record, name, category, values, portions) -> dict:
    return {
        "ref": f"fdc:{record['fdc_id']}",
        "dataset": release.dataset,
        "name": name,
        "category": category or None,
        **{field: values.get(field) for field in FIELDS},
        "portions": [[label, grams] for label, grams in portions],
        "weight": _weight(release.dataset, category, name),
    }


# ------------------------------------------------------- the Indian dishes

def build_indian(cache: Path) -> list[dict]:
    """Values for every curated dish, each traceable to a USDA record."""
    fndds = fetch(FNDDS, cache)
    sr = fetch(SR_LEGACY, cache)
    fndds_ids = {d.basis.split(":")[1] for d in DISHES if d.basis.startswith("fndds:")}
    sr_ids = {d.basis.split(":")[1] for d in DISHES if d.basis.startswith("sr:")}
    sr_ids |= {str(fdc_id) for fdc_id, _ in INGREDIENTS.values()}

    fndds_values = load_nutrients(fndds, fndds_ids, FNDDS_NUMBERS)
    fndds_names = {r["fdc_id"]: r["description"] for r in read_csv(fndds, "food.csv")
                   if r["fdc_id"] in fndds_ids}
    sr_values = load_nutrients(sr, sr_ids, NUTRIENT_IDS)
    sr_names = {r["fdc_id"]: clean_name(r["description"]) for r in read_csv(sr, "food.csv")
                if r["fdc_id"] in sr_ids}
    _check_ingredients(sr_names)

    rows = []
    for dish in DISHES:
        kind, _, fdc_id = dish.basis.partition(":")
        if kind == "fndds":
            values, note = fndds_values[fdc_id], (
                f"USDA FNDDS 2021-2023, FDC {fdc_id} ({fndds_names[fdc_id]})")
        elif kind == "sr":
            values, note = sr_values[fdc_id], f"USDA SR Legacy, FDC {fdc_id} ({sr_names[fdc_id]})"
        else:
            values, note = _from_recipe(dish, sr_values), _recipe_note(dish)
        rows.append(_indian_row(dish, values, note))
    print(f"  indian: {len(rows)} dishes")
    return rows


def _check_ingredients(sr_names: dict[str, str]) -> None:
    """An ingredient key must point at the record it claims to — a typo in an
    FDC id would otherwise value a dal with somebody's biscuit."""
    for key, (fdc_id, expected) in INGREDIENTS.items():
        actual = sr_names.get(str(fdc_id), "<missing>")
        if not actual.lower().startswith(expected.lower()):
            raise SystemExit(f"ingredient {key!r}: FDC {fdc_id} is {actual!r}, not {expected!r}")


def _from_recipe(dish: Dish, sr_values: dict[str, dict[str, float]]) -> dict[str, float]:
    """Per 100 g of the COOKED dish: ingredient totals over the cooked weight.

    Water in the recipe carries no nutrients and is there to be evaporated;
    `yield_g` is what is left. No retention factors — they move vitamins, not
    the macros this catalog stores.
    """
    totals = dict.fromkeys(FIELDS, 0.0)
    for key, grams in dish.recipe:
        if key == "water":
            continue
        fdc_id, _ = INGREDIENTS[key]
        per100 = {**sr_values[str(fdc_id)], **OVERRIDES.get(key, {})}
        for field in FIELDS:
            totals[field] += per100.get(field, 0.0) * grams / 100.0
    assert dish.yield_g, dish.slug
    return {field: value * 100.0 / dish.yield_g for field, value in totals.items()}


def _recipe_note(dish: Dish) -> str:
    """The citation for a calculated dish is its recipe. The full recipe is in
    `scripts/indian_foods.py`; this names it and lists as much as fits."""
    parts = ", ".join(f"{key.replace('_', ' ')} {grams:g} g" for key, grams in dish.recipe)
    note = (f"Calculated by FitLog (recipe '{dish.slug}') from USDA SR Legacy values: "
            f"{parts}; cooked weight {dish.yield_g:g} g")
    return note if len(note) <= 240 else note[:239] + "…"


def _indian_row(dish: Dish, values: dict[str, float], note: str) -> dict:
    # Curated figures are rounded to what a home recipe can honestly claim:
    # whole kcal, one decimal for grams, whole mg of sodium.
    rounded = {
        field: (None if values.get(field) is None else
                round(values[field]) if field in ("calories", "sodium_mg") else
                round(values[field], 1))
        for field in FIELDS
    }
    return {
        "ref": f"fitlog-in:{dish.slug}",
        "dataset": "fitlog_indian",
        "name": dish.name,
        "category": "Indian dishes",
        "aliases": list(dish.aliases),
        **rounded,
        "portions": [[label, grams] for label, grams in dish.portions],
        "source_note": (note + (f". {dish.note}" if dish.note else ""))[:300],
        "weight": dish.weight,
    }


# ------------------------------------------------------------------ output

def write_outputs(usda: list[dict], indian: list[dict]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(
        {"format": 1, "releases": [FOUNDATION.zip_name, SR_LEGACY.zip_name], "foods": usda},
        ensure_ascii=False, separators=(",", ":"), sort_keys=True,
    ).encode()
    # mtime=0 so the gzip header does not change between identical builds.
    (OUT_DIR / "usda_fdc.json.gz").write_bytes(gzip.compress(payload, compresslevel=9, mtime=0))
    (OUT_DIR / "indian_foods.json").write_text(
        json.dumps({"format": 1, "releases": [FNDDS.zip_name, SR_LEGACY.zip_name],
                    "foods": indian}, ensure_ascii=False, indent=1, sort_keys=True) + "\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--cache", type=Path, default=API_ROOT / "var" / "fdc")
    args = parser.parse_args()

    print("USDA FoodData Central → app/seed/data")
    usda = build_usda(args.cache)
    indian = build_indian(args.cache)
    write_outputs(usda, indian)
    size = (OUT_DIR / "usda_fdc.json.gz").stat().st_size
    print(f"  wrote {len(usda)} USDA foods ({size / 1024:.0f} KiB gz), {len(indian)} Indian dishes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
