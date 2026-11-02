# Launch content (CT-1)

The launch exercise catalogue and the three starter programmes, as versioned data. Nothing here is a
development fixture: `supabase/development-catalogue.sql` remains the local fixture until wiring
replaces it (see `docs/plan/runs/CT-1/handoff.md`).

| Path | Holds |
|---|---|
| `catalogue.json` | Manifest: content version, file list, provenance sources, review record |
| `exercises/muscles.json` | The canonical muscle hierarchy: 7 regions, 21 muscles |
| `exercises/equipment.json` | Equipment, each in one of the 8 PRD §6.1 categories |
| `exercises/<category>.json` | Exercises, one file per category |
| `programmes/starter-programmes.json` | The three starter programmes and their prescriptions |

## Rules the validator enforces

`node scripts/content/build-seed.mjs check` runs `scripts/content/catalogue.mjs`. It refuses:

- fewer than 200 exercises, or fewer than 8 in any category;
- a record without provenance (`source`, `sourceVersion`, `licence`, `method`) that resolves to a
  registered source;
- an external source without an https URL, a permitted licence (no NC, ND or SA terms) and a recorded
  verification under `docs/evidence/CT-1/`;
- duplicate slugs, names or aliases (names and aliases share one search space);
- logging semantics PRD §6.1 forbids, for example assistance on a resistance exercise or load on a
  distance exercise. The multiplier is derived from `loadBasis` and `repsPerSide`, never typed: per-hand
  without `repsPerSide` (bilateral) is 2; per-hand with `repsPerSide` is 1, whether one-arm or two
  dumbbells worked one leg at a time; every other load basis is 1. `singleArm` needs per-hand and
  `repsPerSide` but does not set the multiplier;
- instructions outside 2–4 sentences, or with a health, medical or safety claim;
- quotes, backslashes, dollar signs or control characters anywhere (they could break the seed);
- a record with neither Hindi text nor the `"G14.hi"` backlog marker;
- a starter prescription outside PRD §6.2 bounds, or one that does not fit its exercise's logging type;
- a programme without a technical review entry, or with a qualified review marked approved without a
  reviewer, date and qualification.

## Changing content

- A slug is permanent: the catalogue id is a version-5 UUID of the slug. Renaming creates a new exercise.
- A changed exercise needs `version` raised by one. The seed refuses to overwrite an existing row and
  stops with an error if the stored row differs, so an edit without a new version fails loudly.
- External text may be added only after its licence and version are verified and recorded as a source
  of kind `external`. Do not copy instructions from any site or dataset without that record.
- No instruction may make a health, medical or safety claim. Those need a primary reference and the
  qualified review at OW-13.

## Commands

```bash
node scripts/content/build-seed.mjs check              # validate; one summary line
node scripts/content/build-seed.mjs sql --out <f.sql>  # idempotent exercise seed (never into supabase/migrations/)
node scripts/content/build-seed.mjs templates          # starter programmes in the persisted days contract shape
node scripts/content/build-seed.mjs hi-backlog         # every record listed for G14.hi
node --test scripts/content/*.test.mjs                 # unit tests; no database
node scripts/content/verify-seed.mjs                   # database proof; serialized phase only, local stack only
```
