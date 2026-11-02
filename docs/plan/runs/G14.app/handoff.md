# Handoff — G14.app · Strings catalog, locale formats and the Hindi spine        attempt 1 · `codex/fitlog-g14-i18n` · uncommitted on `c8a5d57`

**Outcome claimed.** Not met, and no Done-when box is met. The source is written and ready for
independent review: the catalog spine, the en-IN and hi-IN formatters, the device language store and
the user-facing literal scan, all with tests.

The latest phase (27 Oct, under Codex AUTH-01 delegation) was a **source-only correction** of
independent-review findings M3 and M4 in the literal scan and its test. It made no acceptance claim.
**No test has run in any phase.**
- Bash was denied in the first two sessions, and this phase was limited to Read, Grep, Edit and Write.
- The worktree has no `node_modules`.

So every result below is source review, not runtime proof. Every test and mutation check named here is
**UNRUN**: none has been seen to fail (RED) or pass (GREEN). Nothing was committed. Nothing here is
integrated, and nothing claims Done.

## Done when

| Box | Met | Evidence |
|-----|-----|----------|
| The catalog parity test and a source scan for user-facing literals each fail on a planted literal, and the scan covers every directory that holds screens | no (written, UNRUN) | `src/lib/i18n/__tests__/catalog.test.ts` "fails on a planted literal that only one catalog carries". `src/lib/i18n/__tests__/copy-literals.test.ts` "fails on a planted literal in every screen directory (scratch copy only)", "passes a real screen as it is and fails it with one planted literal", "covers every directory that holds a screen, including route groups". The 27 Oct M3/M4 tests are listed under "This phase". Scanner `apps/mobile/scripts/copy-literal-scan.cjs`, baseline `apps/mobile/scripts/copy-literal-baseline.json` (unchanged, 13 entries). Command: `rtk pnpm --filter @fitlog/mobile exec jest --runInBand src/lib/i18n`, **UNRUN** |
| en-IN and hi-IN formatter tests pass (₹1,00,000, dates, plurals, units) | no (written, UNRUN) | `src/lib/i18n/__tests__/format.test.ts`: Indian grouping in both locales, `₹1,00,000.00` and `₹1,00,000`, CLDR cross-checks against Node `Intl` for grouping, INR and plural rules, dates and times in both languages including a zone date boundary, Hindi `0 रसीद` / `2 रसीदें`, units with PRD §4.2 precision and kg/lb and cm/in conversion. Same command, **UNRUN** |
| The language preference persists locally and through the profile contract, and docs/23 §9 states the rule: every string on a screen goes through the catalog | no | **Locally:** `language-store.ts` and `LanguageProvider.tsx`, with tests in `__tests__/language.test.tsx` (UNRUN). The provider is not mounted, and the mount request is **on hold** until the persistence policy is coherent (review M5, below). **Profile contract:** no frozen preferences contract exists. MB-1 owns it (AR-1 record §5, line 1005), so this part stays unproved; the contract request is in [the evidence note](../../../evidence/G14.app/i18n-spine-notes.md) §3. **docs/23 §9:** rule 4 already says "Every user-facing string goes through `t()`, including on a screen you only touch." A wording update naming the new guard is requested from the docs/23 owner (QA-2) below |

## This phase: M3 and M4 source correction (27 Oct)

Scope was review findings M3 and M4 only (`docs/evidence/G14.app/final-2026-10-27T1335Z-collected.md`).
The order of work:
1. The regression tests were written before the scanner change.
2. They are UNRUN, so no RED was observed.

The baseline JSON and every screen were left untouched.

**Changed files in this phase**
- `apps/mobile/scripts/copy-literal-scan.cjs`
- `apps/mobile/src/lib/i18n/__tests__/copy-literals.test.ts`
- `docs/evidence/G14.app/i18n-spine-notes.md` (§2: rules, precise limits, baseline policy)
- `docs/plan/runs/G14.app/handoff.md` (this file)
- `docs/plan/runs/G14.app/checkpoint.md`

