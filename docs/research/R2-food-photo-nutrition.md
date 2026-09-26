# Research brief R2: Estimating nutrition from a food photo, including what the camera can't see

## Your role

Act as a research lead with expertise in dietary assessment, food-composition science and multimodal AI. Produce a fully cited research report and a practical methodology, with reference data tables. We will use them to improve how our app turns a photo of a meal into a nutrient breakdown.

The hardest part of this problem is what a photo doesn't show. That includes the oil, ghee, butter, sugar and cream a dish was cooked with; how it was cooked; and what's inside a curry, a stuffed bread or a sauce. That is where we need the most depth.

Don't ask clarifying questions. Where something is ambiguous, state your assumption and carry on.

## Background

FitLog is a mobile app for logging workouts and nutrition. Its users are 16 and over. They log home-cooked meals, restaurant plates and regional dishes that have no barcode and no recipe, and many of those meals are Indian.

Photo logging works like this today:

1. The user photographs a meal or types a description.
2. The app makes one call to a vision-language model: currently Anthropic's Claude, at temperature 0, with forced structured output. The call returns a list of items. Each item has:
   - a detected name;
   - an estimated quantity with a unit (g, ml, piece, serving or cup);
   - a detection confidence from 0 to 1. This is how sure the model is of *what* the food is, not of the numbers;
   - proposed calories, protein, carbohydrate and fat.
3. The app matches each detected name to our food catalog, which stores values per 100 g. The catalog has two parts:
   - USDA FoodData Central, from SR Legacy and Foundation Foods (public domain).
   - About 140 Indian dishes valued only from USDA data. Each comes either from a USDA FNDDS record (dal, idli, dosa, biryani, sambar and others) or from our own calculation: a written-out home recipe of USDA ingredients, divided by the cooked weight.

   We track energy, protein, carbohydrate, fat, fibre, sugars, saturated fat and sodium. Household portions include Indian measures: 1 katori ≈ 150 g of dal, and 1 roti ≈ 40 g.
4. If nothing in the catalog matches, the item keeps the model's own numbers, labelled as an estimate.
5. The user reviews and corrects every item before anything is logged. Low-confidence items start unticked.

Our current per-item output (schema v1):

```json
{
  "detected_name": "string",
  "estimated_quantity": 0,
  "estimated_unit": "g | ml | piece | serving | cup",
  "confidence": 0.0,
  "proposed_calories": 0,
  "proposed_protein_g": 0,
  "proposed_carbs_g": 0,
  "proposed_fat_g": 0
}
```

Known weaknesses:

- **Hidden ingredients.** A photo can't show oil, ghee, butter, cream, sugar, jaggery, nut and seed pastes, coconut milk, sauces, dressings, marinades, fillings, batter or breading, or shows them only ambiguously. These ingredients carry much of a dish's energy. Our own recipe work suggests home-cooked dishes vary by ±20% or more, mostly because of oil.
- **Cooking changes the numbers.** Water is lost or gained, fat is absorbed in frying, and nutrients are lost. A photo shows only the result.
- **Mixed dishes hide their composition.** Examples are curries, biryani, stews, thalis and casseroles.
- **Portion size** from a single 2D photo is guesswork.
- **One number per nutrient.** We report no range, and only macronutrients.

Any recommendation must respect these constraints:

- **Licensing.** We ship only data we may use commercially and redistribute, which means public domain or permissive licences such as CC0 or CC BY. We deliberately don't use the Indian Food Composition Tables 2017, which are ICMR–NIN copyright with no redistribution licence. We also don't use the Indian Nutrient Databank, which publishes no licence. You may discuss both, but don't give us their figures as data to ship.
- **Cost and latency.** Today we make one model call per analysis, under a daily per-user quota. Any extra call or question must earn its cost.
- **The user stays in control.** AI output is always a proposal that the user confirms.
- **Privacy.** Photos are stripped of location data and sent to the AI provider only with disclosure.

## Research questions

1. **State of the art (2020–2026).** How do current systems estimate nutrition from images? Compare:
   - dedicated pipelines (recognition → segmentation → portion or volume → database lookup);
   - general-purpose vision-language models;
   - hybrids of the two.

   What accuracy do they achieve, as mean absolute error and percentage error for energy and each macronutrient? On which benchmarks, and in which real-world validations? How does that compare with trained dietitians estimating from photos, and with people's own self-reports? Include peer-reviewed evaluations of general-purpose multimodal models (GPT-4-class, Gemini, Claude) on this task.
