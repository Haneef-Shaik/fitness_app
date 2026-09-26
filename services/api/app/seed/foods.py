"""The global food catalog — Q1's answer: an internal catalog, grown by seed.

Three layers, all seeded into FitLog's own `foods` table (nothing is fetched at
runtime, ever):

1. **The starter foods** below — the 22 rows the app shipped with. Their names
   and ids are history: meal items and recipes point at them. They keep their
   figures and gain aliases, portions and a dataset.
2. **USDA FoodData Central** (Foundation + SR Legacy), ~7,700 foods, loaded
   from `data/usda_fdc.json.gz`, which `scripts/import_usda.py` builds from
   USDA's public-domain release. `STAPLES` layers the names people type
   ("atta", "bhindi", "butter") on top of USDA's descriptions.
3. **Indian dishes** — `data/indian_foods.json`, each valued from a cited USDA
   record or a stated recipe (see `scripts/indian_foods.py`).

**Idempotent**, the same way `catalog.py` is: rows are keyed by
`(source, external_ref)`, re-running adds nothing, and the counts it returns
are rows ADDED. On a row that already exists it never renames and never
overwrites a figure — nutrition is only *filled* where it is NULL — but it does
keep the catalog metadata (aliases, search weight, dataset, category, citation)
equal to this file, because that is curation, not data anyone logged against.
Changing a figure that is already seeded is a data migration, deliberately.
"""
from __future__ import annotations

import gzip
import json
import re
import uuid
from collections.abc import Iterable
from dataclasses import dataclass
from functools import cache
from pathlib import Path

from sqlalchemy import insert, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Food, FoodDataset, FoodPortion, FoodSource

SEED_VERSION = 2

DATA = Path(__file__).parent / "data"

NUTRIENTS = (
    "calories", "protein_g", "carbs_g", "fat_g", "fiber_g",
    "sugar_g", "saturated_fat_g", "sodium_mg",
)
#: Metadata the seed keeps in step with this file on rows it owns.
CURATED = ("aliases", "search_weight", "dataset", "category", "source_note")

_USDA_ATTRIBUTION = (
    "U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, {}. "
    "fdc.nal.usda.gov. Public domain (CC0 1.0)."
)

#: slug, name, publisher, version, licence, licence url, attribution, url
DATASETS: tuple[tuple[str, str, str, str | None, str, str | None, str, str | None], ...] = (
    (
        "usda_fdc_foundation", "USDA FoodData Central — Foundation Foods",
        "U.S. Department of Agriculture, Agricultural Research Service", "2026-04-30",
        "CC0 1.0 (public domain)", "https://creativecommons.org/publicdomain/zero/1.0/",
        _USDA_ATTRIBUTION.format("Foundation Foods, April 2026"),
        "https://fdc.nal.usda.gov/",
    ),
    (
        "usda_fdc_sr_legacy", "USDA FoodData Central — SR Legacy",
        "U.S. Department of Agriculture, Agricultural Research Service", "2018-04",
        "CC0 1.0 (public domain)", "https://creativecommons.org/publicdomain/zero/1.0/",
        _USDA_ATTRIBUTION.format("SR Legacy, April 2018"),
        "https://fdc.nal.usda.gov/",
    ),
    (
        "fitlog_indian", "FitLog Indian dishes",
        "FitLog, from USDA FoodData Central (FNDDS 2021-2023 and SR Legacy)", "1",
        "Derived from CC0 1.0 data", "https://creativecommons.org/publicdomain/zero/1.0/",
        (
            "Values from USDA FoodData Central (FNDDS 2021-2023, SR Legacy; public domain), "
            "or calculated by FitLog from a stated home recipe of SR Legacy ingredients. "
            "Home cooking varies; treat as an estimate."
        ),
        None,
    ),
    (
        "fitlog_starter", "FitLog starter foods",
        "FitLog", "1",
        "Derived from CC0 1.0 data", None,
        (
            "Rounded, mostly from USDA FoodData Central SR Legacy (public domain); "
            "paneer, roti and whey protein from typical product labels."
        ),
        None,
    ),
)

KATORI = ("1 katori (small bowl)", 150.0)


