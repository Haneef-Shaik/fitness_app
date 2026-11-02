# DS-1 · Mutation checks

**Date** 2026-10-27 · **Environment** local worktree `codex/fitlog-ds1-theme`, Node 22.23.1, Jest 29.7
(jest-expo 57) · Each guard was broken on purpose in the working tree. The named tests below failed, and
the file was restored. After restoring, `git diff -- apps/mobile/eslint.config.js` is empty, the
`momentum.json` SHA-1 is back to `1275a7d…`, and no `MUTATION` marker remains (Grep: no files found).

| # | Guard | How it was broken | What failed (output) |
|---|---|---|---|
| W | Wired design-rule lint (`eslint.config.js` colour selector, run by `pnpm lint`) | Regex changed to `/^(#MUTATED[a-fA-F0-9]{3,8}\|rgba?\\(\|hsla?\\()/` | `node scripts/test-design-rules.cjs` → `AssertionError [ERR_ASSERTION]: The design rules must reject literal colors, font sizes and radii in UI code. actual: 2, expected: 3` |
| A | New rule: hex detection | `colourIn` returned only the functional-colour test | `color-guard.test.ts`: 17 failed, including `✕ rejects a hex style value`, `✕ rejects a hex inside inline SVG markup`, `✕ covers src/theme/theme.ts` |
| B | New rule: exemption scope | Ignore widened from `src/theme/themes/**` to `src/theme/**` | 3 failed: `✕ covers src/theme/theme.ts`, `✕ covers src/theme/ThemeProvider.tsx`, `✕ exempts only the palette definitions and tests` |
| C | New rule: named colours in colour positions | Branch disabled (`false && …`) | 7 failed, including `✕ rejects a named colour`, `✕ rejects a named colour on an SVG paint`, `✕ rejects a colour assignment` |
| D | Generator: stale-curation check (seed moved) | Branch disabled (`false && …`) | `✕ fails every curation when the seed moves, so a seed change cannot pass silently` (pure) and `✕ fails every pin when the seed changes, naming the old and new Material values` (real library) |
| E | Palette contrast and the light-lime rule | `momentum.json` light `dataTrain` hand-edited from `#556D00` to the lime `#CAFD00` | 14 failed, including `✕ light · data · dataTrain on surface ≥ 4.5:1` (×5 surfaces), `✕ is not reused by any ink or stroke role`, `✕ light draws accent graphics with the accent that holds contrast there`, `✕ keeps light-mode graphics dark enough rather than using the lime fill` (existing QA-1 test), `✕ regenerates the committed palette from seed #C6F432 with no diff` |

Commands: `pnpm exec jest --runInBand src/theme/__tests__/<file>` from `apps/mobile`, and
`node scripts/test-design-rules.cjs` for W.

In mutation C, the colour-array and nested-switch fixtures stayed green, because those fixtures also
contain a hex colour, which the rule still reports. Their named-colour halves are covered by the seven
cases that did fail.