**M3, scan strength (source written, UNRUN).**
- **Same-file const references.** Followed with lexical scope resolution: the nearest binding wins, and
  only a plain `const name = value` is followed. Parameters, `let`, hoisted `var`, destructuring,
  imports, functions, classes, catch and loop bindings shadow it.
- **Cycles.** A per-display-site visited set expands each const once, so cyclic aliases end. The work
  per site is bounded by the file's consts. There is no cross-file resolver.
- **Display calls.** Objects and arrays of objects in display-call arguments are read only at
  user-facing keys, so `Alert.alert(t(..), t(..), [{ text: 'Delete' }])` is caught. `setOptions` is now
  a display call, so `navigation.setOptions({ title: 'Home' })` is caught. Shorthand `{ title }` is
  followed too.
- **Not mistaken for copy.** Translation keys in consts (`t(key)`), conditions (`const isEdit = a === 'b'`)
  and unrelated fields (`style`, `onPress`, `headerShown`, router `params`) are not reported.
- **Remaining limits.** Stated precisely in the evidence note §2, "Known limits".

**M4, baseline cannot grow (source written, UNRUN).**
- Findings match entries on file, **kind** and text.
- The test pins the original 13 `(file, kind, text, owner)` tuples. They were copied from the JSON,
  and Grep confirmed a byte match of the Devanagari, `×` and `·` entries.
- Through the new `baselineProblems(entries, policy)`, the test requires the JSON to be a multiset
  subset of the pin. The same pinned policy also checks:
  - the entry shape;
  - known owners: SC-1, SC-4, SC-6, G17.app;
  - `G14.app` never owns an entry;
  - no entry sits in a migrated screen: PlatesScreen, EditSetScreen, ProgrammeScreen, HistoryScreen,
    ScheduleScreen, `features/today/`, `features/progress/`, `lib/i18n/`.
- Every existing guard test is kept unchanged, including `toBeLessThanOrEqual(13)` and the owner and
  directory patterns.

**Tests written in this phase (all UNRUN), in `copy-literals.test.ts`**

*Describe "same-file constants and display objects":*
1. "follows a same-file const to the literal it holds, but not keys, conditions or other fields"
2. "respects lexical shadowing: only the nearest binding counts, and only a const is followed". It
   covers a parameter, an inner const, `let`, a hoisted `var`, `for…of`, a `.map` parameter, `catch`,
   a nested block and a later module const.
3. "does not follow imports: no cross-file resolution"
4. "stops safely on cyclic and self-referencing consts"
5. "reads display-call arrays and objects only at user-facing fields". It covers Alert buttons inline
   and through a const, `setOptions` literal and shorthand, and controls.
6. "follows a const option object to its user-facing fields only"

*Describe "the app source tree":*

7. "fails a real screen on a planted const, alert button or screen title, but not on a shadowed module
   const". It uses a TodayScreen scratch copy; the screen's `useState` `error` shadows a planted module
   `const error`.

*Describe "the shrink-only baseline":*

8. "holds only entries from the pinned original 13, for known owners, outside migrated screens" (the
   real JSON)
9. "accepts the original and any shrink of it" (legitimate shrink, including one of a duplicate pair,
   and empty)
10. "rejects a new entry swapped in for a removed one, even at the same count"
11. "rejects a kind swap, in the baseline and when matching findings"
12. "rejects duplicate growth, including a duplicate swapped in for a removed entry"
13. "rejects an unknown owner, G14.app as owner and a changed owner"
14. "rejects an entry in any screen G14.app migrated, whoever owns it"
15. "rejects a malformed entry or entries list"

**Predicted new findings from the stronger M3 rules (by reading, UNRUN): none.**
- Grep found no `Alert.alert` or `setOptions` call in `src/`.
- No display call takes a name, object or array argument.
- Every bare name in a display position resolves to a parameter, a hook or `useState` destructuring,
  a call result, or a const without a lettered literal.