2. **What commercial apps do.** Use public information only. Examples: MyFitnessPal Meal Scan, Lose It! Snap It, Cal AI, SnapCalorie, Foodvisor, HealthifyMe Snap, and others you find. For each, describe its approach, how it handles hidden ingredients and portions, and what it lets users correct. Say whether any validation has been published.
3. **Portion size.** For each method, say how much it improves accuracy and what it costs the user in effort:
   - reference objects: plate or bowl size, a hand, cutlery, a card;
   - priors from standard servings and household measures;
   - depth sensing (LiDAR or time-of-flight);
   - several photos from different angles;
   - a short video and 3D reconstruction.

   Include density data (g per ml) for converting volume to weight.
4. **Cooking process.** Cover three things:
   - How to infer the cooking method from a photo: deep-fried, shallow-fried, sautéed, tempered (tadka), roasted, grilled, steamed, boiled or curried.
   - How to infer a recognised dish's likely recipe, using a standard recipe as the prior and adjusting it with what the photo shows.
   - How to turn raw ingredients plus a cooking method into the nutrients of the cooked dish. Cover recipe-calculation methods (for example the EuroFIR and FAO/INFOODS guidelines), yield factors (weight change in cooking), nutrient retention factors, and fat absorption in frying by food type and method.

   Give the formulas.
5. **Hidden ingredients.** Cover all of the following, and estimate what share of total error hidden ingredients cause:
   - a taxonomy of what photos typically miss;
   - typical amounts by dish type and cooking method, with ranges;
   - how home, restaurant and street food differ;
   - visual cues such as oil sheen, pooling, browning, and gravy colour and texture;
   - which dishes carry the most uncertainty.
6. **Asking the user.** Find the one to three follow-up questions that reduce error the most, for which dish types, and what each costs in friction. Examples: "Cooked in oil or ghee, and roughly how many spoons?", "Home-made or restaurant?", "Was sugar added?". Include evidence on how to design the questions and how much accuracy they buy.
7. **Indian food.** Cover regional diversity, gravies and tadka, the use of ghee and oil, fried snacks, sweets, breads of different sizes and fat content, thalis with several katoris, and rice-and-curry plates where items mix. Identify open, commercially usable sources for Indian dishes and recipes under the licensing constraint above. Cover other cuisines at a general level.
8. **Which nutrients, and how reliably.** Go beyond energy and macronutrients to fibre, sugars, saturated fat, sodium and micronutrients. Which of these can a photo estimate usefully at all? Our working assumption is that nutrient values must come from a food-composition database, not from the model's own numbers. Test that assumption.
9. **Uncertainty.** How should we estimate and show uncertainty? Consider a likely value plus a range for each nutrient, keeping detection confidence separate from the uncertainty of the estimate, and calibration. How can we show uncertainty without confusing people?
10. **Pipeline design for a vision-language model.** Compare a single call with a multi-step pipeline: identify → break the dish into ingredients → estimate portions and hidden ingredients → look up the database → combine in code. Cover:
    - what the model should do and what deterministic code should do;
    - structured-output design;
    - grounding numbers in database values;
    - consistency: the same photo should give the same answer;
    - the cost and latency of each design.
11. **Evaluation.** Cover public datasets and benchmarks with their licences: is commercial use allowed, what does each measure, and does it include Indian food? Then give:
    - a protocol for building our own test set, using weighed meals photographed in realistic conditions;
    - metrics: energy and macronutrient error, item-detection precision and recall, portion error, hidden-fat error;
    - accuracy targets grounded in the literature.
12. **Safety and trust.** Keep this short and practical. Cover:
    - risks for people with eating disorders, or anyone who shouldn't count calories;
    - never implying allergen or medical safety;
    - honest claims about accuracy;
    - the privacy of meal photos, which can include faces, places and other people.

## What to deliver

Deliver one Markdown report with these sections, in this order:

