# CT-1 · Provenance and review of the launch exercise catalogue

Content version `2026-10-27.1` · written 27 October 2026 · attempt 1 · branch `codex/fitlog-ct1-content`.

This note covers card box 1 (provenance metadata on every record), box 4 (Hindi or G14.hi backlog) and
the DEC-16 "seed rights" input. Box 2 (starter programmes) is in `starter-programmes-review.md`.

## 1. Source decision

**Every record is original FitLog text. No external text, data file or media was copied, imported or
adapted.**

- The coordinator required a real permissive or public-domain primary source, with its exact licence
  and version verified, before any content was adapted.
- This session had no web access: no WebFetch or WebSearch tool was available, and the shell was denied.
  No licence page, repository or dataset could be opened, so no licence could be verified.
- Adapting text whose licence I could not read would break DEC-16 and the "never copy unlicensed
  instructions" rule. Inventing 200 provenance claims was ruled out too.
- So the catalogue was written new. Each record carries this provenance, and the validator rejects any
  record without it:

  ```json
  { "source": "fitlog-original", "sourceVersion": "2026-10-27", "licence": "LicenseRef-FitLog-Original", "method": "authored" }
  ```

- `content/catalogue.json` registers the source. Its statement says who wrote the text, when and how,
  and that no external source was consulted.
- The seed also writes this provenance into `public.exercises.source`, for example
  `fitlog-original@2026-10-27; licence LicenseRef-FitLog-Original; slug barbell-back-squat`.

### What is factual and what is authored

| Field | Nature |
|---|---|
| Exercise names, aliases | Common descriptive names of standard movements |
| Muscles, equipment, movement pattern | Descriptive anatomy and equipment facts, mapped to FitLog's own taxonomy |
| Logging type, load basis, multiplier, reps per side | FitLog product rules (PRD §6.1), applied per record |
| Instructions (2–4 sentences) | Written new for FitLog; neutral movement cues only |

### For the owner and counsel (DEC-16)

- The instructions were written by an AI model (Claude Opus 5.5) acting as the CT-1 implementer. In some
  jurisdictions, text written by an AI without human authorship may not attract copyright. That does
  not stop FitLog from using it. It may limit FitLog's ability to stop others copying it. This is a
  counsel question, not an engineering one; CT-1 does not answer it.
- The DEC-16 ledger row stays `open`. CT-1 is not its last prover (QA-5 is), and nothing here is a
  licence, a legal approval or a clearance.

### Candidate external sources, not used

These come from the project's own notes of 7 October 2026, not from anything checked in this session.
Before adopting any of them, someone must open the primary licence and record it as an `external` source
with `verified.evidence` under this folder. The validator refuses an external source without that.

| Candidate | Licence per earlier notes | Why not adopted now |
|---|---|---|
| `hasaneyldrm/exercises-dataset` (metadata and instructions, Hindi included) | MIT, unverified here | Licence not readable this session; upstream origin of the text not established |
| `yuhonas/free-exercise-db` | Unlicense claim, unverified here | Same; the origin of its instruction text is not documented |
| wger exercise data | CC-BY-SA, unverified here | Share-alike is outside the permitted list until the owner decides |
| RepDB community edition | Attribution licence for images | Media, not instruction text; media licences are not a launch dependency (PRD §6.1) |

The validator's permitted external licences are `CC0-1.0`, `Unlicense`, `0BSD`, `MIT`, `BSD-2-Clause`,
`BSD-3-Clause`, `Apache-2.0` and `CC-BY-4.0`.

## 2. Writing method

- Each instruction describes set-up, the movement and the return, in 2–4 plain sentences in the second
  person. Unilateral and single-arm records say how to log them: per side, or per leg.
- **No health, medical or safety claims.** No record says an exercise is safe, prevents injury, treats a
  condition, burns fat or suits a medical group. The validator's `CLAIM_TERMS` list rejects such words,
  and the tests plant three such claims to prove it. Safety guidance and any health claim need a primary
  reference and qualified review. Neither exists yet, so the text makes none.
- Quotes, backslashes, dollar signs and control characters are refused, so no text can break the seed's
  SQL literal or dollar quoting.

## 3. Review record

| Review | By | Date | Scope and method | Status |
|---|---|---|---|---|
| Technical self-review | Claude Opus 5.5, the CT-1 implementer (AI). Not independent | 2026-10-27 | Read every record once against PRD §6.1 logging rules, the muscle and equipment taxonomy, the 2–4 sentence rule and the no-claims rule. Duplicate names and aliases were checked by hand and are also enforced by the validator | Done, for attempt 1 |
| Independent technical review | The coordinator's reviewer | — | Planned next phase | Open |
| Qualified human review of every instruction | A person, at **OW-13** | — | PRD §6.1 calls for "human-reviewed" exercises; OW-13 is the plan's step for it | **Open: not claimed** |

No qualified human review is claimed, implied or recorded as done. `catalogue.json` records
`"qualified": { "status": "pending", "gate": "OW-13" }`. The validator would refuse an "approved" entry
without a named reviewer, date and qualification.

### Runtime proof vs source review

- **Source review (done):** the records and code were read and checked by hand, as above.
- **Runtime proof (not done this session):** the shell was denied, so neither
  `node --test scripts/content/*.test.mjs` nor `node scripts/content/build-seed.mjs check` has run. The
  counts below are hand counts. The `check` command's summary line is the authority once it runs.

## 4. Inventory (hand count; confirm with `build-seed.mjs check`)

| Category | Exercises |
|---|---|
| barbell (barbell, EZ bar, trap bar) | 37 |
| dumbbell | 46 |
| machine (incl. Smith machine and back extension bench) | 32 |
| cable | 29 |
| bodyweight (incl. bench, bars, ab wheel, box) | 46 |
| kettlebell | 17 |
| band | 17 |
| cardio | 14 |
| **Total** | **238** (minimum 200; at least 8 per category) |

- Muscle hierarchy: 7 regions and 21 muscles. Each exercise maps to it with a role, primary
  (weight 1) or secondary (weight 0.5). This is the "canonical hierarchy" architecture 003 §7 asks of
  CT-1. The schema for it is MB-2's.
- Equipment: 27 types, each in one PRD category.
- Logging types used: resistance, bodyweight (with `assistance` for the assisted pull-up, assisted dip
  and band-assisted pull-up), timed (holds, carries, conditioning) and distance (cardio).

## 5. Hindi (box 4)

Every record carries `"hi": "G14.hi"`, an explicit per-record listing for G14.hi. No Hindi was written.
Unreviewed machine-quality Hindi would still need G14.hi's qualified reader. The card allows "or is
listed for G14.hi".

- Records listed (hand count): 7 regions, 21 muscles, 27 equipment types, 238 exercises,
  3 programmes and 10 programme days, so **306**.
- `node scripts/content/build-seed.mjs hi-backlog` prints the list, with the fields each record needs
  (`name`, plus `instructions` for exercises and `description` for programmes).
- The validator accepts either the marker or real Hindi (`{ name, instructions }` containing Devanagari).
  A test shows that a translated record leaves the backlog.
