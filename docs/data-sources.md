# Data sources, licences and attribution

FitLog's food catalog and exercise library are **seeded into FitLog's own tables** — Q1 was answered
"internal catalog for v1, grown by seed". Nothing is fetched from a third party at runtime, and
nothing here needs an API key.

This page is the record of where every seeded number comes from and what each source's licence
asks of us. The same attribution is stored in the `food_datasets` table and shown on H-05 under
*Details & source*, so it travels with the data rather than living only here.

---

## Summary

| Dataset (`foods.dataset`) | Rows | Source | Licence | What it asks |
|---|---:|---|---|---|
| `usda_fdc_sr_legacy` | 7,353 | USDA FoodData Central — SR Legacy, April 2018 | Public domain, CC0 1.0 | Name FoodData Central as the source |
| `usda_fdc_foundation` | 325 | USDA FoodData Central — Foundation Foods, April 2026 | Public domain, CC0 1.0 | Name FoodData Central as the source |
| `fitlog_indian` | 138 | FitLog, from USDA FNDDS 2021-2023 and SR Legacy records | Derived from CC0 data | — (we cite USDA anyway) |
| `fitlog_starter` | 22 | FitLog's original starter foods, rounded mostly from SR Legacy | Derived from CC0 data | — |
| exercise library | 297 | Written by FitLog | FitLog's own | — |

About 13,500 household portions come with the foods — USDA's `food_portion` records for the USDA
rows, and FitLog's household measures for the Indian dishes.

---

## USDA FoodData Central

**Licence.** "USDA FoodData Central data are in the public domain and they are not copyrighted. They
are published under CC0 1.0 Universal." USDA asks users to "list FoodData Central as the source of
the data" ([FDC API guide](https://fdc.nal.usda.gov/api-guide)).

**Attribution we show** (`food_datasets.attribution`):

> U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, *SR Legacy,
> April 2018* / *Foundation Foods, April 2026*. fdc.nal.usda.gov. Public domain (CC0 1.0).

**What is imported, and what is not.**

- **Foundation Foods** (2026-04-30 release) and **SR Legacy** (2018-04, the final release) — the
  generic, analysed foods. Foundation republishes some foods under new ids; the newest record of
  each is kept, and where Foundation and SR Legacy publish the same description, Foundation wins.
- **Excluded:** SR Legacy's *Baby Foods* and *Quality Control Materials* categories, and any record
  with no energy value. *Branded Foods* (~400k label records) is not imported at all: it would make
  the repository enormous, most of it is products that come and go, and barcode lookup (H-17) is
  out of v1.
- **FNDDS 2021-2023** (the "Survey" dataset) is not imported wholesale. It is read only for the
  Indian dishes below.

**Normalisation.** Everything is per 100 g (I6). Energy is FDC nutrient 1008, or for Foundation
foods the Atwater-specific (2048) then general (2047) figure; carbohydrate is "by difference" (1005),
falling back to "by summation" (1050); fat is 1004 then 1085; plus fibre (1079), total sugars
(2000 / 1063), saturated fat (1258) and sodium (1093, mg). Values are kept as published, to two
decimals. The "(Includes foods for USDA's Food Distribution Program)" suffix is dropped from names.
Portions are FDC's own (`"1 cup, chopped"`, `"1 large"`), up to eight per food.

Each USDA row has `source = provider`, `external_ref = "fdc:<FDC id>"` and a `source_note` of
`FDC <id>`, so any figure can be checked at `https://fdc.nal.usda.gov/food-details/<id>/nutrients`.

---

## Indian dishes (`fitlog_indian`)

