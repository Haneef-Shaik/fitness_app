# DS-6 · App icon, splash and store art: art direction and generator record

> **Status: source only. Nothing has been generated, rendered or run.** This session's shell was
> denied, including `rtk`-prefixed commands, so no `pnpm install`, no test run and no generator run
> happened. Everything below is the design as written in code. There is no runtime proof and no image
> that a person has looked at. The exact commands that produce and check the art are in
> [§7](#7-commands).

## 1. What is drawn

**The mark.** The repo's own Momentum **Cookie 12** shape (`apps/mobile/assets/momentum/imgCookie12.svg`,
exported from the Momentum Figma file) is the badge, filled in volt lime. A **dumbbell** sits inside it,
built from five capsules (a bar and two stepped plates each side) and rotated -45°. The dumbbell is
filled in the near-black ground colour, so it reads as a cut-through to the ground. In the
single-colour layers (the Android themed icon and the notification icon), the dumbbell is a real
knockout.

**Why this mark.** docs/22 §1: "every screen has one loud thing", in volt lime on the near-black ground,
and the expressive shapes are "used as badges and stickers". docs/22 §9 says the icon and store art
"must follow the accent … in volt lime on the near-black ground". The cookie badge is the same sticker
language as the record and check-in celebrations, so the icon belongs to the app it opens. The
dumbbell tells people at a glance that this is a training app. It is drawn from primitives, not copied
from the Material `fitness_center` glyph.

**No wordmark.** The final name is not cleared (DEC-01), so no raster or vector art carries a name. The
name appears only in `manifest.json` and in the SVG `<title>` elements. A test proves that a different
name leaves every PNG byte-identical.

**Feature graphic (1024 × 500).** The badge sits in the centre. Around it is a Material 3 Expressive
**wavy ring**, the same motif as the Momentum rest timer: a full neutral track (`surfaceHighest`) with a
270° tonal progress arc (`secondaryContainer`). Four Momentum shapes (Clover 4 and Cookie 9, from the
same Figma export) sit in tonal and neutral colours as quiet decoration. Only the badge is vivid. There
is no text, no rating, no claim and no UI.

## 2. Colour roles (all from `apps/mobile/src/theme/themes/momentum.json`)

| Role | Token | Hex | Used for |
|---|---|---|---|
| ground | `dark.surface` | `#0E0F0A` | Icon and feature-graphic ground; adaptive `backgroundColor`; splash dark background |
| badge | `dark.primaryContainer` | `#CAFD00` | The badge, the one loud thing |
| glyph | `dark.surface` | `#0E0F0A` | The dumbbell (a cut-through to the ground) |
| track | `dark.surfaceHighest` | `#252620` | Feature-graphic ring track and small shapes |
| tonal | `dark.secondaryContainer` | `#414B24` | Feature-graphic progress arc and large shapes |
| notification | `light.primary` | `#556D00` | Android notification colour (see below) |
| splashLight | `light.surface` | `#FEFCF4` | Splash light background (already in `app.config.ts`) |
| splashDark | `dark.surface` | `#0E0F0A` | Splash dark background (already in `app.config.ts`) |

The generator reads the theme file at run time and pins its sha256 in the manifest. It holds no copy
of any palette value. The one literal colour is `#FFFFFF` for the Android monochrome and notification
layers. That white is a platform requirement (the system tints the silhouette), not a theme colour.

**Notification colour = `light.primary` `#556D00`, not lime.** Android uses the notification colour for
the small icon and the app name, which are small, thin marks, often on a light shade. docs/22 §4 and §9
say lime is "1.1:1 against Light paper" and must never be "a thin line or small text on Light
surfaces". `#556D00` is the token docs/22 gives for the accent "as a graphic or figure" on paper
(5.3:1).

**docs/22 rules kept.** One accent plus neutrals. Volt lime appears only as the large filled badge. No
green "success" colour and no green chart series. No violet, which is reserved for the coach. No gym
red.

## 3. Geometry and safe areas

Mark units: the *visible icon* is 1.0 wide, with the origin at its centre. For an adaptive icon that is
the 72 dp viewport. For an iOS or Play icon it is the whole square. Badge lobe tips are at radius 0.40,
the valleys at about 0.362. The dumbbell's farthest point is at 0.27, so it never touches the badge
edge.

