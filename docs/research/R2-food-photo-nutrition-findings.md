# R2 — Food-photo nutrition: verified findings (research pass 1)

- **Brief:** [R2-food-photo-nutrition.md](R2-food-photo-nutrition.md)
- **Date:** 2026-09-26
- **Method:** deep-research workflow (run `wf_bc134e5e-212`). It searched 5 angles, read 24 primary sources and extracted 120 claims. The top 25 claims were each checked by 3 independent reviewers; a claim survived unless 2 of 3 refuted it. 19 survived and 6 were refuted.
- **Raw material:** all 120 extracted claims, with verbatim quotes, are in [R2-extracted-claims.md](R2-extracted-claims.md). They are leads, not evidence.

> **This is not yet the full R2 deliverable.** Pass 1 answers Q1 and Q4 well and parts of Q2, Q3, Q5, Q8 and Q10. It has no data tables, no v2 schema and no worked examples. The [coverage table](#coverage-against-the-brief) shows exactly what's missing, and [What pass 2 must cover](#what-pass-2-must-cover) lists the next steps.

Evidence grades follow the brief: **Strong**, **Moderate**, **Limited** or **Expert opinion**. Text marked **Judgement** is our own recommendation, not a finding from a source. Citations [n] refer to [Sources](#sources).

---

## Bottom line

1. **A single VLM call is not accurate enough on its own numbers.** On 52 controlled photos of weighed food, energy MAPE was 35.8% for both GPT-4o and Claude 3.5 Sonnet, and 64.2% for Gemini 1.5 Pro [1]. A 2026 preprint testing ten VLMs on 3,229 Nutrition5k images found calorie MAPE of 39.8–120.4% [2]. The two studies use different datasets and metrics, so they can't be ranked against each other. (Moderate / Limited)
2. **Macronutrients are worse than energy, and fat is the hardest.** Protein MAPE was 60.7–109.9%, carbohydrate 47.9–72.8% and fat 41.7–89.6% across the three models in [1]. Two 2026 peer-reviewed studies identify fat as the main source of difficulty [3][4]. The direction of the fat error changed with the setting. (Moderate)
3. **Grounding numbers in a database is the best-supported design.** In DietAI24 the model identifies each food and picks a standard FNDDS portion. Code then maps that portion to grams and computes nutrients from FNDDS [5]. It reported 47.7 kcal energy MAE per dish on ASA24 images, against 168–277 kcal for Foodvisor, SnapCalorie, Calorie Mama and a ViT baseline. That test is partly in-distribution, so the true gap is probably smaller. (Moderate for the approach, Limited for the size of the gap)
4. **The cooking-transformation maths is settled and belongs in code.** USDA, Bognár (hosted by FAO) and EuroFIR give consistent formulas for yield, true retention, recipe calculation and fat uptake in frying [6][7][8][9]. See [Formulas](#q4-formulas-for-cooked-dishes-verified-code-ready). (Strong)
5. **Extra photo angles and self-critique passes didn't help.** Using 1 to 5 images gave no significant gain (RMSLE 0.627 vs 0.623, p = 0.182) [4]. In one preprint, a second self-critique pass was equal to or worse than a single pass on every metric [2]. (Moderate / Limited)
6. **Licensing traps:**
   - The USDA Retention Factors table is CC0 but covers only micronutrients, sodium and alcohol. It has no factors for energy or macronutrients [6].
   - Bognár's yield and fat-uptake tables state no licence, so we can't ship them yet [8].
   - An unverified lead says the FAO/INFOODS Density Database is "All rights reserved" [14].
7. **None of the evidence covers Indian food.** Every verified study used Western, Japanese or Swedish meals.

**Judgement:** keep one model call. The model identifies foods and components, picks catalog portions, labels the cooking method and names hidden-fat candidates with its visual cues. Deterministic code does the database lookup, applies yield, retention and fat-uptake factors, and computes ranges. Any extra budget should go on one closed-form follow-up question about cooking fat or meal source for oil-heavy dishes, not on more photos or a second model pass.

---

## Coverage against the brief

| Brief item | Status after pass 1 | Where |
|---|---|---|
| Q1 State of the art and accuracy | **Answered** for general VLMs. The dietitian comparison failed verification, and self-report is covered in one line | [Q1](#q1-accuracy-of-general-vlms) |
| Q2 Commercial apps | **Partial.** The only evidence is DietAI24's third-party API test. How the apps work and any validations they published were not found | [Q2](#q2-commercial-apps-partial) |
| Q3 Portion size | **Partial.** Only the multi-angle result is verified. Reference objects, LiDAR, video and densities are unverified leads | [Q3](#q3-portion-size-partial) |
| Q4 Cooking process | **Answered** for formulas, yields and frying fat. **Gap:** inferring cooking method from a photo, and Indian methods such as tadka, bhuna and puri | [Q4](#q4-formulas-for-cooked-dishes-verified-code-ready) |
| Q5 Hidden ingredients | **Partial.** The finding that fat drives error is verified. **Gap:** amounts by dish and context, visual cues, and the share of total error | [Q5](#q5-hidden-fat-partial) |
| Q6 Follow-up questions | **Gap.** The leads conflict: see [unverified leads](#unverified-leads-for-pass-2) | — |
| Q7 Indian food and open sources | **Gap.** One CC BY street-snack lead exists | — |
| Q8 Which nutrients | **Partial.** Supports taking values from the database. Fibre, sodium and micronutrients are unverified leads | [Q8](#q8-database-values-vs-model-numbers-partial) |
| Q9 Uncertainty and calibration | **Gap.** One lead on run-to-run variability | — |
| Q10 Pipeline design | **Partial.** Grounding and the no-second-pass finding are verified. Cost and latency are unverified leads | [Q10](#q10-pipeline-design-partial) |
| Q11 Evaluation datasets and licences | **Gap** | — |
| Q12 Safety and trust | **Gap** | — |
| Data tables (5 CSVs) | **Not produced.** Only a handful of yield figures are verified, and those come from Bognár, whose licence is unclear | — |
| v2 JSON Schema + example | **Not produced** | — |
| Three worked examples | **Not produced** | — |
| Licence register | **Partial** | [Licences](#licence-notes-partial-register) |

---

## Verified findings

### Q1: Accuracy of general VLMs

**Fridolfsson et al. 2025 [1]:** peer-reviewed; 2024 model versions; 52 photos (16 single foods and 36 meals, each meal at 3 portion sizes). Reference values came from Dietist NET using USDA data. Metric: MAPE (95% CI).

| Model | Energy | Weight | Protein | Carbohydrate | Fat |
|---|---|---|---|---|---|
| ChatGPT-4o | 35.8% (27.3–45.1) | 36.3% | 60.7% (42.0–80.5) | 47.9% (35.9–61.7) | 51.8% (38.1–70.7) |
| Claude 3.5 Sonnet | 35.8% (27.9–44.7) | 37.3% | 61.7% (44.0–83.1) | 72.8% (34.9–141.7) | 41.7% (32.4–53.1) |
| Gemini 1.5 Pro | 64.2% (45.0–86.9) | 65.0% | 109.9% (79.2–145.6) | 66.1% (47.5–87.3) | 89.6% (46.9–152.1) |

- The confidence intervals overlap widely and the paper doesn't test the differences between models, so don't rank them on these point estimates.
- These are 2024 models and don't show how current Claude models perform.
- The authors compare the results with self-report, whose energy errors are 20–50% in doubly-labelled-water studies (extracted but not separately fact-checked).
- **Grade: Moderate.** Single study, controlled photos, no Indian food.

**Sterling et al. 2026 [2]:** preprint, not peer-reviewed. Ten VLMs on 3,229 Nutrition5k images.
- Gemini 3.0 Flash was best on calories: CCC 0.767, MAE 80.7 kcal.
- Across models, calorie MAPE ran 39.8–120.4% and weight MAE 53.7–97.6 g.
- Errors stayed high "even when the correct food components were identified".
- Only calories and weight were reported, with no macronutrients.
- **Grade: Limited.**

**Failed verification (don't use):**
- Isobe et al.'s comparison with registered dietitians [3]: the per-model energy and fat figures are internally inconsistent.
- The Claude Haiku 4.5 figures from [2].

### Q2: Commercial apps (partial)

The only verified figures are a third-party test through the apps' APIs, not validations the companies published [5]:

- **Data:** ASA24 images, 3,000 of them (1,000 FNDDS food codes at 3 portion sizes each).
- **Energy MAE per dish:** DietAI24 47.7 kcal, Foodvisor 168, SnapCalorie 169, ViT 199, Calorie Mama 277.
- **Caveats:**
  - The authors warn that ASA24's controlled photos may overstate real-world performance.
  - Both the ASA24 ground truth and DietAI24's lookups come from FNDDS, so DietAI24 has an in-distribution advantage over the apps' black boxes.
- **Grade:** Moderate for the approach, Limited for the size of the gap.

DietAI24's reported "63% MAE reduction" on Nutrition5k **failed verification (0-3)**. Don't cite it.

**Gap:** no verified public information on how MyFitnessPal Meal Scan, Lose It! Snap It, Cal AI, HealthifyMe Snap or Foodvisor handle hidden ingredients, portions or user correction.

### Q3: Portion size (partial)

**Multiple angles don't help VLMs [4]:**
- Accuracy with 1, 2, 3 or 5 images was not significantly different: mean RMSLE 0.627 with 1 image vs 0.623 with 5, Friedman p = 0.182.
- The study had about 80% power to detect Cliff's δ 0.30, and the observed effect was |δ| ≤ 0.21.
- The best model, GPT-5-chat, improved about 5.7% with 3–5 images, which was not significant.
- **Caveats:**
  - The extra angles were frames from the Nutrition5k lab rig, not photos taken by users.
  - The outcome was RMSLE averaged over kcal and macronutrients; portion error was not measured.
- **Grade: Moderate.**

The same study found good smartphone photos beat controlled lab images (RMSLE 0.548 vs 0.616, p = 0.020). That comparison is confounded, though: 16–23 Italian dishes shot by one person, with different ground truth.

**Portions as a choice from a list [5]:**
- DietAI24 treats portion estimation as multiclass classification over FNDDS household-portion descriptors, then maps the choice to grams.
- Portion-classification accuracy fell from 86.7% for the smallest portions to 68.4% for the largest.
- This matches FitLog's catalog portions, such as katori and roti.

**Judgement:** don't ask users for extra angles. Reference objects, LiDAR and video were not verified in this pass; see the [leads](#unverified-leads-for-pass-2).

### Q4: Formulas for cooked dishes (verified, code-ready)

All formulas below were checked 3-0 against the primary documents [6][7][8][9]. **Grade: Strong** for the definitions, and Moderate for tabulated values that come from a single region's recipes.

**Symbols**

| Symbol | Meaning |
|---|---|
| `W_raw` | Raw, ready-to-cook weight in g, excluding cooking water and frying fat |
| `W_cooked` | Cooked edible weight in g, weighed hot after a brief rest |
| `N_raw`, `N_cooked` | Nutrient per g (or per 100 g) of raw and cooked food |
| `TR` | True retention factor, as a fraction |
| `RF_i` | Retention factor for ingredient `i` |
| `YF` | Yield factor = `W_cooked / W_raw` |

**1. Cooking yield [7][8]**

```
YF = W_cooked / W_raw                  (USDA: Yield % = 100 × W_cooked_hot / W_raw)
```

Bognár defines yield against ready-to-cook ingredients, excluding cooking water and frying fat. If water is counted, the factor depends on batch and pot size. In his risotto example, the yield is 0.76 or 0.92 with water included, depending on batch size, and a constant 3.00 without it [8].

**2. True and apparent retention [6][8]**

```
TR  = (N_cooked × W_cooked) / (N_raw × W_raw)
⇒  N_cooked = TR × N_raw × (W_raw / W_cooked) = TR × N_raw / YF

AR  = N_cooked(dry-weight basis) / N_raw(dry-weight basis)   # only when weights are unknown
```

Bognár's version, `a = (Z / X) × e`, is the same thing, with `e` = cooked edible weight ÷ ready-to-cook weight.

**Pitfall:** USDA's own worked example (spinach vitamin C: 28 mg/100 g × 0.85 = 23.8 mg per 100 g cooked) silently assumes a yield of 1.0 [6]. Don't copy that shortcut; always divide by the yield.

**3. Recipe calculation: EuroFIR harmonised procedure [9]**

Yield is applied at recipe level and retention per ingredient:

```
W_cooked_total      = (Σ_i W_raw,i) × YF_recipe
N_per_100g_cooked   = Σ_i ( N_i,per_100g × W_raw,i × RF_i ) / W_cooked_total
```

- Per-ingredient check from the source: cabbage at 30 µg/100 g × 1000 g × 0.70 / 2255 g = 9 µg/100 g. That is cabbage's share only; the dish total is 12.6 µg/100 g.
- EuroFIR chose this procedure because it is the most commonly used, not because it was shown to be the most accurate.

**Alternative: USDA retention-factor method (Powers and Hoover 1989), as described in [9]**

```
W_cooked          = W_raw_edible + Δmoisture_g + Δfat_g
N_per_100g        = N_recipe_total / (W_cooked / 100)
```

**Bognár, per 100 g of dish [8]**

```
Q_j = [ Σ_i E_j,i × x_i / 100 ] × A_j
  E_j,i = nutrient j per 100 g of ingredient i
  x_i   = g of ingredient i per 100 g of cooked dish
  A_j   = category-average retention factor for nutrient j
```

**4. Frying fat [8][9]**

- Count only the fat actually absorbed. Enter it as a recipe ingredient with a fat retention factor of 1.00, and don't apply any other retention factor to it.
- Bognár's fat uptake per 100 g of ready-to-cook ingredients:

```
C = D_cooked × e − D_raw
  D_cooked = fat per 100 g cooked dish
  D_raw    = fat per 100 g raw ingredients
  e        = yield factor
```

  The printed equation (8) has a typo, `C = (C × e) − D`; the formula above is the only reading that works dimensionally.
- Average uptakes from Bognár's German potato recipes: pan-fried potato cake 4.00 g, deep-fried French fries 5.00 g per 100 g ready-to-cook [8].
- **Our arithmetic (unverified):** assuming the Table 31 uptake row and the 0.54 yield describe the same French-fry product, 5.00 / 0.54 ≈ 9.3 g of absorbed fat per 100 g of cooked fries.
- The Slovak databank's "assume 50% of frying fat is absorbed" is a user convention, not a measurement [9].
- **Don't mix methods:** Bognár's `e` already includes absorbed fat in the cooked weight. Use either the Bognár approach or the Powers and Hoover approach, never both.

**5. Tabulated yields from Bognár [8]** (cooked g per g raw; mean ± 95% CI, n)

| Food | Method | Yield |
|---|---|---|
| Long-grain polished rice | Boiled | 2.98 ± 0.05 (140) |
| Durum pasta, egg-free | Boiled | 2.10 ± 0.20 (4) |
| Egg noodles | Boiled | 2.60 ± 0.08 (239) |
| Lentils, dried | Boiled or stewed | 2.73 ± 0.06 (6) |
| French fries, from fresh raw potato | Deep-fried | 0.54 ± 0.04 (13) |

**Licence: unclear, don't ship.** The Bognár report states no licence. Use the public-domain USDA equivalents instead: AH-102 and FNDDS or SR Legacy raw–cooked pairs (see the [leads](#unverified-leads-for-pass-2)).

**Judgement:** how thick a dal is (how much water it keeps) changes its energy per katori far more than the dry-to-cooked yield does. Model dal consistency as its own variable, or ask about it.

**6. Grounded lookup [5]**

```
N_item = v_j (per 100 g, from the DB) × grams(portion_choice) / 100 ;  N_meal = Σ N_item
```

**Gap:** the verified sources say nothing on **inferring the cooking method from a photo**, or on Indian methods such as tadka, bhuna, puri and pakora.

### Q5: Hidden fat (partial)

- **Fat drives dish-level difficulty [4].** Difficult-tier dishes had 8.4× the fat RMSLE of easy dishes (1.855 vs 0.220). The ratio probably compares the worst dishes with the best, which inflates it. RMSLE has no sign, so it can't show whether fat was over- or underestimated.
- **The direction of the error depends on the kitchen [3][4].**
  - Isobe's abstract says all 10 models overestimated fat on Japanese hospital meals. The authors suggest models can't tell visible oil from what was absorbed, or fall back on standard recipes that assume more fat than a hospital kitchen uses (vote 2-1). They recommend supplying cooking metadata and keeping a human in the loop.
  - Vedovelli's authors, working on Nutrition5k, read their results as underestimation of invisible oils and emulsified sauces.
  - Both explanations are the authors' interpretation, not measurements.
- **Grade: Moderate** that fat is the main source of error. **Limited** on the cause.

**Judgement:** a fixed recipe prior will be biased in different directions in different contexts. Treat hidden fat as an explicit, adjustable part of each estimate, with grams, a range and a basis, and let a user answer about source (home, restaurant or street) or cooking fat move it.

**Gaps:**
- Amounts by dish class and context.
- Visual cues such as sheen, pooling and gravy colour.
- The share of total error caused by hidden ingredients.
- Anything specific to Indian dishes.

### Q8: Database values vs model numbers (partial)

- The model's own macronutrient numbers are its least reliable output [1], and database grounding gave the lowest reported error [5].
- **Judgement:** this supports FitLog's working assumption that nutrient values should come from the composition database. Unverified leads extend it to sodium, fibre and micronutrients (see below).
- **USDA Retention Factors R6 [6]** (CC0 on data.gov): 26 components for about 290 foods (270 retention codes). The components are vitamins, minerals including sodium (Nutr_No 307), alcohol and choline. It has **no energy, protein, fat or carbohydrate factors**, and no yield or fat-uptake data. Macronutrient changes in cooking must come from yield and fat-uptake handling.

### Q10: Pipeline design (partial)

- **Grounding [5]:** the model identifies foods and picks a portion from the database's own portion list; code does the gram mapping and nutrient maths. Verified (3-0), though the paper doesn't state outright that the lookup runs outside the model.
- **Prompt wording vs a second pass [2]** (preprint, vote 2-1):
  - A "visible-portion" prompt raised calorie CCC from 0.693 to 0.744, with 42.0% of predictions within 25% of the label.
  - A two-pass self-critique was equal or worse on every metric.
  - Only Gemini 2.0 Flash was tested, on Nutrition5k, without significance tests.
  - Self-critique is not the same as decomposition. The result doesn't rule out decomposing the dish inside the single call.
- **Gap:** cost and latency of each design, and consistency (whether the same photo gives the same answer). See the leads.

### Rejected claims (don't cite)

| Claim | Source | Vote |
|---|---|---|
| Models underestimated more as portions grew, even with a plate, fork and knife in frame as scale references | [1] | 1-2 |
| Claude Haiku 4.5 had the lowest ingredient-recognition score; its calorie figures | [2] | 0-3 |
| GPT-4o and Gemini made about twice the energy error of dietitians on 15 hospital meals | [3] | 1-2 |
| Every model overestimated fat by +34% to +52% | [3] | 0-3 |
| Model choice explained 99.6% of variance, and prompts and temperature didn't matter | [4] | 1-2 |
| DietAI24 cut MAE by 63% on Nutrition5k (68.2 vs 168.5 kcal) | [5] | 0-3 |

---

## Unverified leads for pass 2

These were extracted, with verbatim quotes, from primary sources, but **not fact-checked**. Several bear directly on the questions the brief ranks highest (Q3–Q6 and Q10). Full quotes are in [R2-extracted-claims.md](R2-extracted-claims.md).

| # | Lead | Source | Bears on |
|---|---|---|---|
| L1 | Image only gave energy MAPE 30.5%. Adding non-visual descriptors (fat type and amount, sweetener, dairy fat, meat type) gave 24.4%, and a full ingredient list 13.9%. Lipid MAE fell from 8.70 to 5.92 g with descriptors alone | [15] ChatGPT-5, 195 dishes | Q5, Q6: the main evidence that asking about fat and sugar helps |
| L2 | Free-form follow-up questions made energy **worse** on 100 Nutrition5k images (MAE 148.9 → 161.8 kcal, wide CIs). The authors think the model second-guessed itself on ambiguous answers. Users wanted to skip questions for simple foods | [16] preprint | Q6: conflicts with L1. Suggests closed-form answers applied by code, not fed back to the model |
| L3 | Giving the total dish mass was the single most useful cue for every model. Calorie error fell from about 51% to about 29% with per-ingredient mass. Oils and dressings stayed wrong even with nearly all cues | [17] thesis | Q3, Q5, Q6 |
| L4 | A recipe-prior step moved signed energy bias from −123 to +37 kcal on Chinese dishes. The grounded pipeline averaged 2.8 model calls per meal. Direct MLLM estimates now match or beat retrieval for energy, but grounding improves portion estimates | [18] preprint | Q5, Q10: cost of multi-step designs, and recipe priors for non-US food |
| L5 | Decompose-then-compute (with oil and cooking method) helped GPT-4o (calorie MAE 89.3 → 78.5 kcal) but hurt Qwen2.5-VL and, on one dataset, Gemini 2.0 Flash. The image must be passed again in step 2 | [19] | Q10 |
| L6 | Deterministic settings did **not** make repeated estimates identical. Salt and fibre varied most from run to run; energy varied least | [20] | Q8, Q9, Q10: consistency |
| L7 | Adding depth to the image cut mass MAE from 29.5% to 13.7% on Nutrition5k. With the true mass supplied, calorie error was 9.5% vs 26.1% without it, so portion estimation roughly triples the error | [11] | Q3 |
| L8 | Depth-sensing iPhone X (SNAQ app): weight MAE 14.0%, energy 12.7%, fat 12.3%. About 23 s per meal; the user picked each food from a list | [12] | Q3 |
| L9 | A reference card plus two photos: 12.8% of real-world captures had to be discarded, and 52% of users made at least one capture error | [13] | Q3: user cost of reference objects |
| L10 | **The FAO/INFOODS Density DB v2 is "All rights reserved"** and commercial reproduction may incur fees. Many rows come from USDA FNDDS, which is public domain | [14] | Densities, licensing |
| L11 | AH-102 (USDA, public domain) yields: white rice boiled 308% (243–375%); lentils 261–289%; chickpeas 207%; french-fried potatoes 55%; doughnuts absorb 10–14% fat | [22] | yield_factors.csv, from a shippable source |
| L12 | FNDDS has had no fat-change factor since 2015–16; cooking fat is entered as an explicit ingredient. FNDDS portion weights are not valid for working out density | [21] | Q4, portions |
| L13 | Indian street snacks, measured by gas chromatography (CC BY). Fat per 100 g: samosa about 29 g, kachori 32–47 g, bread pakora 26–48 g, loose namkeen up to 65 g. Vanaspati was used in some doughs | [23] | Q5, Q7: shippable street-food fat data |
| L14 | Irish Indian takeaway: chicken tikka masala averaged 523 g, 223 g more than the UK standard-portion database. Peshwari naan was 748 kcal. Pilau rice had about 100 kcal more than boiled | [24] (licence unclear) | Q5, Q7: restaurant priors |
| L15 | Plain GPT Vision's per-nutrient success rate (as the paper defines it) was 79% for energy and 81% for fibre, but only 26% for fat, 30% for sugars, 18% for saturated fat and 18% for sodium. The "Fats, Oils and Salad Dressings" food category was identified 0% of the time | [5] | Q5, Q8 |

---

## Licence notes (partial register)

| Dataset or table | Owner | Licence | Commercial use | Status |
|---|---|---|---|---|
| USDA Nutrient Retention Factors R6 | USDA ARS | CC0 1.0 (data.gov) | Yes | Verified [6] |
| USDA Cooking Yields for Meat and Poultry R2 | USDA ARS | US federal work, public domain (assumed) | Yes (assumed) | Unverified [7] |
| USDA AH-102 Food Yields (1975) | USDA ARS | US federal work, public domain (assumed) | Yes (assumed) | Unverified [22] |
| USDA FNDDS 2019–2020 | USDA ARS | Public domain | Yes | Already used by FitLog [21] |
| Bognár 2002 yield and retention tables | BFE Karlsruhe (hosted by FAO) | None stated | **Unclear** | Verified that no licence is stated [8] |
| EuroFIR D2.2.12 recipe procedures | EuroFIR | Unclear. Methods aren't copyrightable data (judgement) | Methods yes, text unclear | [9] |
| FAO/INFOODS Density DB v2.0 | FAO | "All rights reserved" | **No** without permission | Unverified [14] |
| Nutrition5k dataset | Google | Not confirmed (possibly CC BY 4.0) | Unclear | Unverified [11] |
| Gupta et al. 2016 | Authors / journal | CC BY (stated by the searcher) | Yes, with attribution | Unverified [23] |
| safefood Indian takeaway report | safefood | Copyright; terms unclear | Unclear, cite only | Unverified [24] |
| IFCT 2017 | ICMR–NIN | Copyright, no redistribution licence | **No** | From the brief |
| Indian Nutrient Databank | — | No licence published | **No** | From the brief |

---

## Open questions

1. What licence covers Bognár 2002? Can we ship its yield and fat-uptake figures, or must yields come only from USDA sources (AH-102, Meat and Poultry R2, FNDDS/SR raw–cooked pairs)?
2. How much hidden fat, in commercially usable data, goes into Indian cooking by dish and context? Examples: tadka, bhuna gravies, makhani gravies, puri, pakora, samosa, paratha, ghee on roti. If none exists, we'll need to run our own weighed-recipe measurements.
3. How much do 1–3 closed-form follow-up questions reduce energy and fat error on weighed meals, and what do they cost in user friction? L1 and L2 conflict.
4. How do current Claude models perform on Indian thalis and mixed dishes? Does grounding still help when a dish isn't in FNDDS and has to be built from a recipe prior?
5. Our internal figure of "±20% variation, mostly from oil" is unverified.

## What pass 2 must cover

1. **Fact-check the highest-value leads:** L1–L3 and L6 for Q6 and Q9; L7–L9 for Q3; L10–L13 for licensing and data we can ship.
2. **Search again for the gaps:**
   - Q2: how commercial apps work.
   - Q4: inferring cooking method from a photo.
   - Q5 and Q7: Indian hidden-fat amounts and open Indian recipe sources.
   - Q9: calibration and how to display uncertainty.
   - Q11: benchmark datasets and their licences.
   - Q12: safety.
3. **Build the deliverables from public-domain sources only:**
   - The five CSVs, from USDA AH-102, the Meat and Poultry R2 yields, FNDDS portion weights and SR Legacy household measures.
   - The v2 JSON Schema, with an example that validates against it.
   - The three worked examples.
   - The full licence register.

---

## Sources

Accessed 2026-09-26 unless noted. [1]–[9] were used in verified findings; [10]–[24] appear only in unverified leads or licence notes.

1. Fridolfsson J, Sjöberg E, Thiwång M, Pettersson S. Performance evaluation of 3 large language models for nutritional content estimation from food images. *Current Developments in Nutrition*. 2025;9(10):107556. https://doi.org/10.1016/j.cdnut.2025.107556 (peer-reviewed)
2. Sterling S, Berube LT, Glenn AJ, Shaukat A, Barua S, Grams ME, Tsirigos A. Vision-language models for image-based dietary assessment: a benchmark of accuracy, cost, and prompt strategies across ten models. *bioRxiv*. 2026. https://www.biorxiv.org/content/10.64898/2026.07.26.740845v1 (**preprint**)
3. Isobe T, Zhang LW, Murakami H, Kadono M, Aso M, Kayashita A, Kayashita J. Accuracy of AI-based nutrient estimation from standardized hospital meal images: a comparison with registered dietitians. *Nutrients*. 2026;18(6):966. https://doi.org/10.3390/nu18060966 (peer-reviewed)
4. Vedovelli L, Pugnaloni S, Lanera C, Sabbatini D, Bhuyan MJ, Lorenzoni G, Gregori D. Model architecture dominates nutritional estimation accuracy in vision-language systems. *Scientific Reports*. 2026;16:29227. https://doi.org/10.1038/s41598-026-58755-w (peer-reviewed)
5. Yan R, Luo H, Lu J, et al. DietAI24 as a framework for comprehensive nutrition estimation using multimodal large language models. *Communications Medicine*. 2025. https://doi.org/10.1038/s43856-025-01159-0 (peer-reviewed)
6. USDA ARS Nutrient Data Laboratory. USDA Table of Nutrient Retention Factors, Release 6. 2007. https://catalog.data.gov/dataset/usda-table-of-nutrient-retention-factors-release-6-2007 ; PDF: https://www.ars.usda.gov/ARSUserFiles/80400525/Data/retn/retn06.pdf (official documentation, CC0)
7. USDA ARS. USDA Table of Cooking Yields for Meat and Poultry, Release 2. 2014. https://www.ars.usda.gov/ARSUserFiles/80400535/Data/retn/USDA_CookingYields_MeatPoultry02.pdf (official documentation)
8. Bognár A. Tables on weight yield of food and retention factors of food constituents for the calculation of nutrient composition of cooked foods (dishes). BFE-R-02-03. Bundesforschungsanstalt für Ernährung, Karlsruhe; 2002. https://www.fao.org/uploads/media/bognar_bfe-r-02-03.pdf (technical report; licence not stated)
9. Reinivuo H, Laitinen K. Proposal for the harmonisation of recipe calculation procedures. EuroFIR Deliverable D2.2.12; 2007. https://www.fao.org/uploads/media/reinivuvo_laitinen_2007_Eurofir_recipe_harmonisation_D2.2.12_M2.2.4_02.pdf (technical report)
10. Vásquez-Caicedo AL, et al. EuroFIR Deliverable D2.2.9 on recipe calculation rules. 2007. https://www.fao.org/uploads/media/vasquez-caicedo_et_al__2007_recipe_rulesD2.2.9_02.pdf (technical report; used only as corroboration in [Q4](#q4-formulas-for-cooked-dishes-verified-code-ready))
11. Thames Q, et al. Nutrition5k: towards automatic nutritional understanding of generic food. *CVPR*. 2021. https://arxiv.org/abs/2103.03375
12. Herzig D, et al. Volumetric food quantification using computer vision on a depth-sensing smartphone: preclinical study. *JMIR mHealth and uHealth*. 2020. https://pmc.ncbi.nlm.nih.gov/articles/PMC7142738/
13. Vasiloglou MF, et al. The human factor in automated image-based nutrition apps: analysis of common mistakes using the goFOOD Lite app. *JMIR mHealth and uHealth*. 2021;9(1):e24467. https://pmc.ncbi.nlm.nih.gov/articles/PMC7840289/
14. Charrondière UR, Haytowitz D, Stadlmayr B. FAO/INFOODS Density Database, Version 2.0. FAO; 2012. https://www.fao.org/food-composition/tables-and-databases/detail/(global--2012)-fao-infoods-density-database---version-2/en
15. Rodríguez-Jiménez, et al. Image-based dietary energy and macronutrients estimation with ChatGPT-5: cross-source evaluation across escalating context scenarios. *Nutrients*. 2025;17(22):3613. https://doi.org/10.3390/nu17223613
16. Bakar, et al. SnappyMeal: design and longitudinal evaluation of a multimodal AI food logging application. *arXiv* 2511.03907. 2025. https://arxiv.org/abs/2511.03907 (**preprint**)
17. Bhatambarekar. Conversational multimodal LLMs for food nutritional information retrieval: a systematic evaluation. Master's thesis, Virginia Tech; 2025. https://vtechworks.lib.vt.edu/items/b67c2a61-f283-41ba-9602-9798306b9529 (**grey literature**)
18. Coburn, Yue, Ma, Raghavan, Vinod, Zhu. Open-KNEAD: knowledge-grounded nutrition estimation via agentic decomposition. *arXiv* 2607.12911. 2026. https://arxiv.org/abs/2607.12911 (**preprint**)
19. Khlaisamniang, et al. Decomposing food images for better nutrition analysis: a nutritionist-inspired two-step multimodal LLM approach. *CVPR Workshops (MTF)*. 2025:482–491. https://openaccess.thecvf.com/content/CVPR2025W/MTF/html/Khlaisamniang_Decomposing_Food_Images_for_Better_Nutrition_Analysis_A_Nutritionist-Inspired_Two-Step_CVPRW_2025_paper.html
20. Wang, Lane, Waki. Toward robust AI-assisted dietary assessment for diabetes self-management: quantifying and decomposing LLM prediction variability from meal images. *JMIR Diabetes*. 2026;11:e102715. https://doi.org/10.2196/102715
21. USDA ARS Food Surveys Research Group. FNDDS 2019–2020 documentation. 2022. https://www.ars.usda.gov/ARSUserFiles/80400530/pdf/fndds/2019_2020_FNDDS_Doc.pdf
22. Matthews RH, Garrison YJ. Food yields summarized by different stages of preparation. USDA Agriculture Handbook No. 102; 1975. https://www.ars.usda.gov/ARSUserFiles/80400530/pdf/ah102.pdf
23. Gupta V, et al. Unhealthy fat in street and snack foods in low-socioeconomic settings in India. *Journal of Nutrition Education and Behavior*. 2016. https://pmc.ncbi.nlm.nih.gov/articles/PMC4826272/
24. safefood. Nutrition Take Out series: What's in your Indian takeaway? 2015. https://www.safefood.net/professional/research/wraps-indian-takeaway (agency report, not peer-reviewed)

*Nothing here is medical advice.*
