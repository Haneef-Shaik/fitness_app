The DS-1 guard-wiring source phase is done, with no exemption and nothing waiting on DS-4. Nothing was run: every test and source change is unrun, and 0 of 3 Done-when boxes are met. No tool call was denied, nothing was committed, and no sub-agents were used (you said you'd supply the review).

**Changed paths (only the allowed ones)**
- `apps/mobile/scripts/lint-rules/no-literal-color.cjs`: the stronger colour checks below. Its exports didn't change, so the `.d.cts` is untouched.
- `apps/mobile/eslint.config.js`: `colorGuardConfig()` is now wired in. The typography and radius rules, and the older colour selector, are unchanged.
- `apps/mobile/scripts/test-design-rules.cjs`: rewritten to check the new rule against the real config.
- `apps/mobile/src/ui/momentum-assets.ts`: 26 fills changed, plus a typed colour-role map.
- `apps/mobile/src/ui/MomentumAsset.tsx`
- `apps/mobile/src/theme/__tests__/color-guard.test.ts`
- `apps/mobile/src/ui/__tests__/momentum-asset.test.tsx` (new)
- `docs/evidence/DS-1/guard-wiring-2026-11-01.md` (new)
- `docs/plan/runs/DS-1/checkpoint.md` and `handoff.md`: new sections added. Earlier text is kept; I only added phase pointers to the headers and marked superseded statements.

**What the code does now**
- **Assets:** all 26 SVGs are single-colour, so none had to be stopped. Each path's fill is now `currentColor`; everything else in the SVG is byte-for-byte the same, and no hex values remain.
- **Roles:** `momentumAssetRoles` gives each asset a theme colour role, using your mapping. The type checker rejects a missing, extra or misspelt asset or role.
  - In Dark, every role's value equals the asset's original fill, so Dark looks the same.
  - The only callsite that shows a better choice is Today's hero card, and it confirms `onPrimaryContainer`. I changed no role.
  - The design also exported separate Light versions of 7 assets (not bundled). All 7 match the same role's Light value.
- **MomentumAsset:** the colour is `tint` if given, otherwise the asset's role from the current theme. The SVG is passed through unchanged. I removed the colour replacement at render time and the unused `…Light` lookup (no asset has a Light key). The `name`, `size` and `tint` props are unchanged.
- **Visible change (reasoned, not checked on a device):** in Light, the member tab bar icons now use Light colours, matching the design's Light exports. Before, they drew the Dark fills. Nothing else changes, in either theme.
- **Guard:**
  - `tint` and `…Tint` props count as colour props.
  - Named colours are caught in `withTiming`/`withSpring` targets (strings only, so numeric animation targets pass) and in `interpolateColor`'s output range (strings and numbers).
  - Those Reanimated calls are only recognised when they're imported from `react-native-reanimated`, including aliases, namespaces and default imports. Local functions with the same name are not flagged.
  - `PlatformColor` and `DynamicColorIOS` are caught by name as before, and now also through aliases and bracket access.
  - Colours that reach these calls through other variables, wrappers or re-exports are not followed.
  - The exemptions are still only the theme palette files and tests.

**Tests written, not run**
- `color-guard.test.ts`: 101 cases (52 existing, 34 new for the review's L2 bypasses, 15 that run the real `eslint.config.js`). Removing the wiring should fail 10 of them.
- `momentum-asset.test.tsx`: 145 cases. They check no hardcoded colour, byte-identity with the raw Figma exports apart from the fill, Dark matching the original fills, the 7 Light exports, the role map, and role, tint and size in both themes.
- `test-design-rules.cjs`: 13 assertions, run as part of `pnpm lint`.
- Expected mutation results and the commands for a later run are in section 5 of the evidence file. That covers the run that should make box 2's guard fail, a lint probe file, and `expo export` for both platforms.

**Still open**
- **Box 2:** needs the wired guard seen to fail in a real run.
- **Box 1:** its runtime checks and the focus mutations from earlier phases are still pending.
- **Box 3:** needs an Android release build beside Figma.
- **For DS-4:** `imgPlayArrowFill` and `imgSportsGymnastics` use `primaryContainer`, which is lime in Light. Neither has a callsite or a Light export, so pick their roles when a screen uses them.
- **At rebase:** the stronger guard may flag DS-3's `src/motion/**` code on main, which I didn't read. Fix any report at the callsite, not with an exemption.
- **Older colour selector:** kept, so some hex strings get two reports. Removing it is up to the owner of that rule list.
- **`@typescript-eslint/parser`:** still undeclared (QA-9's item); I made no dependency or lockfile edit.
- **`docs/THEMING.md:105-108`:** still says the guard isn't wired. It wasn't an allowed path, so it's a later wording fix.
- **Effective-config tests:** they load Expo's ESLint plugins inside Jest. If one can't load there, only that test block fails, and `test-design-rules.cjs` still checks the wiring under Node.
- **Not verified:** native rendering, screenshots and export.

```
GOAL: DS-1
BRANCH: codex/fitlog-ds1-theme
HEAD: c8a5d57 (base; all changes uncommitted by instruction)
HANDOFF: docs/plan/runs/DS-1/handoff.md
BOXES: 0/3 Done-when boxes met
STATUS: blocked
NOTES: Guard-wiring source phase done (26 fills → currentColor with typed roles, review L2 bypasses closed, colorGuardConfig() wired, no exemption); all UNRUN — box 2 needs a permitted run that sees the wired guard fail (recipe in guard-wiring-2026-11-01.md §5), plus independent review; boxes 1 and 3 still open.
```
