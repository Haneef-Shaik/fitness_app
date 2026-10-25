# Mobile foundation — 17 October 2026

Status: historical foundation checkpoint. The [connected implementation record](002-connected-member-and-gym.md)
supersedes the original routing, font, backend and feature-scope statements below. Native compilation,
device QA and hosted CI remain unverified.

## Scope and decisions

The owner requested the fresh app implementation with easy future theme changes and good engineering
defaults. On 17 October 2026, the owner explicitly confirmed React Native with Expo + TypeScript
for Android and iOS, keeping Momentum and shared theme tokens. This confirms the stack used for
the foundation already built. The existing Momentum direction remains authoritative.

`apps/mobile/` is the first new runtime boundary after the reset. The root pnpm workspace also keeps
the dependency-free planner intact. Expo SDK 57 is pinned from its official default template while
SDK 58 is in its initial transition; the lockfile records the resolved versions. Standard Metro
workspace discovery is sufficient; there is no custom resolver or duplicate React installation.

The first functional screen is Appearance. The root route deliberately opens it while the actual
member journeys are being built. The sample workout action is a labelled, noninteractive preview;
it creates no workout or personal data. `/design-system` is development-only and redirects to `/`
in production. There is no placeholder authentication, simulated backend, or fake progress data.

No backend, identity vendor, API schema, offline workout storage or hosting decision is made here.
The PRD's architecture/API freeze still gates data-dependent feature work. This foundation does not
complete DS-1 through DS-5 or the launch milestones.

## Code boundaries

| Directory | Responsibility |
| --- | --- |
| `src/app/` | Thin Expo Router routes, providers and startup |
| `src/features/` | Feature screens and their behavior |
| `src/ui/` | Reusable, accessible, themed primitives |
| `src/theme/` | Theme contract, palette, metrics, provider and preference persistence |
| `src/lib/i18n/` | Typed English/Hindi catalog and device-locale fallback |
| `scripts/` | Development-only palette generation and lint guard verification |

Feature code consumes `useTheme()` and shared primitives. Theme code does not import features.
Keep business rules out of route files and UI primitives. Introduce shared packages only when
another actual consumer needs them. Runtime colors and component styles are not fetched remotely.

TypeScript is strict, including checked indexed access and exact optional properties. ESLint rejects
literal hex/rgb/hsl colors, font families/sizes/line heights and corner radii outside theme files.
A planted failing fixture verifies those rules in `pnpm lint`. Component-local flex rules remain
local instead of being turned into tokens without a reusable purpose.

## Theming contract

`ThemeDefinition` supplies the same complete semantic color roles for light and dark. The default
palette is `apps/mobile/src/theme/themes/momentum.json`, pinned to Figma's System boards 16:55
and 16:200. `theme.ts` resolves the palette plus shared spacing, shape, typography and dimensions.
See [the theming guide](../THEMING.md) for edits and replacement themes.

The preference defaults to `system` and accepts `light` or `dark`. `useColorScheme()` updates the
resolved palette while system is selected. An explicit selection is stable across OS appearance
changes. The storage key is versioned and contains only the theme choice. AsyncStorage is appropriate
for this non-sensitive preference; it must never be reused for authentication secrets.

The preference store is injected into the provider for tests. It hydrates once, validates persisted
values, protects a new selection from a delayed read, and serializes writes so rapid choices persist
in order. Failed storage leaves the chosen palette active and shows a recoverable message. Native
splash dismissal waits for hydration; the status bar and root/navigation backgrounds use the same
resolved theme. A native OS splash can initially reflect OS appearance before the saved override loads.

Text scales with the OS; controls grow vertically and the screen scrolls. Touch targets are at least
48 logical units. This initial static screen introduces no motion, so Reduce Motion does not require
an animation fallback yet. Fonts use explicit platform fallback slots until approved Google Sans Flex,
Roboto Condensed and Hindi font assets/license evidence are bundled under DS-2. Hindi catalog parity
is tested; language selection/account sync and native Hindi typography QA remain pending.

## Verification and limits

- `pnpm check`: strict TypeScript, zero-warning lint, guard fixture, 20 mobile tests, 10 planner
  tests and 94-card plan validation.
- Theme tests cover contrast on all four main surfaces and action/error/coach/gym foreground pairs,
  same role names across modes, platform type and touch defaults, and the light-lime graphics rule.
- Preference tests cover corrupt/missing storage, hydration, late reads, write ordering and failures.
- Native component tests cover accessible theme selection, provider response to OS changes, and
  disabled/loading actions.
- Web export and Android/iOS JavaScript/Hermes exports pass. Exporting is not native compilation,
  device execution, performance measurement or store readiness.
- Browser preview checked dark/light rendering and persistence after reload. Browser captures are
  development previews, not native screenshot evidence. No usable iOS Simulator is installed here;
  Android device execution has not been established.
- CI repeats the checks and exports with a frozen lockfile, strict peers, read-only permissions and
  action commit pins. It has not run on GitHub yet.

## Next delivery gates

Reconcile QA-1/QA-2 with this fresh foundation before parallel goal execution. Native screens still
need font/license completion, real device accessibility/large-text checks, Figma matching, native
navigation and system controls, and the rest of the component kit. Establish the versioned API and
durable workout storage contracts before building data-dependent member flows. The existing goal
IDs and live statuses are preserved until their actual review and completion gates are met.

Implementation references: [Expo project setup](https://docs.expo.dev/get-started/create-a-project/),
[color themes](https://docs.expo.dev/develop/user-interface/color-themes/),
[workspaces](https://docs.expo.dev/guides/monorepos/).
