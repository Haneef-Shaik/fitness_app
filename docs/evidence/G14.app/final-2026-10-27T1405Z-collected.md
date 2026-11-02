I corrected M3 and M4 in the scanner and its test, wrote the regression tests first, and updated the handoff and checkpoint. Nothing has run: every test and mutation check below is UNRUN, so there is no RED or GREEN, no Done-when box is met, and nothing is integrated.

**What changed**
- **M3 (scan strength):**
  - The scan now follows a name to a `const` in the same file, through alias chains, and the nearest binding wins. A parameter, `let`, `var`, destructuring, import, function, class, catch or loop binding of the same name stops it.
  - Each const is expanded at most once per display site, so cyclic aliases end. Nothing crosses files.
  - Objects and arrays passed to display calls are read only at user-facing fields, which catches `Alert.alert(t(..), t(..), [{ text: 'Delete' }])`.
  - `setOptions` is now a display call, so `navigation.setOptions({ title: 'Home' })` is caught.
  - Translation keys (`t(key)`), conditions and unrelated fields like `style`, `onPress` and router `params` are not reported.
- **M4 (baseline can't grow):**
  - Findings now match the baseline on file, kind and text.
  - The test pins the original 13 tuples in its own source, copied from the JSON; a search confirmed the Hindi, `×` and `·` entries match byte for byte.
  - The JSON must be a subset of that pin, counting duplicates, so entries can only be deleted.
  - The pinned rules also check entry shape and known owners (SC-1, SC-4, SC-6, G17.app). G14.app can never own an entry, and no entry may sit in a screen this goal migrated, including Plates, EditSet and Programme.
  - Every existing guard test is kept unchanged.
- **Likely new findings, by reading: none.** The tree has no `Alert.alert` or `setOptions` call, and no display call takes a name or object argument. If a run shows one, its owner fixes the source; it can't be baselined any more.
- Things the scan still can't see are listed precisely in the evidence note §2, for example `label={v}` in CustomExerciseScreen (SC-2) and `{role}` in the gym screens (G17.app).

**Changed files (this phase)**
- `apps/mobile/scripts/copy-literal-scan.cjs`
- `apps/mobile/src/lib/i18n/__tests__/copy-literals.test.ts`
- `docs/evidence/G14.app/i18n-spine-notes.md`
- `docs/plan/runs/G14.app/handoff.md`
- `docs/plan/runs/G14.app/checkpoint.md`

The baseline JSON, the screens, GOALS, status, acceptance and `main` are untouched.

**Tests written (all UNRUN), in `copy-literals.test.ts`**
- Six M3 tests:
  - const following with controls;
  - lexical shadowing (parameter, inner const, `let`, hoisted `var`, `for…of`, `.map` parameter, `catch`, nested block, a const declared later);
  - imports not followed;
  - cycles and self-reference;
  - display-call arrays and objects, including `setOptions` and the `{ title }` shorthand;
  - option objects held in a const.
- One real-screen plant: a TodayScreen scratch copy with a planted const, alert button and screen title, plus a module `const error` that the screen's own `useState` `error` hides.
- Eight M4 tests:
  - the real JSON against the pin;
  - legitimate shrink;
  - a new entry swapped in at the same count;
  - a kind swap;
  - duplicate growth;
  - an unknown owner, G14.app as owner, and a changed owner;
  - migrated screens;
  - malformed entries.

**Open findings and owners**

| Finding | Owner | Note |
|---|---|---|
| M1, Hindi unit on ProgressScreen | G14.app | Can't be deferred, since this goal migrated the screen. The untested "Not clipped" claim is removed |
| M2, the progress phrase as one catalog entry | G14.app | Hindi wording reviewed by G14.hi |
| M5, language persistence policy | G14.app, S3/SC-5 (onboarding), MB-1 (contract) | The S3 request to mount the language provider is on hold until the three agree one policy |
| M6, number parsing on EditSet and Programme | SC-2 | A shared parser is a G14.app design follow-up |
| L1 | G14.app | |
| L2 | MB-1 (validation), G14.app (locale boundary) | |
| L3 | G14.app | The read timeout stays optional |
| M3, M4 | G14.app | Corrected in source; need a run and an independent re-review |

**Gates (all UNRUN)**
- `rtk pnpm install --frozen-lockfile`
- `rtk pnpm --filter @fitlog/mobile exec jest --runInBand src/lib/i18n/__tests__/copy-literals.test.ts`
- `rtk pnpm --filter @fitlog/mobile exec jest --runInBand src/lib/i18n`
- `rtk pnpm --filter @fitlog/mobile typecheck`
- `rtk pnpm --filter @fitlog/mobile lint`
- `rtk proxy node apps/mobile/scripts/copy-literal-scan.cjs`
- `rtk pnpm check`
- `rtk pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android --output-dir .expo/export-native`
- The mutation-check table in the handoff, now including the M3 and M4 rows.

You ruled out subagents for this phase, so the code-reviewer, security-reviewer and tdd-guide reviews did not run; I re-read the diff myself. Two risks for the first run: the 13 predicted kinds now have to match exactly (I re-read the screens and they agree), and it's still unconfirmed whether the `jest-expo` preset loads the `.cjs` scanner.

```
GOAL: G14.app
BRANCH: codex/fitlog-g14-i18n
HEAD: c8a5d57 (base; all work uncommitted in the worktree)
HANDOFF: docs/plan/runs/G14.app/handoff.md
BOXES: 0/3 Done-when boxes met
STATUS: blocked
NOTES: M3/M4 source correction only, every test, gate and mutation UNRUN (no shell); predicted no new scan findings; M1/M2/M5/M6/L1-L3 open with owners in handoff; S3 mount held for M5; box 3 still needs MB-1 contract.
```
