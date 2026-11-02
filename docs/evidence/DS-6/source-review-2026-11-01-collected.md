# Exact independent local Claude final

## DS-6 independent source review (Read/Grep only, nothing executed)

**Verdict: C 0 · H 0 · M 0 confirmed in source (plus 1 M that is a guess) · L 4. DS-6 is not accepted as a whole goal.**

I found nothing in the source that blocks the first runtime pass. I worked the arithmetic and test expectations by hand. Nothing below comes from running code.

### What I checked by hand and found sound
- **Root paths:** `REPO_ROOT` resolves to the repo root in both `generate.mjs:24` and `tests/helpers.mjs:6`. The clearance evidence path rejects `..` (`brand.mjs:36`).
- **Rasterizer** (`raster.mjs`):
  - Edges are half-open and horizontal edges are skipped.
  - The sample-index span arithmetic matches the test numbers: 36 samples for a full pixel, 18 for a half pixel, and the clip case gives `[FULL,0,0,0]`.
  - Compositing is premultiplied correctly. White mask layers come out exactly `#FFFFFF`, because colour and alpha get the same numbers, so their ratio is exactly 1.
- **Safe areas:**
  - The badge tips (Cookie 12 has tips at 0°, 30°, …) land at 409.6 px on the icon (limit 430), 273.1 px on the adaptive layers (limit 312.9) and 273.1 px on the splash icon (limit 341.3).
  - On the 96 px notification icon the tips land at exactly 40.0 px. Any pixel with coverage then has its centre within about 0.59 px of the shape, under the 0.75 px tolerance. Content spans pixels 8 to 87, as the test expects.
  - On the feature graphic, the ring reaches about 41 px from the top and every decoration stays at least 75 px from an edge.
- **Test probe points:** I traced each one through the geometry and they hit the expected colours: ON_BADGE, CENTRE, OUTSIDE, `(512,141)`, `(708,250)` (including the tilted normal where the wave is steep), `(369,107)` and the shape centres.
- **Parser and shapes:** all three shape SVGs are absolute M/L/Z polygons with one path each (viewBoxes 280, 76 and 60). The parser's rejection tests line up with its error messages.
- **PNG:** the CRC test values (`0xCBF43926` and IEND `0xAE426082`) are correct. The corruption test hits the IHDR CRC before the header is parsed.
- **SVG export:** fills use nonzero winding like the rasterizer, and the knockout mask is equivalent for every output that exists today.
- **Brand guard tests:** every rejection case fails for the reason its test names. The real `brand-clearance.md` line 23 (`<exact app name>`) does not match the guard's pattern.

### Findings
- **M (a guess, not proven):** `generate.mjs:349-356` compares compressed PNG bytes. Integration patch §3 puts `store-art:check` into the root `pnpm test`. If Node's zlib compresses differently on the dev Mac (arm64) and on CI Linux (x64), `--check` fails even though the pixels are identical. I can't confirm this from source. The handoff only mentions differences between versions, not between platforms. **Owner:** the DS-6 runtime pass, before §3 is applied.
- **L1:** The handoff (`handoff.md:149-151`) and the integration patch (`:99`) say ESLint lints the `.mjs` files with `ecmaVersion 2022`. `apps/mobile/eslint.config.js:4-9` only shows `eslint-config-expo` plus a rule for `src/**/*.{ts,tsx}`, and `node_modules` is absent. The claim is unverified until `pnpm check` runs. **Owner:** DS-6 runtime pass.
- **L2, latent parity gap:** `raster.mjs:139-149` erases the background too, but `svg.mjs:60` draws the background outside the knockout mask. The two would disagree for a scene with both a background and an erase layer. No current output has both (`generate.mjs:117-120, 150-152`). **Owner:** DS-6.
- **L3:** The clearance guard (`brand.mjs:31-33`) accepts an impossible date such as `2026-99-99`. It also accepts the line anywhere in any `docs/evidence/**.md`, including inside a code fence. The manifest's `"recorded"` wording and the human verifier mitigate this. **Owner:** the DEC-01 verifier.
- **L4:** The scan for unexpected files (`generate.mjs:357-363`) only looks at top-level `.png`, `.svg` and `.json` files. Other file types and subfolders go unflagged. **Owner:** DS-6.

### Notes for the approver, not defects
- The dumbbell uses `dark.surface` rather than `onPrimary`. docs/22:184 says icons on an accent fill use `onPrimary`. This is decision DS6-01, for Codex to confirm.
- On the light splash background (`#FEFCF4`), the lime badge's edge has about 1.1:1 contrast. docs/22:195 allows lime as a filled shape, so this is a visual judgement only.

### Limits of this review
- Nothing was executed: no tests, generation, `--check`, lint, Expo export or mutation checks. The determinism, the 0.97 palette threshold and the zlib question are only reasoned about.
- The external platform rules (art-direction §4) were not checked against current pages.
- Licence provenance of the Material shapes is not verified (art-direction §8).

### State confirmed
- All runtime gates are open.
- `apps/mobile/assets/store-art/` does not exist, so no art has been generated.
- `approval.md` says NOT APPROVED, and `brand-clearance.md` says UNPROVED.
- Both DS-6 boxes are unchecked (`GOALS.md:1059-1060`), and the DEC-01 ledger row is `open` (`ACCEPTANCE.md:115`).
- `app.config.ts` still has `android: {}` and no icon, and neither `package.json` has any store-art script.

### Who owns what's left
- **DS-6 implementer, in a session with a shell:** install, tests, generate, `--check`, `pnpm check`, Expo export, mutation checks.
- **Codex under AUTH-01:** visual approval only, in `approval.md` plus a tracker row.
- **Product owner, or a legal reviewer they engage:** DEC-01 clearance. OW-2 gap G-1 means no card owns it yet.
- **S3/S1 owners of the shared files:** apply the integration patch to `app.config.ts` and the `package.json` files.
- **PL-6:** the notification plugin.
- **PL-7 and PL-8:** checks on release builds, and the live platform rules.

### Smallest correction I'd recommend
No source change is needed before the first runtime pass. Run the tests, generate, then run `--check` on both the dev Mac and the CI platform. If the bytes differ, change `compareWithDisk` (`generate.mjs:355`) to compare the decoded IHDR and pixels (or a hash of them) rather than the compressed bytes. That change touches nothing else.