@dataclass(frozen=True, slots=True)
class FoodEntry:
    """One catalog row as this file wants it. Immutable: the seed compares
    these against the database and never edits them in place."""

    key: str                       # external_ref — the natural key
    name: str
    source: FoodSource
    dataset: str
    values: tuple[float | None, ...]  # in NUTRIENTS order
    category: str | None = None
    aliases: tuple[str, ...] = ()
    portions: tuple[tuple[str, float], ...] = ()
    weight: int = 0
    source_note: str | None = None

    def nutrient(self, name: str) -> float | None:
        return self.values[NUTRIENTS.index(name)]

    @property
    def serving(self) -> tuple[float | None, str | None]:
        """The first portion doubles as the legacy single serving."""
        for label, grams in self.portions:
            if len(label) <= 60:
                return grams, label
        return None, None


# --------------------------------------------------------------- starter

# name, kcal, protein, carbs, fat, fiber, aliases, portions — per 100 g, rounded
# as printed on a label. Names are HISTORY: never rename one (see module doc).
STARTER: tuple[tuple, ...] = (
    ("Chicken Breast, skinless", 165, 31.0, 0.0, 3.6, 0.0,
     ("chicken breast", "grilled chicken breast", "chicken breast grilled"),
     (("1 breast", 120), ("1 cup, diced", 140))),
    ("Whole Egg", 143, 12.6, 0.7, 9.5, 0.0,
     ("egg", "eggs", "whole egg", "anda"), (("1 egg", 50), ("2 eggs", 100))),
    ("Greek Yogurt, plain 0%", 59, 10.0, 3.6, 0.4, 0.0,
     ("greek yogurt", "greek yoghurt", "greek curd"), (("1 pot", 170), ("1 cup", 245))),
    ("Rolled Oats", 389, 16.9, 66.3, 6.9, 10.6,
     ("oats", "rolled oats", "jai", "dry oats"), (("1 serving", 40), ("1 cup", 81))),
    ("White Rice, cooked", 130, 2.7, 28.2, 0.3, 0.4,
     ("rice", "white rice", "chawal", "steamed rice", "plain rice", "cooked rice",
      "basmati rice"),
     (("1 cup", 150), KATORI, ("1 plate", 250))),
    ("Brown Rice, cooked", 123, 2.7, 25.6, 1.0, 1.6,
     ("brown rice",), (("1 cup", 150), KATORI)),
    ("Roti / Chapati", 297, 11.0, 46.0, 7.5, 4.9,
     ("roti", "chapati", "chapatti", "chappati", "wheat roti", "rotli"),
     (("1 roti", 40), ("1 small roti", 30))),
    ("Whole Wheat Bread", 247, 13.0, 41.0, 3.4, 7.0,
     ("whole wheat bread", "brown bread", "wheat bread", "atta bread"), (("1 slice", 32),)),
    ("Banana", 89, 1.1, 22.8, 0.3, 2.6,
     ("banana", "bananas", "kela"), (("1 medium", 118), ("1 small", 101), ("1 large", 136))),
    ("Apple", 52, 0.3, 13.8, 0.2, 2.4,
     ("apple", "apples", "seb"), (("1 medium", 182), ("1 small", 149))),
    ("Almonds", 579, 21.2, 21.6, 49.9, 12.5,
     ("almonds", "almond", "badam"), (("1 handful", 28), ("10 almonds", 12))),
    ("Peanut Butter", 588, 25.1, 20.0, 50.4, 6.0,
     ("peanut butter",), (("2 tbsp", 32), ("1 tbsp", 16))),
    ("Olive Oil", 884, 0.0, 0.0, 100.0, 0.0,
     ("olive oil",), (("1 tbsp", 14), ("1 tsp", 4.5))),
    ("Whole Milk", 61, 3.2, 4.8, 3.3, 0.0,
     ("milk", "whole milk", "doodh", "full cream milk"), (("1 cup", 244), ("1 glass", 250))),
    ("Paneer", 265, 18.3, 1.2, 20.8, 0.0,
     ("paneer", "panir", "indian cottage cheese"), (("1 serving", 100), ("1 cube", 15))),
    ("Red Lentils, cooked", 116, 9.0, 20.1, 0.4, 7.9,
     ("red lentils", "lentils", "masoor boiled"), (("1 bowl", 200), KATORI)),
    ("Chickpeas, cooked", 164, 8.9, 27.4, 2.6, 7.6,
     ("chickpeas", "chana", "kabuli chana", "garbanzo beans", "boiled chana"),
     (("1 cup", 160), KATORI)),
    ("Salmon, cooked", 208, 20.4, 0.0, 13.4, 0.0, ("salmon",), (("1 fillet", 150),)),
    ("Broccoli, cooked", 35, 2.4, 7.2, 0.4, 3.3, ("broccoli",), (("1 serving", 90),)),
    ("Potato, boiled", 87, 1.9, 20.1, 0.1, 1.8,
     ("potato", "potatoes", "aloo", "boiled potato"), (("1 medium", 170),)),
    ("Whey Protein Isolate", 370, 85.0, 5.0, 2.0, 0.0,
     ("whey", "whey protein", "protein powder", "protein shake"), (("1 scoop", 30),)),
    ("Dark Chocolate 70%", 598, 7.8, 45.9, 42.6, 10.9,
     ("dark chocolate",), (("2 squares", 20),)),
)