- The 13 predicted kinds were re-read against FoodScreen, GymPlansScreen, ProfileScreen and
  WorkoutScreen, and agree with the rules.

If the first run shows any new finding, its owner corrects the source. It must not be baselined, and
under M4 it cannot be. Literals the scan still cannot see, for future correction by their owners:
- CustomExerciseScreen:29-30 `label={v}` (SC-2);
- `{role}` in GymHomeScreens:20,45 and GymMembersScreen:43 (G17.app);
- English error text reaching screens through `e.message` from `src/data` (MB-1, SC-7).

## Acceptance evidence

`status.mjs show` could not run, so this was checked by reading `docs/plan/ACCEPTANCE.md`: no row
names G14.app. No ledger row was written. No independent acceptance happened in this phase.

## Gates (all UNRUN)

| Gate | Command | Result |
|------|---------|--------|
| Install | `rtk pnpm install --frozen-lockfile` | UNRUN |
| Focused scan tests | `rtk pnpm --filter @fitlog/mobile exec jest --runInBand src/lib/i18n/__tests__/copy-literals.test.ts` | UNRUN |
| i18n tests | `rtk pnpm --filter @fitlog/mobile exec jest --runInBand src/lib/i18n` | UNRUN |
| Types | `rtk pnpm --filter @fitlog/mobile typecheck` | UNRUN |
| Lint and design guard | `rtk pnpm --filter @fitlog/mobile lint` | UNRUN |
| Literal scan CLI | `rtk proxy node apps/mobile/scripts/copy-literal-scan.cjs` | UNRUN |
| `pnpm check` | `rtk pnpm check` | UNRUN |
| Native JS export | `rtk pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android --output-dir .expo/export-native` | UNRUN |
| Mutation checks | table below | UNRUN |
| Backend | not required: no change under `supabase/`, `packages/domain/`, `scripts/backend/` or `src/data/` | n/a |

## Inherited and used

| From | Claim | Held? |
|------|-------|-------|
| QA-1 | Foundation on `main`; `pnpm check` passed with 7 mobile suites | Not re-run (no shell). Read only |
| AR-1 | Profile and preferences binding is a direct `profiles` column update, Partial, owner MB-1; no profile revision | Held, by reading `docs/architecture/003-architecture-freeze.md` lines 132–143, 770 and 1005 |
| Existing `lib/i18n` | Typed `en.ts`/`hi.ts` with a key-parity test | Held and adopted. Keys unchanged; `t(key, locale?)` keeps its signature. Parity is now a reusable `catalogProblems` check that also catches empty copy and placeholder mismatches |

## Mutation checks (all UNRUN)

None was run. Each was planned with the test meant to catch it, and must be run and its output line
recorded before verification.