| Asset | Size | Channels | Content scale | Badge tip radius | Safe area the generator enforces | Margin |
|---|---|---|---|---|---|---|
| `icon.png` | 1024² | RGB, no alpha | 1 | 409.6 px | Circle r = 0.42 × size = 430 px (inside the iOS and Play corner masks) | 20 px |
| `play-store-icon.png` | 512² | RGBA, every alpha 255 | 1 | 204.8 px | Circle r = 0.42 × size = 215 px | 10 px |
| `adaptive-foreground.png` | 1024² | RGBA | 72/108 | 273.1 px | Circle r = 33/108 × size = 312.9 px (the 66 dp safe zone) | 39.8 px |
| `adaptive-monochrome.png` | 1024² | RGBA, white only | 72/108 | 273.1 px | Same 66 dp safe zone | 39.8 px |
| `splash-icon.png` | 1024² | RGBA | 72/108 | 273.1 px | Circle r = 1/3 × size = 341.3 px (Android 12+ splash icon mask) | 68.2 px |
| `notification-icon.png` | 96² | RGBA, white only | (20/24)/0.8 | 40 px | Circle r = 10/24 × size = 40 px (the 20 dp live area) | 0 px plus anti-aliasing; bounding box tested to 8…87 |
| `play-feature-graphic.png` | 1024 × 500 | RGB, no alpha | — | 150 px | Nothing within 32 px of any edge (the ring's top reaches about 41.8 px) | ≥ 9 px |

**The guard.** `assertContentInside` checks every output pixel before anything is written. A content
pixel is alpha > 0 on a transparent layer, or any colour other than the ground on opaque art. If one
falls outside the safe area, generation fails with the asset, the pixel and the rule. A pixel centre
may sit up to 0.75 px past a shape's edge and still carry anti-aliased coverage, so that is the only
tolerance.

## 4. Platform rules the outputs follow

These come from the implementer's knowledge of the official documentation. **They were not fetched
again in this session (no web tool was available).** Check them against the live pages before
submission (PL-7, PL-8):

| Rule | Source |
|---|---|
| App Store icon: 1024 × 1024, PNG, no transparency or alpha, square (the system applies the corner mask) | Apple HIG, App icons; App Store Connect screenshot and icon specs |
| Expo `icon`: a 1024 × 1024 PNG; Expo generates the other sizes | `@expo/config-types` 57 `ExpoConfig.icon` (read locally from the installed package) |
| Adaptive icon: 108 dp layers, a 72 dp visible viewport, a 66 dp safe zone; monochrome layer for Android 13+ themed icons | developer.android.com, Adaptive icons; `@expo/config-types` 57 `android.adaptiveIcon` (read locally) |
| Android 12+ splash: the icon without a background must fit a circle two-thirds of its box | developer.android.com, Splash screens |
| `expo-splash-screen` plugin props: `image`, `imageWidth`, `resizeMode`, `backgroundColor`, `dark` | `expo-splash-screen` 57.0.10 `plugin/build/types.d.ts` (read locally) |
| Notification small icon: a white silhouette on transparent, 24 dp grid | developer.android.com, Notifications; Material system icon grid (20 dp live area) |
| Google Play icon: 512 × 512, 32-bit PNG, up to 1024 KB, full square (Play applies the mask and shadow) | Play Console Help, Add preview assets |
| Google Play feature graphic: 1024 × 500, JPEG or 24-bit PNG with no alpha | Play Console Help, Add preview assets |

## 5. How the generator stays deterministic

- **Inputs only from the repo:** the theme JSON, three Momentum shape SVGs and `brand.config.json`. It
  makes no network call and uses no clock or randomness.
- **Geometry snapped to a 1/256 px grid** after transformation, so last-bit differences in `Math.sin`
  cannot move an edge.
- **Coverage is an integer sample count** on a fixed 6 × 6 grid per pixel (non-zero winding), and
  compositing is plain IEEE arithmetic in a fixed order.
- **PNGs have no timestamp or ancillary chunks:** filter 0 and `zlib` level 9. Same pixels and same
  zlib give the same bytes. `manifest.json` has no timestamps or machine paths, and a test checks that.
- **`--check` regenerates in memory** and reports any missing, edited or unexpected file in
  `apps/mobile/assets/store-art/`.

The determinism claim is **unverified at runtime**. The test "produces byte-identical files on a second
run" proves it once it is run.

## 6. Not generated, on purpose

| Item | Why |
|---|---|
| Store screenshots | They must show the real UI from a release build (PL-7, PL-8). Drawing or mocking them would misrepresent the product. |
| Wordmark or any text | DEC-01: the final name is not cleared. |
| iOS 26 layered icon (Icon Composer `.icon`) | It needs Apple's Icon Composer. The flat 1024 px icon is the supported fallback. |
| iOS dark and tinted icon variants | Optional. The icon is already dark-ground, and iOS derives a tinted version. Add them later if review wants them. |

## 7. Commands

Run these from the repo root after `pnpm install --frozen-lockfile`. Node is 22.23.1 (`.node-version`).
The generator needs no package, but `pnpm check` lints its files.

```bash
rtk node --test apps/mobile/scripts/store-art/tests/*.test.mjs   # unit + integration tests
rtk node apps/mobile/scripts/store-art/generate.mjs              # write apps/mobile/assets/store-art/
rtk node apps/mobile/scripts/store-art/generate.mjs --check      # drift check (exit 1 on drift)
rtk pnpm check                                                    # lint covers the new .mjs files
```

## 8. Provenance and licence notes (not a legal opinion)

- **Cookie 12, Cookie 9 and Clover 4** are this project's Figma exports. docs/22 §1 says Momentum uses
  "12 shapes from the expressive library", meaning the Material 3 Expressive shape set. The implementer
  believes that library is published under Apache-2.0 (Jetpack/Compose `MaterialShapes`). **That was not
  verified in this session.** Whether a generic library shape may anchor a registered brand mark belongs
  to the DEC-01 clearance, not to this goal.
- **The dumbbell** is original geometry made from capsules. It copies no icon font or glyph path.
- **No font, photo or third-party raster** is used. The art contains no text.