def starter_key(name: str) -> str:
    return "fitlog-starter:" + re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _starter_entries() -> list[FoodEntry]:
    return [
        FoodEntry(
            key=starter_key(name), name=name, source=FoodSource.internal,
            dataset="fitlog_starter",
            values=(kcal, protein, carbs, fat, fiber, None, None, None),
            category="Starter foods", aliases=aliases,
            portions=tuple((label, float(grams)) for label, grams in portions),
            weight=60,
        )
        for name, kcal, protein, carbs, fat, fiber, aliases, portions in STARTER
    ]


# ---------------------------------------------------------------- staples

#: The names people type for foods USDA files under another name. Only
#: foods eaten ON THEIR OWN get a bare name ("butter", "spinach"); an
#: ingredient gets a qualified one ("raw toor dal"), so typing "toor dal"
#: finds the cooked dal and not a sack of lentils.
STAPLES: dict[str, tuple[str, ...]] = {
    # dairy and fats
    "fdc:746782": ("cow milk", "3.25% milk"),
    "fdc:746778": ("2% milk", "reduced fat milk"),
    "fdc:746772": ("1% milk", "low fat milk"),
    "fdc:746776": ("skim milk", "skimmed milk", "fat free milk"),
    "fdc:173410": ("butter", "makhan", "salted butter"),
    "fdc:171314": ("ghee", "desi ghee"),
    "fdc:173414": ("cheddar", "cheddar cheese"),
    "fdc:170845": ("mozzarella", "mozzarella cheese"),
    "fdc:172179": ("cottage cheese",),
    "fdc:171280": ("buffalo milk", "bhains ka doodh"),
    "fdc:171275": ("condensed milk", "milkmaid"),
    "fdc:170859": ("cream", "fresh cream", "malai"),
    "fdc:171284": ("yogurt", "plain yogurt"),
    "fdc:172337": ("mustard oil", "sarson ka tel"),
    "fdc:171410": ("groundnut oil", "peanut oil"),
    "fdc:171017": ("sunflower oil", "refined oil", "vegetable oil"),
    "fdc:171412": ("coconut oil", "nariyal tel"),
    # eggs, meat, fish
    "fdc:171287": ("raw egg",),
    "fdc:173424": ("boiled egg", "boiled eggs", "hard boiled egg"),
    "fdc:172183": ("egg white", "egg whites"),
    "fdc:175304": ("mutton", "goat meat", "cooked mutton"),
    "fdc:171986": ("tuna", "canned tuna"),
    "fdc:175179": ("prawns", "shrimp", "jhinga"),
    "fdc:175176": ("tilapia",),
    # cereals and flours
    "fdc:168878": ("boiled rice", "cooked white rice"),
    "fdc:169704": ("cooked brown rice",),
    "fdc:173905": ("oatmeal", "porridge", "cooked oats", "oats porridge"),
    "fdc:169737": ("pasta", "cooked pasta", "spaghetti"),
    "fdc:174924": ("bread", "white bread", "sandwich bread"),
    "fdc:168917": ("quinoa",),
    "fdc:172475": ("tofu", "firm tofu"),
    "fdc:168877": ("raw rice", "uncooked rice"),
    "fdc:168893": ("atta", "whole wheat flour", "gehun ka atta"),
    "fdc:168894": ("maida", "all purpose flour", "refined flour"),
    "fdc:169715": ("sooji", "suji", "rava", "semolina"),
    "fdc:174288": ("gram flour",),
    "fdc:169714": ("rice flour", "chawal ka atta"),
    "fdc:169697": ("makki ka atta", "maize flour"),
    "fdc:169702": ("bajra", "pearl millet"),
    "fdc:169716": ("jowar",),
    "fdc:169717": ("sabudana", "sago"),
    "fdc:173912": ("murmura", "puffed rice", "kurmura"),
    "fdc:170286": ("kuttu", "buckwheat"),
    "fdc:170682": ("rajgira", "ramdana", "amaranth"),
    # pulses — cooked get the everyday name, raw get a qualified one
    "fdc:172437": ("boiled toor dal", "pigeon peas cooked"),
    "fdc:174257": ("boiled moong", "green gram cooked"),
    "fdc:172427": ("boiled urad", "black gram cooked"),
    "fdc:175194": ("boiled rajma", "kidney beans"),
    "fdc:173759": ("boiled lobia", "black eyed peas"),
    "fdc:169957": ("moong sprouts", "sprouts", "sprouted moong"),
    "fdc:172436": ("raw toor dal", "toor dal raw"),
    "fdc:174256": ("raw moong dal", "moong dal raw"),
    "fdc:174259": ("raw urad dal", "urad dal raw"),
    "fdc:173744": ("raw rajma", "rajma raw"),
    "fdc:173756": ("raw chana", "kabuli chana raw"),
    # vegetables
    "fdc:168462": ("spinach", "palak"),
    "fdc:169260": ("okra", "bhindi", "lady finger"),
    "fdc:169228": ("eggplant", "baingan", "brinjal"),
    "fdc:169986": ("cauliflower", "gobi", "phool gobhi"),
    "fdc:169975": ("cabbage", "patta gobhi"),
    "fdc:169232": ("bottle gourd", "lauki", "ghiya", "dudhi"),
    "fdc:168393": ("bitter gourd", "karela"),
    "fdc:170483": ("drumstick", "moringa pods", "sahjan"),
    "fdc:170393": ("carrot", "gajar"),
    "fdc:170000": ("onion", "pyaz", "kanda"),
    "fdc:170457": ("tomato", "tamatar"),
    "fdc:170419": ("peas", "green peas", "matar"),
    "fdc:169276": ("radish", "mooli"),
    "fdc:168486": ("arbi", "colocasia", "taro"),
    "fdc:169256": ("mustard greens", "sarson"),
    "fdc:169997": ("coriander leaves", "dhaniya", "cilantro"),
    "fdc:173475": ("mint", "pudina"),
    "fdc:170497": ("green chilli", "hari mirch"),
    "fdc:169231": ("ginger", "adrak"),
    "fdc:169230": ("garlic", "lehsun"),
    "fdc:170427": ("capsicum", "shimla mirch", "green pepper"),
    "fdc:168409": ("cucumber", "kheera", "kakdi"),
    "fdc:169251": ("mushroom", "mushrooms"),
    "fdc:169961": ("green beans", "french beans"),
    "fdc:168385": ("amaranth leaves", "chaulai"),
    "fdc:168483": ("sweet potato", "shakarkandi"),
    # fruit
    "fdc:171705": ("avocado",),
    "fdc:169097": ("orange", "santra"),
    "fdc:169910": ("mango", "aam"),
    "fdc:173044": ("guava", "amrood"),
    "fdc:169926": ("papaya", "papita"),
    "fdc:169134": ("pomegranate", "anar"),
    "fdc:174687": ("jackfruit", "kathal"),
    "fdc:167759": ("chikoo", "chiku", "sapota"),
    "fdc:168150": ("jamun",),
    "fdc:174683": ("grapes", "angoor"),
    "fdc:167765": ("watermelon", "tarbooz"),
    "fdc:169124": ("pineapple", "ananas"),
    "fdc:170169": ("coconut", "nariyal"),
    "fdc:170174": ("coconut water", "nariyal pani", "tender coconut water"),
    # nuts, sugar, drinks
    "fdc:170162": ("cashews", "cashew", "kaju"),
    "fdc:172430": ("peanuts", "groundnuts", "moongphali"),
    "fdc:173806": ("roasted peanuts",),
    "fdc:168165": ("raisins", "kishmish"),
    "fdc:169655": ("sugar", "cheeni"),
    "fdc:169640": ("honey", "shahad"),
    "fdc:171890": ("black coffee", "coffee"),
    "fdc:173227": ("black tea", "tea without milk"),
}

