# DS-1 · Palette regeneration from seed `#C6F432`

**Date** 2026-10-27 · **Environment** macOS, Node 22.23.1, pnpm 10.27.0, frozen lockfile,
`@material/material-color-utilities` 0.4.0, `tsx` 4.21.0 · **Base** `c8a5d57` plus the uncommitted
DS-1 diff on `codex/fitlog-ds1-theme` · **Kind** JavaScript tooling result, not a device or release
measurement.

## Result

```text
$ pnpm --filter @fitlog/mobile theme:generate --check
momentum.json matches its recipe: seed #C6F432, Material vibrant 2025, 33 recorded curations, no diff.
```

`--write` rewrites `apps/mobile/src/theme/themes/momentum.json` byte-for-byte: SHA-1
`1275a7d284d125e8dccc0fa5a64f7d5e602744ee` before and after.

## How the palette is generated

`apps/mobile/src/theme/themes/momentum.recipe.json` is the source; `momentum.json` is its output. Each of
the 31 roles is one of:

| Source | Roles | Meaning |
|---|---|---|
| `scheme:<colour>` | 18 | Material `SchemeVibrant(seed, isDark, 0, '2025', 'phone')` |
| `alias:<role>` | 9 | Same value as another role in the same scheme (`dataTrain` = `primary`, `coachContainer` = `surfaceHigh`, …) |
| `brand` | 4 | Fixed: coach violet (`coachInk`, `coachOutline`) and the default gym red (`gymBrand`, `onGymBrand`) |

Where the Figma-approved value differs from Material, a **curation** pins it and records the Material
value it replaces (`mcu`). `--check` fails when:

- a recorded `mcu` no longer equals what the seed gives, for example after a seed or library change;
- a curation has never been recorded;
- the generated text differs from the committed file in any value or in formatting.

## Why 33 curations: the approved palette is not a pure Material output

Search of every Material setting in the installed library against the committed palette (18 seed-derived
roles × 2 schemes = 36 values). It covered 9 scheme classes, specs 2021/2025, platforms phone/watch and
contrast −1, −0.5, 0, 0.5 and 1. To reproduce it from the repo root:
`node --import tsx docs/evidence/DS-1/scheme-search.mjs "$PWD"` ([script](scheme-search.mjs);
read-only). Best rows:

```text
3 SchemeVibrant 2025 phone -1   light.primary light.onPrimary light.onPrimaryContainer
3 SchemeVibrant 2025 phone -0.5 light.primary light.onPrimary light.onPrimaryContainer
3 SchemeVibrant 2025 phone 0    light.primary light.onPrimary light.onPrimaryContainer
1 SchemeContent 2021 phone -0.5 light.onPrimary
```

So the recipe keeps the documented setting (docs/22 §1: Vibrant, 2025, phone, contrast 0). It pins the
33 curated values and takes `light.primary`, `light.onPrimary` and `light.onPrimaryContainer` straight
from the seed. The differences are deliberate curation, not drift:

- Material's neutrals carry a strong yellow cast (`#0F0F00`, `#FFFCC7`);
- its secondary container is yellow (`#636100`);
- its error family leans orange (`#FF7351`).

The approved Figma palette uses warm-grey neutrals and a lime-tinted tonal secondary. This matches
docs/THEMING.md's earlier note that the installed library "produces different values even for the
original seed".

## Per-role report

```text
$ node --import tsx scripts/generate-palette.ts --report   (excerpt; full output has 62 rows)
scheme  role                   source                            material  palette   status
dark    surface                scheme:surface                    #0F0F00   #0E0F0A   curated
dark    primary                scheme:primary                    #D1FF44   #CAFD00   curated
dark    primaryContainer       scheme:primaryContainer           #A5D003   #CAFD00   curated
dark    secondaryContainer     scheme:secondaryContainer         #636100   #414B24   curated
dark    error                  scheme:error                      #FF7351   #FF716C   curated
dark    dataTrain              alias:primary                     -         #CAFD00   alias
dark    coachInk               brand                             -         #CDBDFF   brand
light   surface                scheme:surface                    #FFFBFF   #FEFCF4   curated
light   primary                scheme:primary                    #556D00   #556D00   seed
light   onPrimary              scheme:onPrimary                  #FFFFFF   #FFFFFF   seed
light   primaryContainer       scheme:primaryContainer           #CEFC41   #CAFD00   curated
light   onPrimaryContainer     scheme:onPrimaryContainer         #495E00   #495E00   seed
light   dataTrain              alias:primary                     -         #556D00   alias
```

## Tests that hold this

- `src/theme/__tests__/palette-generator.test.ts` runs the real CLI under tsx: it regenerates with no
  diff, fails all 33 pins for seed `#FF5A1F`, fails a hand edit naming `dark.coachInk`, fails a
  formatting-only drift, prints a candidate without writing, and exits 2 on a usage error.
- `src/theme/__tests__/palette-recipe.test.ts` covers the pure logic with a fake Material source:
  - canonical round trip;
  - every role mapped exactly once;
  - pins agree with the committed palette;
  - stale and unrecorded detection;
  - aliases follow their target;
  - `--record` keeps pinned values and does not mutate its input;
  - 17 malformed-recipe rejections;
  - diff, report and argument parsing.

## Bootstrap record (one-time)

The first recipe pinned all 36 values with `mcu: null`. `--check` refused it with 36 lines of the form
`dark.surface: curation #0E0F0A has no recorded Material value (the seed gives #0F0F00). Run
theme:generate --record.` One `--record` run then recorded 33 Material values and dropped 3 pins Material
already matches: `Recorded 33 curations against seed #C6F432; 3 now come straight from the seed.
Pinned values are unchanged.`