**Why not IFCT 2017.** The Indian Food Composition Tables 2017 (ICMR–National Institute of
Nutrition) are the best source for Indian foods, but they are © NIN, published as a book, and
licensed for no redistribution. The machine-readable copies online are third-party transcriptions:
the [`ifct2017`](https://github.com/ifct2017/ifct2017) package is AGPL-3.0 (formerly MIT) *for its
code*, and a repackager's licence cannot grant rights to NIN's data. The Indian Nutrient Databank
(Anuvaad, 2024) is described as open access but publishes no licence, and its repository asks users
to obtain the NIN table separately. Neither can be shipped in an app. **No IFCT or INDB figure is
used anywhere in FitLog.**

**How each dish is valued instead** — every figure traces to a public-domain USDA record, in one of
three ways (`scripts/indian_foods.py`, the `basis` of each dish):

| Basis | Dishes | Where the number comes from |
|---|---:|---|
| `fndds:<id>` | 32 | The dish exists in USDA FNDDS 2021-2023 (dal, naan, idli, dosa, biryani, samosa, sambar, upma…). Its published values are used as-is |
| `sr:<id>` | 1 | A single SR Legacy food under its Indian name (pav) |
| `recipe` | 105 | Calculated by FitLog from a stated home recipe of SR Legacy ingredients, divided by the cooked weight |

The per-row citation is in `foods.source_note` — e.g. *"USDA FNDDS 2021-2023, FDC 2707427 (Dal)"*
or *"Calculated by FitLog (recipe 'rajma') from USDA SR Legacy values: rajma cooked 400 g, onion
80 g, …; cooked weight 660 g"*. The full recipes, in grams, are in `scripts/indian_foods.py`.

**Honest precision.** Home cooking varies by ±20% or more, almost all of it in the oil. Calculated
dishes are rounded to whole kcal, one decimal of a gram and whole mg of sodium — no more precision
than a recipe can claim — and the dataset's attribution says "treat as an estimate". A test checks
every curated row's energy against its macros (4/4/9 kcal per gram) so a typo cannot hide.

**Stated substitutions** (SR Legacy has no record for these): paneer and chhena are valued as
*queso blanco*, the same acid-set fresh whole-milk cheese, with its sodium dropped because paneer is
unsalted; poha as raw white rice; chana dal and kala chana as chickpeas; jaggery as brown sugar.
Spices under ~1% of a dish's weight are omitted.

**Household portions** are estimates of Indian kitchen measures — 1 katori (small bowl) ≈ 150 g of
dal or sabzi (100 g of curd), 1 plate of rice or biryani ≈ 250 g, a roti ≈ 40 g — alongside FNDDS's
own portions where it has them. A portion only ever fills the gram field; the food stays per 100 g.

**Indian names for USDA staples.** Raw ingredients and plain foods are not duplicated as Indian
rows; instead ~100 USDA rows carry the names people type (`app/seed/foods.py`, `STAPLES`): *atta,
besan, sooji, bhindi, karela, lauki, arbi, chikoo, jamun, ghee, kaju, murmura…*.

---

## Starter foods (`fitlog_starter`)

The 22 foods FitLog shipped with (G7). Figures are rounded, mostly from SR Legacy (chicken breast,
egg, oats, rice, lentils, fruit, nuts, milk…); paneer, roti and whey protein are from typical
product labels. Their names and ids are history — meal items point at them — so they keep their
figures and gained only aliases, portions and this attribution.

---

## Exercise library

All 297 exercises, their muscle mappings, aliases and instructions are **written by FitLog**
(`app/seed/exercise_library/`); no third-party exercise database is used or needed. Instructions
are short, plain descriptions of setup, movement and one cue — not medical or coaching advice.

---

## Regenerating the data

```bash
cd services/api
uv run python scripts/import_usda.py        # downloads the pinned releases into var/fdc (git-ignored)
uv run python scripts/seed_catalog.py        # seeds a database; idempotent, safe on every deploy
uv run python scripts/measure_food_resolution.py   # how many ordinary meal words resolve, and to what
```

`import_usda.py` pins each release URL and writes byte-identical output for identical input, so a
diff of `app/seed/data/` is a diff of the data. The downloads (~13 MB of zips) are never committed;
the committed output is `usda_fdc.json.gz` (~340 KB) and `indian_foods.json` (~85 KB).