1. **Executive summary** (one page at most). Say what works and what doesn't. List the ten changes that would most improve our accuracy, ranked by expected error reduction per unit of effort and cost.
2. **Literature and market review.** Answer questions 1 and 2, with a comparison table: approach, data, reported accuracy, validation and source.
3. **Recommended methodology for FitLog.** Give a step-by-step pipeline that answers questions 3 to 10. Show where the model is used and where deterministic data and code take over, and give the formulas.

   Include worked examples for three meals:
   - a home-cooked Indian thali: dal, a sabzi, two rotis, rice and curd;
   - a restaurant curry with naan, such as paneer butter masala;
   - a Western dish where a sauce or dressing carries much of the energy, such as a Caesar salad or pasta in cream sauce.

   For each meal, show the input, every step, the final estimate with ranges, and the follow-up questions that would narrow it.
4. **Hidden-ingredient and cooking-method reference.** The data tables listed below.
5. **Portion reference.** Household measures and reference-object sizes, especially Indian ones, with gram equivalents and sources.
6. **Follow-up question library.** For each question: when to ask it, the answer options, and how each answer changes the estimate.
7. **Proposed output schema v2.** It extends our v1 schema; see the details below.
8. **Evaluation plan.** Datasets, protocol, metrics and targets.
9. **Data and licence register.** Cover every dataset, table and model mentioned: owner, licence, commercial use allowed (yes / no / unclear), attribution required, and URL.
10. **Risks, gaps and open questions,** including every assumption you made.
11. **Bibliography.**

### Data tables

Deliver each table as its own CSV code block so we can import it. Every row needs a `source` (a bibliography number) and a `licence`. Use only data we can use commercially. If the best source isn't usable, say so and give the best usable alternative.

- `cooking_fat_absorption.csv`: food_type, cooking_method, fat_g_per_100g_cooked_low, fat_g_per_100g_cooked_typical, fat_g_per_100g_cooked_high, notes, source, licence
- `yield_factors.csv`: food, cooking_method, cooked_g_per_100g_raw, notes, source, licence
- `hidden_ingredients.csv`: dish_class, cuisine, context (home | restaurant | street), hidden_ingredient, serving_definition, g_per_serving_low, g_per_serving_typical, g_per_serving_high, visual_cues, source, licence
- `portion_references.csv`: item (katori, plate, ladle, tablespoon, roti…), region, applies_to, volume_ml, weight_g, source, licence
- `densities.csv`: food, g_per_ml, source, licence

### Output schema v2

Propose v2 as a JSON Schema, with a filled example for one mixed dish. Keep all the v1 fields so old results stay readable.

Consider adding at least the following:

- the dish's components: ingredients with estimated grams, and the basis for each estimate;
- the cooking method;
- hidden ingredients, with grams, a range and a basis (visual cue, dish prior or user answer);
- the portion method used;
- a likely value and a range for each nutrient;
- detection confidence, kept separate from the uncertainty of the estimate;
- the assumptions made;
- the follow-up questions to ask.

Justify each added field by the error it reduces. Don't add fields for their own sake.

## Evidence and sources

- **Source order.** Prefer peer-reviewed systematic reviews, validation studies and benchmark papers. Then use official food-composition documentation (USDA, FAO/INFOODS, EuroFIR and national food agencies). Then use technical reports and credible preprints, labelled as preprints. Last, use company publications, labelled as self-reported. Don't use content farms, AI-generated listicles or blogs without citations.
- **Citations.** Cite every factual claim inline as [n]. The bibliography gives the authors, title, year, venue, URL or DOI, and the date you accessed it.
- **Accuracy figures.** Report each one exactly as published, with its dataset and metric. Don't compare numbers from different datasets or metrics as if they were equal; say when they aren't comparable.
- **Evidence grades.** Grade evidence as Strong, Moderate, Limited or Expert opinion.
- **Your judgement.** Keep what sources say separate from your own recommendations, and label your judgement.
- **No invented numbers.** If the data doesn't exist, say so, and say how we could measure it ourselves.

## Working rules

- Questions 3 to 6 and question 10 matter most to us. Give them the most depth.
- If you reach an output limit, stop at the end of a section or table, never in the middle of a row. End with `CONTINUE FROM: <section>` and we'll ask you to continue.
- Use metric units. Give nutrients per 100 g unless a row says otherwise.
- Write for our product and engineering team. Nothing here is medical advice.

## Done means

- [ ] Every research question is answered or explicitly marked as a gap.
- [ ] The methodology includes formulas and the three worked examples.
- [ ] Every data-table row has a source and a licence, and rows from sources we can't use commercially are flagged.
- [ ] The v2 schema is valid JSON Schema, and its example validates against it.
- [ ] The licence register covers every dataset and table mentioned.