#: A staple sits above the rest of USDA but below a curated dish of the same
#: name — "dal" should open on the dish, not on boiled lentils.
STAPLE_WEIGHT = 40

#: Staples that get their names but NOT the boost: ingredients and oddities
#: nobody logs as a meal. Boosting condensed milk put it above plain milk.
NAMED_ONLY = frozenset({
    "fdc:171280", "fdc:171275", "fdc:170859",                      # milks, cream
    "fdc:172337", "fdc:171410", "fdc:171017", "fdc:171412",        # oils
    "fdc:168877", "fdc:168893", "fdc:168894", "fdc:169715",        # rice, flours
    "fdc:174288", "fdc:169714", "fdc:169697", "fdc:169702",
    "fdc:169716", "fdc:169717", "fdc:173912", "fdc:170286", "fdc:170682",
    "fdc:172436", "fdc:174256", "fdc:174259", "fdc:173744", "fdc:173756",  # raw pulses
    "fdc:175176",
})


@cache
def _load(name: str) -> tuple[dict, ...]:
    raw = (DATA / name).read_bytes()
    if name.endswith(".gz"):
        raw = gzip.decompress(raw)
    return tuple(json.loads(raw)["foods"])


def _entry_from_json(row: dict, source: FoodSource) -> FoodEntry:
    aliases = tuple(row.get("aliases", ()))
    weight = row["weight"]
    if row["ref"] in STAPLES:
        aliases = tuple(dict.fromkeys(aliases + STAPLES[row["ref"]]))
        if row["ref"] not in NAMED_ONLY:
            weight = max(weight, STAPLE_WEIGHT)
    return FoodEntry(
        key=row["ref"], name=row["name"], source=source, dataset=row["dataset"],
        values=tuple(row.get(n) for n in NUTRIENTS), category=row.get("category"),
        aliases=aliases, portions=tuple((label, float(g)) for label, g in row["portions"]),
        weight=weight, source_note=row.get("source_note") or _fdc_note(row),
    )


