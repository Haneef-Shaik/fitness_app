# FitLog — Design System & Screens

The visual layer for the Fitness & Nutrition Tracking Platform.
Implements [05-DESIGN-SYSTEM.md](../05-DESIGN-SYSTEM.md) as running code.

## Open this first

```
open docs/design/index.html
```

Self-contained HTML. No build step, no server, no account, works offline.
The only network call is the Google Fonts stylesheet; without it the pages fall back to system sans.

---

## Structure

| File | What it is |
|------|-----------|
| `index.html` | **The hub.** All 12 domains, the rules, theme toggle. |
| `foundations.html` | Depth, type scale, colour, contrast evidence. |
| `fitlog.css` | The whole design system — tokens + every component. Import at the app root. |
| `fitlog-shell.js` | Shared design-file shell: icon set, phone chrome, board/prototype/theme. |
| `tokens.css` | Tokens only, for engineers who want the system without the file-viewer CSS. |
| `screens/*.html` | One file per domain. Each declares `window.FITLOG = { title, intro, screens[] }`. |

### Domains

| File | Domain | Screens |
|------|--------|---------|
| `screens/a-auth.html` | Auth & onboarding | 12 |
| `screens/b-dashboard.html` | Dashboard | 6 |
| `screens/c-planning.html` | Workout planning | 9 |
| `screens/d-exercises.html` | Exercise catalog | 5 |
| `screens/e-logger.html` | **Workout logger — E-03 is live** | 13 |
| `screens/f-history.html` | Workout history | 7 |
| `screens/g-analytics.html` | Performance analytics | 7 |
| `screens/h-nutrition.html` | Nutrition & AI | 21 |
| `screens/i-body.html` | Body progress | 6 |
| `screens/j-goals.html` | Goals | 5 |
| `screens/k-settings.html` | Profile & settings | 11 |
| `screens/l-system.html` | System states | 8 |

Every domain file has two views: a **board** of device frames to scan, and a **prototype** rail to step
through one screen at a time. `e-logger.html` E-03 genuinely logs sets — steppers, delta against last
time, sync dot amber→green, rest timer.

---

## Direction

**Dark athletic.** Dark is the primary mode, not a variant: a gym is a dark-lighting context and the
logger gets used at 6am. Light is fully specified and validated.

**Layered, never flat.** Four ingredients on every raised surface — a tinted gradient, a 1px inner top
highlight so edges catch light, an ambient accent glow behind the top of the screen, and an elevation
scale that genuinely differs between a row, a card, a pad and a dialog. Omitting these is what makes a
dark UI read as a wireframe.

**Iris is the only accent** — a blue-violet at OKLCH hue ~292°, on the primary action, the live-session
pulse, the calorie meter and the active tab. Deliberately *not* a chart series colour.

**One superfamily, two widths.** `Barlow Condensed` carries every number; `Barlow` carries the
interface. The scale runs 10→76px.

---

## Measured contrast

| Pair | Value | Verdict |
|------|-------|---------|
| Iris `#B0A4FF` on dark surface | **8.12:1** | AAA |
| Near-black on iris fill | **8.77:1** | AAA — dark primary button |
| Iris `#5A31C4` on white | **7.86:1** | AAA, both directions |
| Iris vs protein blue | **ΔE 11.1** | Worst-case CVD; target is 8 |
| Iris vs status-critical | **ΔE 28.9** | Primary can never read as destructive |

Picked by sweeping the whole hue circle and scoring worst-case colour-vision-deficiency separation —
not by taste. Rejected: lime measures ΔE **0.3** from series green under CVD in light mode, amber
**1.8** from status-warning, magenta **7.4** from status-critical, and the off-the-shelf Tailwind
violet **4.9** from protein blue. Full reasoning in [05-DESIGN-SYSTEM §2.3](../05-DESIGN-SYSTEM.md).

---

## Rules every screen is held to

| Rule | Why |
|------|-----|
| A set commit never awaits the network | p95 tap-to-rendered < 100 ms. Offline is indistinguishable from online except for the sync dot. |
| Estimated never looks like confirmed | Dashed border, sparkle, "Est." chip — and it adds nothing to any total until confirmed. |
| A regression is never red | A lighter training day is information, not an error. |
| Filtered-empty ≠ genuinely empty | Different copy, different action. Conflating them is a common bug. |
| Colour never carries meaning alone | Every status pairs a hue with an icon, a label, or both. |
| The PR celebration waits for the summary | Interrupting someone mid-set to congratulate them is the worst thing the logger could do. |
| Any AI failure leaves training untouched | Logging, history and analytics never depend on the AI service. |
| Logger controls are 56 px | One hand, sweaty fingers, a phone on a bench. |

---

## Using it in the app

```html
<link rel="stylesheet" href="/design/fitlog.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&display=swap">
```

```css
.btn-primary { background: linear-gradient(180deg,var(--accent-hi),var(--accent));
               color: var(--accent-ink); box-shadow: var(--glow); }
.card        { background: var(--card-bg), var(--surface); box-shadow: var(--elev-1); }
.set-value   { font-family: var(--ff-data); font-variant-numeric: tabular-nums; }
.delta-up    { color: var(--good); }   /* pair with ▲ — never colour alone */
```

Theme resolves in all three states: unstamped + OS dark, unstamped + OS light, and an explicit
`data-theme` stamp in either direction. Never define a colour only inside a media or `[data-theme]`
block.

---

## Adding a screen

Each domain file is a plain array. Add an entry and it appears in both views:

```js
{ id:'H-19', name:'Water tracking', route:'/nutrition/water',
  html:()=>`<div class="screen">…</div>` }
```

Use `nav({title, sub, right, close})` for headers, `tabbar('nutrition')` for tab roots, and the
component classes in `fitlog.css` — `card`, `card hero`, `well`, `dash`, `stats`, `meter`, `macro`,
`settbl`, `pad`, `linkrow`, `swrow`, `chip`, `pill`, `empty`, `sheet`, `ov`.
