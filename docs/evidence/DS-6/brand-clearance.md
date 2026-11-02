# DS-6 · DEC-01 brand clearance: status

> **Status: UNPROVED.** No trademark search, no store-name search and no qualified clearance are on
> record. "FitLog" is a **provisional working name**. This file records that gap and does not close it.
> It is not clearance evidence. It has no structured clearance line, so the generator's guard refuses
> it, and a test checks that.

| Item | State | Source |
|---|---|---|
| Final name chosen | No. "FitLog" is a working name | [OW-2 register](../OW-2/dependency-register.md), DEC-01 and Name rows |
| Trademark search (India, classes 9 and 42; then USPTO and EUIPO; also "FitLog for Gyms") | Not done or not recorded | OW-2 register, DEC-01 "Missing proof" |
| Qualified clearance (a trademark professional) | None | Same |
| Owner-lane card that holds the search | None (gap G-1 in the OW-2 register) | OW-2 register §5 |
| DEC-01 ledger row (`docs/plan/ACCEPTANCE.md`) | `open`. DS-6 is its last prover, so DS-6 writes it only when both boxes are met | ACCEPTANCE row DEC-01 |

## How the generator keeps the name provisional

`apps/mobile/scripts/store-art/brand.config.json` holds the name with `"nameStatus": "provisional"` and
`"clearanceEvidence": null`. The generator refuses `"cleared"` unless `clearanceEvidence` points to a
`docs/evidence/**/*.md` file that exists and contains, at the start of a line:

```text
DEC-01 clearance: <exact app name> · cleared YYYY-MM-DD · <qualified reviewer>
```

Even then, the manifest says clearance is `"recorded"`, never "cleared". A line in a file is not legal
proof. The verifier still has to read the record and judge the reviewer's qualification.

No art carries the name, so changing it later changes only metadata: `manifest.json` and the SVG
titles. The app's `name` in `app.config.ts` and the store listing titles are separate places to update.
The integration patch lists them.

## What closes DS-6 box 2

The owner, or someone the owner engages, records a dated trademark clearance for the final name from a
qualified person, under `docs/evidence/`. Codex cannot supply this under AUTH-01. AUTH-01 excludes legal
positions. After that:

1. Set `brand.config.json` to the final name with `"nameStatus": "cleared"` and `clearanceEvidence`
   pointing at that record.
2. Regenerate and check the art.
3. Update the app name (integration patch).
4. As the last prover, write the DEC-01 ledger row.