def _fdc_note(row: dict) -> str | None:
    ref = row["ref"]
    return f"FDC {ref.split(':', 1)[1]}" if ref.startswith("fdc:") else None


def catalog() -> list[FoodEntry]:
    """Every global food this file seeds, in a stable order."""
    return [
        *_starter_entries(),
        *(_entry_from_json(r, FoodSource.internal) for r in _load("indian_foods.json")),
        *(_entry_from_json(r, FoodSource.provider) for r in _load("usda_fdc.json.gz")),
    ]


# ------------------------------------------------------------------- seed

async def seed_foods(db: AsyncSession) -> dict[str, int]:
    """Idempotent. Returns how many rows were ADDED, so a caller can assert 0."""
    datasets = await _seed_datasets(db)
    entries = catalog()
    ids, foods = await _seed_food_rows(db, entries)
    portions = await _seed_portions(db, entries, ids)
    return {"food_datasets": datasets, "foods": foods, "food_portions": portions}


async def _seed_datasets(db: AsyncSession) -> int:
    existing = {d.slug: d for d in (await db.scalars(select(FoodDataset))).all()}
    added = 0
    for slug, name, publisher, version, licence, licence_url, attribution, url in DATASETS:
        wanted = {"name": name, "publisher": publisher, "version": version,
                  "licence": licence, "licence_url": licence_url,
                  "attribution": attribution, "url": url}
        row = existing.get(slug)
        if row is None:
            db.add(FoodDataset(slug=slug, **wanted))
            added += 1
        elif any(getattr(row, k) != v for k, v in wanted.items()):
            await db.execute(update(FoodDataset).where(FoodDataset.slug == slug).values(**wanted))
    await db.flush()
    return added