| Guard | Break it by | Expected failing test |
|---|---|---|
| Parity: missing keys | Return `[]` from the first filter in `keyProblems` (`parity.ts`) | catalog.test "fails on a planted literal that only one catalog carries" |
| Scan: JSX text rule | Delete the `ts.isJsxText` branch | copy-literals "fails on a planted literal in every screen directory", "passes a real screen as it is and fails it with one planted literal" |
| Scan: directory coverage | Add `'(member)'` to `SKIPPED_DIRECTORIES` | copy-literals "covers every directory that holds a screen, including route groups" and the planted-per-directory test |
| Scan: baseline shrink-only | Drop the stale-entry loop in `compareWithBaseline` | copy-literals "has no user-facing literal beyond the shrink-only baseline" (after deleting one migrated literal's baseline line, or by adding a bogus entry) |
| Scan: const following (M3) | Make `follow` return without calling `next` | "follows a same-file const…", "respects lexical shadowing…", "stops safely on cyclic…", "fails a real screen on a planted const…" |
| Scan: shadowing (M3) | In `constantResolver`, stop only on a const (`if (bindings.get(name)) return …`), so opaque bindings are skipped | "respects lexical shadowing…" (Param, Mutable, Loop, Mapped, Caught report "Module title"); "fails a real screen…" (the shadowed module `error` is reported) |
| Scan: `var` hoisting (M3) | Return `own` only for a function body in `scopeBindings` (drop `hoistedVars`) | "respects lexical shadowing…" (Hoisted reports "Module title") |
| Scan: cycle guard (M3) | Delete the `trail.seen.has(declaration)` check in `follow` | "stops safely on cyclic and self-referencing consts" (unbounded recursion) |
| Scan: display-call objects (M3) | Delete the `userFacingKeys(argument, …)` call in `visit` | "reads display-call arrays and objects…", "fails a real screen…" |
| Scan: separate sites (M3) | Share one `site()` between the `rendered` and `userFacingKeys` passes of a display-call argument | "reads display-call arrays and objects…" ("Keep" is missing) |
| Scan: `setOptions` (M3) | Remove `setOptions` from `DISPLAY_CALLS` | "reads display-call arrays and objects…", "fails a real screen…" |
| Baseline: kind in the match (M4) | Drop `item.kind` from the key in `compareWithBaseline` | "rejects a kind swap…", "rejects duplicate growth…" (its `compareWithBaseline` assertion) |
| Baseline: multiset (M4) | Stop decrementing the allowance in `baselineProblems` | "rejects duplicate growth…" |
| Baseline: subset (M4) | Skip the "not in the original baseline" problem | "rejects a new entry swapped in…", "rejects a kind swap…", "rejects an unknown owner…" |
| Baseline: G14.app owner (M4) | Delete the `forbiddenOwners` branch | "rejects an unknown owner, G14.app as owner…" (it reports "unknown owner G14.app" instead) |
| Baseline: migrated screens (M4) | Make `migrated()` return `false` | "rejects an entry in any screen G14.app migrated…", "rejects a new entry swapped in…" |
| Baseline: shape (M4) | Return `[]` from `entryShapeProblems` | "rejects a malformed entry or entries list" |
| Indian grouping | Change `(\d{2})+` to `(\d{3})+` in `groupDigits` | format.test "groups digits the Indian way", "shows ₹1,00,000 with Indian grouping", the CLDR cross-checks |
| Hindi plural rule | Make Hindi `one` only for `n === 1` | format.test "follows the CLDR one/other rules" (0 and 0.5) and `0 रसीद` |
| Hydration race | Remove the `revision === initialRevision` check in `hydrate` | language.test "keeps a choice made while the old value is still being read" |

## Review findings left open

These come from the independent review in `docs/evidence/G14.app/final-2026-10-27T1335Z-collected.md`.
- **M3 and M4** have a source correction in this phase, UNRUN, and stay open until a run and an
  independent re-review confirm them.
- **The others are open.** Their source files were out of scope for this phase and were not edited.

| Finding | Owner | Status |
|---|---|---|
| **M1** · Hindi unit drawn in the `number` variant on ProgressScreen:23,28, so Devanagari gets the Latin number font and line height | **G14.app.** ProgressScreen is a screen this goal migrated, so the fix cannot be deferred to another lane | Open. The minimum fix: `formatNumber` in the number variant and `unitLabel('kg')` in a body or label variant, as TodayScreen:67-68 does. No clipping claim is made either way: the earlier "Not clipped" note was untested and has been removed |
| **M2** · "This week · 3 of 4" is assembled from pieces (TodayScreen:46), so Hindi word order needs code | **G14.app** for a complete phrase in the catalog (one `tf()` key such as `'{done} of {goal}'`); **G14.hi** for the Hindi wording review | Open |
| **M3** · scan misses literals held in a variable or passed in display-call objects | G14.app | Corrected in source, UNRUN (above) |
| **M4** · baseline could grow by substitution at the same count | G14.app | Corrected in source, UNRUN (above) |
| **M5** · once mounted, the device store would keep the account's default `'en'` over the device language (PRD §5.3) | **G14.app** for the device persistence policy (D-G14-5); **S3/SC-5** for onboarding sending the device locale; **MB-1** for the profile contract and which language wins | Open. **Hold the S3 mount request** (request 1 below) until the three agree on one coherent policy |
| **M6** · no locale-aware number parser, so EditSet distance `"1,500"` and Programme `Number("1,500")` go wrong | **SC-2** owns the parser fix on EditSetScreen and ProgrammeScreen; **G14.app** owns a design follow-up for a shared `parseDecimal(text, locale)` in the spine that refuses ambiguous grouping | Open |
| **L1** · plural chosen from the raw count but text from the rounded count (`format.ts:76-79`) | G14.app | Open |
| **L2** · `setCurrentLocale` throws on an unsupported value; a corrupted cached profile shows an English error with a Retry that keeps failing offline | **MB-1** validates `locale` when the profile is loaded or cached; **G14.app** makes the locale boundary treat an unsupported value as "follow the device" | Open |
| **L3** · device language recomputed with a new `Intl.DateTimeFormat` on every call; `LanguageProvider` never shows the store's `error` | G14.app. A read timeout stays **optional**, as the review says | Open |

Still open from the first self-review:
- low · e1RM and the 7-day body-weight average now show up to 2 decimals (the PRD §4.2 load rule)
  instead of `toFixed(1)`.
- info · the 13 baseline findings were predicted by reading, not observed. Including `kind` in the
  match makes a wrong predicted kind fail the first run.

## Left undone, and why

- Every runtime proof (tests, types, lint, export, mutation checks): there was no shell in any phase.
- Mounting `LanguageProvider` in the root layout: S3 owns `src/app/_layout.tsx`, and the request is on
  hold for M5.
- The profile-contract half of box 3: MB-1 has not published a preferences contract (request in the
  evidence note §3).
- Literals in other lanes' screens: baselined with owners rather than edited.
- Review findings M1, M2, M5, M6 and L1–L3: outside this phase's scope (M3 and M4 only).

## Found for other goals

- **Decimal input.** `value.replace(',', '.')` turns `1,000` into `1`, and en-IN uses `,` for grouping.
  - Affected: WorkoutScreen, EditSetScreen, AddFoodScreen, TargetsScreen, BodyEntryScreen.
  - Owners: SC-1, SC-2, SC-3, SC-4, MB-3.
  - Review M6: **SC-2** owns the EditSetScreen and ProgrammeScreen parser fix, and G14.app owns the
    shared parser design follow-up.
- **Raw enum values shown to members.** The scan cannot see these, because they are data rather than
  literals:
  - CustomExerciseScreen choice labels (`resistance`, `per_hand`, ...): SC-2;
  - `loadBasis` and `equipment` in WorkoutScreen and ExerciseDetailScreen: SC-1, SC-2;
  - `{role}` and `{p.method}` in GymHomeScreens: G17.app;
  - `{o.kind}` in SyncScreen: SC-7.
- **Dates with no locale or zone.** `toLocaleString()` in GymHomeScreens and SyncScreen, and
  ReceiptScreen's hard-coded `'en-IN'` and `<html lang="en">`. Use `formatDateTime(instant, zone)`.
  Owners: G17.app, SC-7.
- **English error text reaching screens through `e.message`.** Sources: domain `parseRupees`,
  `Account mismatch`, Postgres messages, and the `src/data` strings listed in the evidence note §2,
  limit 9. Map AR-1 error codes to catalog keys. Owners: MB-1, SC-7.
- **Units preference ignored.** The profile's `weightUnit` and `lengthUnit` aren't applied anywhere
  yet. `formatWeight` and `formatLength` are ready. Owners: SC-3, MB-1 (AC16).
- **Live language switch.** Screens call `t()` while rendering, and nothing re-renders the open
  screens when the language changes. `useLocale()` is ready for the shell and `AppText`. Owners: SC-6,
  S3.
- **Literals in other lanes' screens.** Each owner removes its baseline entries; the baseline can only
  shrink:
  - SC-1 WorkoutScreen: `labelWithUnit`, `formatMeasure`, `formatCount`;
  - SC-4 FoodScreen: `formatMeasure(..., 'g' | 'kcal')`;
  - SC-6 ProfileScreen: `LANGUAGE_NAMES`;
  - G17.app GymPlansScreen: a catalog key for the plan version, and `formatMoney` in place of the
    gym-local `inr()`.

## Requests for other lanes' files

1. **S3, root layout** (`apps/mobile/src/app/_layout.tsx`). **On hold (review M5):** do not mount
   until G14.app, S3/SC-5 and MB-1 agree a coherent persistence policy. The intended mount, inside the
   theme provider:
   ```tsx
   import { LanguageProvider } from '@/lib/i18n/LanguageProvider';
   // ...
   return <SafeAreaProvider><ThemeProvider><LanguageProvider><AppLayout /></LanguageProvider></ThemeProvider></SafeAreaProvider>;
   ```
   The splash stays up until the saved language is read, because `AppLayout` mounts after hydration.
2. **S3, `src/ui/AppText.tsx`.** Use `useLocale()` instead of `getCurrentLocale()`, so the Hindi font
   switches on re-render.
3. **S3 / SC-5, `src/features/auth/OnboardingScreen.tsx:15`.** Send `p_locale: getCurrentLocale()`
   instead of `'en'`, so new accounts keep the device language (PRD §5.3). Part of the M5 policy.
4. **MB-1 / S8.** Publish the profile preferences contract described in the evidence note §3, and
   validate `locale` on profile load and cache (review L2).
5. **QA-2, owner of `docs/23-MASTER-PLAN.md`.** In §9 rule 4, replace "The lint guards enforce both."
   with: "The design guard (`apps/mobile/scripts/test-design-rules.cjs`) enforces tokens. The literal
   scan (`apps/mobile/scripts/copy-literal-scan.cjs`, run by `pnpm check` through
   `src/lib/i18n/__tests__/copy-literals.test.ts`) enforces strings, with a shrink-only baseline for
   literals that predate it."

## Decisions forced (for the tracker decision log)

- **D-G14-1, money.** Money shows 2 decimals by default, per PRD §4.2 ("money 2"), for example
  `₹1,00,000.00`. `{ wholeUnits: true }` gives the card's `₹1,00,000` for whole rupees. Paise are
  integers and never rounded.
- **D-G14-2, digits and grouping.** Numbers use Latin digits and Indian grouping in both languages,
  the CLDR default for hi-IN. Output is built from tables, not `Intl`, so it is identical on every
  engine. `Intl` is used only for time-zone wall-clock parts, as `packages/domain` already does.
- **D-G14-3, unit precision.** PRD §4.2 precision is applied as a maximum with trailing zeros trimmed
  for every unit. The PRD states trimming only for load. Money stays fixed at 2 decimals.
- **D-G14-4, baseline.** Existing literals in other lanes' screens go into a shrink-only baseline that
  names the owning goal. Those screens were not edited. Since 27 Oct the test pins the original 13
  tuples, so the baseline can only lose entries.
- **D-G14-5, device store.** The device store holds only the language code. After the profile loads,
  the account's language wins and is copied to the device. **Under review (M5):** this policy must be
  revisited with S3/SC-5 and MB-1 before the provider is mounted.

## Traps hit

- Bash was denied in "don't ask" mode, so none of git, rtk, pnpm or the plan tooling could run. The
  27 Oct phase was limited to Read, Grep, Edit and Write by its delegation.
- `tsconfig` limits `types` to `react` and `jest`, so Node APIs are not typed in the app's TS. The
  scanner is plain CommonJS, which TS does not check, and the test loads it through
  `jest.requireActual`. Whether the `jest-expo` preset resolves the `.cjs` file is unverified.
- Hermes does not guarantee `Intl.PluralRules`, so the plural rules are written out and
  cross-checked against Node in tests.
