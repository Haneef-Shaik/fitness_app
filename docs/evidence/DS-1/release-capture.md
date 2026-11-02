# DS-1 box 3 · Today in both themes on an Android release build, beside Figma page 02

**Status: NOT DONE. Blocked.** This phase had no Android release build, device or emulator, and the
coordinator excluded device builds. Nothing in this folder is a release capture. No JavaScript export,
web preview or debug build may be substituted (docs/23 §7).

## Reproducible steps

1. **Build** one `main` commit that includes DS-1, as a local release variant. Expo's local path does not
   use EAS cloud:
   ```bash
   pnpm install --frozen-lockfile
   pnpm --filter @fitlog/mobile exec expo prebuild --platform android --clean
   pnpm --filter @fitlog/mobile exec expo run:android --variant release --no-bundler
   ```
   Requires JDK 17 and the Android SDK. The generated `android/` folder is build output and is not
   committed. Record the version (`app.config.ts` `version`), the build number, the commit and the
   signing used (the local debug keystore unless the owner supplies one).
2. **Device**: a reference Android device from PRD §23.1, with model and OS recorded (QA-11 keeps
   `docs/evidence/devices.md`). Use a synthetic account only.
3. **Capture Today** (`/(member)/today`):
   - Settings → Appearance → *Dark* → open Today → screenshot `today-dark-android-release.png`;
   - repeat with *Light* → `today-light-android-release.png`;
   - repeat with *System* while the OS is in each mode, which confirms that following the system works.
4. **Figma reference**: file `wukPwvkAsdpqByti0HNdDs`, page *02 Android · member*, frame **B-01 Today**
   (Dark) and its **Light** copy (docs/22 §3.2, "Light: B-01, H-01, G-01, N-01"). Export both at
   412 × 915 as `figma-02-b01-dark.png` and `figma-02-b01-light.png`, and record each frame's node ID.
   The node IDs are not in docs/22 and must be read from the file.
5. **Place side by side** in `docs/evidence/DS-1/today-vs-figma.md`: one row per theme, with build
   (version, build number, commit), device, OS, date, and the colour differences seen. Colour fidelity is
   DS-1's question. Layout gaps are SC-3's; Today's B-01 content is built at MS-3.

## Known risks for the capture

- docs/evidence/OW-1/figma-gaps.md §6: Light frames beyond page 02's four copies rely on switching the
  variable mode, which leaves translucent tints at Dark values. Expect tint differences.
- The app's Today screen predates SC-3. Compare colour roles (surfaces, accent, ink) rather than layout.
