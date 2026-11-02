# DS-6 bounded current platform-source check — 2026-11-01

Codex read current official public documentation during review. This check updates only the specified dimensions and adaptive safe-zone prerequisites; it does not execute or approve generated art, legal rights, releases or submissions.

- Android adaptive icons: 108dp layers and central66dp safe region; foreground/background plus monochrome layer for themed icons. Generator source declares1024px layers and33/108 radius safe circle. Conservative source intent is consistent with these dimensions; actual pixels UNRUN. [Android official adaptive icon guidance](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive), Design adaptive icons section, retrieved2026-11-01.
- Play listing icon:512x512,32bitPNG and maximum1024KB. Generator source declares512x512RGBA; actual file absence means size/output compliance remains UNPROVED. [Play Console preview assets](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en-en), app-icon requirements, retrieved2026-11-01.
- Remaining Apple/splash/notification specs, provenance/licence and all release/runtime/platform behavior were not verified in this check. PL-7/PL-8 retain submission/device proof. DS-6 retains generated-byte/max-size/visual checks. DEC-01 clearance remains open.

No generator/test/import/install/CLI execution or historical denied retry. Existing source hashes from the reviewer preflight are unchanged; this is a new evidence file outside the21 reviewed source files.
