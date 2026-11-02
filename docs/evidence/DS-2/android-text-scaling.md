# DS-2 box 3 · English and Devanagari at 100% and 200% on an Android release build

**Status: BLOCKED. No capture exists.** This session had no Android device or emulator and no
release-build permission. The coordinator also ruled out device builds in this parallel phase.
Nothing below is a measurement. It is the exact procedure and pass rule for whoever holds the
device gate.

## What blocks it

| Need | State on 27 Oct 2026 |
|---|---|
| Android release build (APK/AAB, release variant) of the merged commit | not built (device builds out of scope for this phase) |
| Reference low-end Android (PRD §23.1; model in `docs/evidence/devices.md` once QA-11 records it) | not available to this session |
| A screen that renders the type specimen in both scripts | not present. The dev gallery is S5/DS-4's file and shows only 3 styles; see the handoff's requests |
| `AppText` using `theme.devanagariTypography` and `theme.maxFontSizeMultiplier` | not yet; `src/ui/` is DS-4's (handoff request R1). Until then Hindi renders with `AppText`'s older ×1.2 rule |

## Procedure

1. Build a release variant of one `main` commit that includes DS-2 and the R1 `AppText` change. Name it
   by version, build number and commit.
2. Install on the reference low-end Android (Android 12 class), and on one Android 14+ device. The
   Android 14+ device is needed to test the non-linear line-height risk in README §4.
3. Open a specimen that renders every variant in `theme.typography` with the English sample, and
   every variant in `theme.devanagariTypography` with the Hindi sample. Each style must be on a single
   line, and also wrapped to three lines at 360 dp width.
   - English: `Today Log set 80 kg × 8 Week 8 locked in Protein 44 g to go, Join gym? Quickly (jog)`
   - Figures: `₹1,00,000 · 142.5 kg · 12:45 · 98%`
   - Hindi: `आज सेट दर्ज करें प्रगति शुक्रवार पूर्ण ईंधन हृदय कृपया द्वितीय अर्ध स्क्वाट डेडलिफ़्ट ऊँचाई`
4. Capture each screen at system font size 100% and at the largest setting (200% on Android 14+).
   Use Settings › Display › Font size, with display size at default, in both dark and light.
5. Save the captures here as `android-<device>-<100|200>-<en|hi>-<dark|light>.png`. Add a
   `measurement.md` stating build, device, OS version, font scale and sample count.

## Pass rule

- No glyph is cut at the top or bottom of any line: matras, reph, anusvara, chandrabindu, below-base
  marks, and Latin descenders (g, j, p, q, y) and capitals.
- Wrapped Hindi lines do not overlap one another.
- At 200%, `numberHero` stays at 112 dp, so a five-character figure fits a 360 dp screen.
- Small text (≤ 24 dp) visibly doubles.
- If Android 14+ shows tighter Hindi leading than Android 12 at 200%, record it. It confirms the
  non-linear line-height risk; raise it with DS-2/DS-4 before release.

Until this file holds those captures, box 3 is **not met**.
