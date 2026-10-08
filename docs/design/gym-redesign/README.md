# FitLog gym UI/UX study — proposed

Open `index.html` directly or preview through a local server. No build or remote services are needed. Browser state resets on reload.

The source of truth for the proposed experience is [the UX brief](../../18-UIUX-GYMS-REDESIGN.md), informed by [PRD v2](../../16-PRD-GYMS.md) and the supplied Android screenshots. Member, owner and trainer workspaces receive equal attention: four main screens each, with supporting gym, sharing and navigation surfaces.

The newer visual direction is [Coach OS v2](../../19-UIUX-GYMS-COACH-OS.md), with the editable [Figma file](https://www.figma.com/design/lMwyxjm3xVG4IvAZ920wMf). This older browser study remains available for comparison.

This is a completed browser study for review. Its proposed hierarchy, navigation and interactions have not been approved as a durable design-system change or implemented in the native app. The incumbent visual authority remains [the mobile tokens](../../../apps/mobile/src/theme/tokens.ts): Kinetic Performance blue with Hanken Grotesk and Inter. The older iris/Barlow gallery under `docs/design/` is conflicting historical evidence and has not been repaired or overwritten. No root `DESIGN.md` was created or replaced. `.impeccable/config.json` records one exact-value detector exception for Inter, preserving the existing app body font; it does not replace the design system.

Fonts are copied from this project's installed `@expo-google-fonts/hanken-grotesk` and `@expo-google-fonts/inter` packages. Their bundled font licenses are preserved in `assets/`. Comparison images reference the supplied, unchanged screenshots under `docs/screenshots/`. All UI names, amounts, portions and progress figures are synthetic demonstration data. There are no stock or generated raster assets.

`review/` contains browser captures used to check desktop, narrow widths, themes and primary interactions. [The validation report](VALIDATION.md) records verified behavior, corrected findings and remaining limits. Browser state and all confirmations are local demonstrations; no payment, message, permission request or store purchase is performed. The Hindi switch is a partial layout/copy sample, not complete translation.
