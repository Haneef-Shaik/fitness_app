I found no critical or high findings. There are six medium and three low. Everything below comes from reading the source only. No test, typecheck, lint, scan or mutation check ran, and no runtime or CLDR behaviour is claimed. I hand-traced the expected values in `format.test.ts` against `format.ts` (Indian grouping, `1.005`→`1.01`, `-0.001`→`0`, `25.25 g`→`25.3 g`, `100 kg`→`220.46 lb`, `80 cm`→`31.5 in`, the IST times and the weekdays) and they agree. The tests that compare against Node's `Intl` depend on the ICU data Node ships with and have not been run.

## Medium

**M1 · The Hindi unit is drawn in the number style, which has no Hindi font or extra line height (introduced by this diff).**
- **Where:** `apps/mobile/src/features/progress/ProgressScreen.tsx:23,28`, with `apps/mobile/src/ui/AppText.tsx:19-22`.
- **Defect:** `AppText` leaves the `number` variant out of the Hindi font swap and the 1.2× line height. The diff now puts `formatMeasure(...)` (number plus unit) inside `variant="number"`.
- **Scenario:** in Hindi, `formatMeasure(82.5,'kg')` gives `82.5 किग्रा`. The Devanagari is drawn with the Latin number font and Latin line height. This goes against PRD.md:1211 ("Hindi glyph support") and :1560 ("without clipping"). The handoff's "Not clipped" (handoff.md:68-71) is an untested runtime claim.
- **Owner:** G14.app. Progress is one of S4's migrated screens (checkpoint.md:34; `features/progress` is kept out of the baseline at copy-literals.test.ts:101), so routing it to SC-3 is not right.
- **Minimum fix:** split the number from the unit, as `TodayScreen.tsx:67-68` already does: `formatNumber(...)` in the number variant, `unitLabel('kg')` in a body or label variant.

**M2 · "This week · 3 of 4" is built from separate pieces, so Hindi needs code changes, not just translation.**
- **Where:** `apps/mobile/src/features/today/TodayScreen.tsx:46`. The Hindi `of` is `'में से'` (`src/lib/i18n/app.ts:164`).
- **Defect:** the order of the pieces is fixed in code: `{completed.length} {t('of')} {profile.weeklyGoal}`.
- **Scenario:** Hindi renders `3 में से 4`. `में से` attaches to the number before it, so 3 reads as the total. No catalog edit can swap the numbers, which contradicts the outcome in GOALS.md:499-500. The literal scan cannot detect this.
- **Owner:** G14.app (a migrated screen), whether or not the line predates this diff.
- **Minimum fix:** one key used through `tf()` (`translate.ts:22`), e.g. en `'{done} of {goal}'`, with the Hindi wording set by the G14.hi reviewer.