_ROW_COLUMNS = (
    Food.id, Food.name, Food.source, Food.external_ref, Food.serving_grams,
    Food.serving_label, *(getattr(Food, n) for n in NUTRIENTS),
    *(getattr(Food, c) for c in CURATED),
)


async def _seed_food_rows(
    db: AsyncSession, entries: list[FoodEntry]
) -> tuple[dict[str, uuid.UUID], int]:
    """Insert what is missing, keep curation in step; {key: id} and rows added."""
    rows = (await db.execute(
        select(*_ROW_COLUMNS).where(Food.owner_user_id.is_(None))
    )).mappings().all()
    by_key = {r["external_ref"]: r for r in rows if r["external_ref"]}
    # v1 seeded the starter foods by name, with no external_ref. Match those by
    # name once; the backfill below gives them a key for every later run.
    legacy = {r["name"]: r for r in rows if not r["external_ref"]}

    ids: dict[str, uuid.UUID] = {}
    new_rows: list[dict] = []
    for entry in entries:
        row = by_key.get(entry.key)
        if row is None and entry.dataset == "fitlog_starter":
            row = legacy.get(entry.name)
        if row is None:
            new_rows.append(_insert_values(entry))
            ids[entry.key] = new_rows[-1]["id"]
            continue
        ids[entry.key] = row["id"]
        changes = _changes(entry, row)
        if changes:
            await db.execute(update(Food).where(Food.id == row["id"]).values(**changes))

    for chunk in _chunks(new_rows, 1000):
        await db.execute(insert(Food), chunk)
    await db.flush()
    return ids, len(new_rows)


def _insert_values(entry: FoodEntry) -> dict:
    serving_grams, serving_label = entry.serving
    return {
        "id": uuid.uuid4(), "owner_user_id": None, "name": entry.name, "brand": None,
        "source": entry.source, "external_ref": entry.key, "archived": False,
        "serving_grams": serving_grams, "serving_label": serving_label,
        **{n: entry.nutrient(n) for n in NUTRIENTS},
        "aliases": list(entry.aliases), "search_weight": entry.weight,
        "dataset": entry.dataset, "category": entry.category,
        "source_note": entry.source_note,
    }


def _changes(entry: FoodEntry, row) -> dict:
    """What an existing row needs: curation kept in step, gaps filled, and
    never a name or a figure overwritten."""
    wanted = _insert_values(entry)
    changes = {c: wanted[c] for c in CURATED if _differs(row[c], wanted[c])}
    changes |= {
        n: wanted[n] for n in (*NUTRIENTS, "serving_grams", "serving_label")
        if row[n] is None and wanted[n] is not None
    }
    if row["external_ref"] is None:
        changes["external_ref"] = entry.key
    return changes


def _differs(current, wanted) -> bool:
    if isinstance(wanted, list):
        return list(current or []) != wanted
    return current != wanted


async def _seed_portions(
    db: AsyncSession, entries: list[FoodEntry], ids: dict[str, uuid.UUID]
) -> int:
    existing = set((await db.execute(
        select(FoodPortion.food_id, FoodPortion.label)
        .join(Food, Food.id == FoodPortion.food_id)
        .where(Food.owner_user_id.is_(None))
    )).tuples().all())

    new_rows = [
        {"id": uuid.uuid4(), "food_id": ids[entry.key], "label": label,
         "grams": grams, "sort_order": order}
        for entry in entries
        for order, (label, grams) in enumerate(entry.portions)
        if (ids[entry.key], label) not in existing
    ]
    for chunk in _chunks(new_rows, 2000):
        await db.execute(insert(FoodPortion), chunk)
    await db.flush()
    return len(new_rows)


def _chunks(rows: list[dict], size: int) -> Iterable[list[dict]]:
    for start in range(0, len(rows), size):
        yield rows[start:start + size]