**M3 · The literal scan misses a literal stored in a variable or passed through a call.**
- **Where:** `apps/mobile/scripts/copy-literal-scan.cjs:66-100` and `:41`.
- **Defect:** `rendered()` only follows literals, templates, `?:` and binary operators. It ignores names, calls, index lookups and object literals.
- **Scenarios** (none of these patterns is in the current tree, so this is about the guard's strength, not a live miss):
  - `const label = 'Save'; <AppButton label={label} />` produces no finding.
  - In `Alert.alert(t('a'), t('b'), [{ text: 'Delete' }])`, the array elements are objects (line 99), so `'Delete'` is missed.
  - `navigation.setOptions({ title: 'Home' })` is missed, because `setOptions` is not in `DISPLAY_CALLS`.
- **Gap in the docs:** the known-limits note (i18n-spine-notes.md:58-61) covers data values and helper functions, but not a constant in the same file.
- **Owner:** G14.app.
- **Minimum fix:** in this order of preference:
  1. Follow a name to a literal `const` declared in the same file.
  2. Scan the user-facing keys of objects inside display-call arguments.
  3. Add `setOptions` to `DISPLAY_CALLS`.
  4. Add one planted test for each.

  Failing that, document these as limits.

**M4 · The baseline can grow again: entries can be swapped while the count stays at 13 or below.**
- **Where:** `apps/mobile/src/lib/i18n/__tests__/copy-literals.test.ts:98,100,101`, `copy-literal-scan.cjs:183` and `:16-18`, and the baseline description (`copy-literal-baseline.json:2`).
- **Defect:** the only guard against growth is `toBeLessThanOrEqual(13)`.
  - Entries are matched on file and text only, ignoring `kind`.
  - The owner pattern accepts `G14.app`, so this goal could baseline its own literals.
  - The exclusion pattern leaves out the five training screens this diff migrated.
- **Scenario:** SC-4 removes its 3 FoodScreen entries (10 left). Someone then adds `{file:"src/features/training/PlatesScreen.tsx", text:"Plates", owner:"SC-1"}` and a planted `<AppText>Plates</AppText>`. Every test passes.
- **Mutation plan gap:** the planned "shrink-only" mutation (handoff.md:52) only tests the stale-entry check, not growth.
- **Owner:** G14.app.
- **Minimum fix:**
  - Pin the exact baseline entries (or a hash) in the test.
  - Exclude the migrated training screens and the `G14.app` owner.
  - Include `kind` in the match key.

**M5 · Once the provider is mounted, the device store keeps the account's default `'en'`, overriding the device language (PRD §5.3).**
- **Where:** `apps/mobile/src/lib/i18n/language-store.ts:69-72,82` and `:6-9`, with `apps/mobile/src/data/MemberProvider.tsx:54`.
- **Defect:**
  - Every profile load echoes the account language through `setCurrentLocale`, and the store saves it.
  - The account language is `'en'` for every account today: `profiles.locale` defaults to `'en'` and onboarding sends `'en'` (i18n-spine-notes.md:85,87).
  - `undefined` (follow the device) is never saved (line 71), and the storage interface has no `removeItem`.
- **Scenario:** Hindi device → sign up → sign out → relaunch. The store restores `'en'`, so the signed-out screens open in English. PRD.md:242-243 says the default follows the device. Before this diff, the app would follow the device on that launch.
- **Depends on:** S3 mounting the provider, and partly on the onboarding fix (handoff request 3). Accounts that already exist keep `'en'` either way.
- **Owners:** G14.app (store, D-G14-5), S3/SC-5 (onboarding), MB-1 (which language wins).
- **Minimum fix:**
  - Hold the mount request until the onboarding fix lands.
  - Then either save only choices the user makes (`store.setLanguage` from ProfileScreen) or clear the saved value on sign-out.
  - Record the outcome in D-G14-5.

**M6 · The spine has no locale-aware number parser. This is a pre-existing silent-wrong-value bug in migrated screens, not a regression.**
- **Where:**
  - `apps/mobile/src/features/training/EditSetScreen.tsx:17` (used by the distance field at line 26).
  - `apps/mobile/src/features/training/ProgrammeScreen.tsx:42-45`.
  - PRD.md:185 ("Accept locale decimal separator").
- **Scenarios:**
  - In EditSet, distance `"1,500"` becomes `"1.500"`, so 1.5 m is stored instead of 1500 (metres are the stored unit).
  - In Programme, `Number("1,500")` is `NaN`, which only fails later at the schema check, with an English Zod message.
- **Ownership gap:** both screens are in G14's migrated S4 set (checkpoint.md:31-34). The handoff (handoff.md:89-91) lists owners for the decimal bug without naming who owns EditSet.
- **Minimum fix:** name an owner explicitly. The spine is the natural home for a `parseDecimal(text, locale)` that refuses ambiguous grouping.

## Low

- **L1 · Plural chosen from the raw count, text shown from the rounded count** (`apps/mobile/src/lib/i18n/format.ts:76-79`). `formatCount('setCount', 1.004, 'en')` gives `"1 sets"`. **Fix:** choose the plural form from the rounded value, or require whole numbers.
- **L2 · `setCurrentLocale` now throws on a bad value** (`locale.ts:33`). A corrupted cached `__profile` (an unchecked cast, `MemberProvider.tsx:50`) leads to an error screen showing English "Unsupported language" with Retry (MemberProvider.tsx:54,59,69). Offline, Retry fails the same way every time. **Fix:** treat an unsupported value as "follow the device" instead of throwing. MB-1 should check the value when the profile is loaded or cached.
- **L3 · Per-call cost and silent errors.**
  - When no language has been chosen, `getCurrentLocale()` builds a new `Intl.DateTimeFormat` on every `t()` call, every formatter default and every `useLocale` snapshot read (`locale.ts:20-22,28-30`; `use-locale.ts:6`). I can't tell from source whether this predates the diff.
  - `LanguageProvider` never shows the store's `error` state and has no timeout on the read (`LanguageProvider.tsx:12,18`).
  - **Fix:** compute the device language once. Optionally add a timeout on the read.

## Tests and dependencies not yet run

- Each planted-literal test can fail as written. The anchor that the "real screen" test plants beside exists at `TodayScreen.tsx:44`.
- Tracing the hydration-race test, it would fail under the planned mutation.
- There is no provider-level test that a language change after hydration gets saved; it is covered only at store level (`language.test.tsx:61-74`).
- The scan test loads a `.cjs` file through the `jest-expo` preset (`copy-literals.test.ts:21`; `jest.config.cjs:2-3`). Whether that preset resolves `.cjs` files is unverified.

## Where the Done-when boxes stand (no Done claim)

- **Box 1 (parity test and literal scan):** written, not run.
- **Box 2 (formatter tests):** written, not run.
- **Box 3 (language preference):** not met.
  - `LanguageProvider` is not mounted (S3).
  - There is no profile contract (MB-1).
  - docs/23-MASTER-PLAN.md:212 says "The lint guards enforce both", but the literal scan runs only through Jest (`package.json:15`). The QA-2 wording request is still open.

## Privacy (PRD 16.1 / ADR-003)

No finding. The device store holds only the language code (`language-store.ts:4,26-29`), and none of these files touches a gym-staff data path.
