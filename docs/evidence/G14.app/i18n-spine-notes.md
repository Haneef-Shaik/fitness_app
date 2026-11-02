# G14.app evidence notes: strings catalog, locale formats and the Hindi spine

Attempt 1, 27 October 2026. Worktree branch `codex/fitlog-g14-i18n`, base `c8a5d57`.

**Proof status.** Everything here comes from reading the source and writing code. The Bash tool was
denied for the whole session and `node_modules` is not installed in the worktree. No test, type check,
lint or export ran, so this note contains **no runtime proof**. The commands that turn it into proof
are at the end.

## 1. What the spine provides (`apps/mobile/src/lib/i18n/`)

| Module | Purpose |
|---|---|
| `locale.ts` | `Locale`, `resolveLocale` (PRD §5.3 device default), current-language state with `subscribeLocale`, `LANGUAGE_NAMES` endonyms |
| `translate.ts` | `t(key)`, `tf(key, params)` and `interpolate`. Unknown `{name}` placeholders stay visible |
| `format-copy.ts` | Unit symbols, `{value} {unit}` and `{label} ({unit})` templates, am/pm and the e1RM formula label, spread into `en.ts`/`hi.ts` |
| `plurals.ts`, `plural-rules.ts` | Counted nouns. CLDR one/other rules written out (Hindi puts 0 in one), cross-checked against Node `Intl.PluralRules` in tests |
| `calendar.ts` | Month and weekday names in en and hi |
| `format.ts` | `formatNumber`, `formatMoney` (integer paise), `formatDate`, `weekdayName`, `formatTime`, `formatDateTime`, `formatCount`, `formatMeasure`, `labelWithUnit`, `withUnit`, `formatWeight`, `formatLength` |
| `parity.ts` | `catalogProblems`, `pluralCatalogProblems`, `calendarProblems`: missing or extra keys, empty copy, mismatched placeholders, missing `{count}` |
| `language-store.ts` | Device-local language store (`@fitlog/language/v1`), serial writes, read/write error state, hydration race guard |
| `LanguageProvider.tsx` | Holds rendering until the saved language is read, then saves every later choice. Not exported from the index, so `t()` never loads native storage |
| `use-locale.ts` | `useLocale()` re-renders on a language change |

### Format decisions (PRD §4.2)

- en-IN and hi-IN both use Latin digits, `.` decimals and Indian grouping: `1,00,000` and
  `1,00,00,000`. This is the CLDR default for both locales.
- Money takes integer paise and is never rounded: `₹1,00,000.00` by default (PRD "money 2"), or
  `₹1,00,000` with `{ wholeUnits: true }` (the card's example). Fractional or unsafe input throws.
- Display rounding is half away from zero on the decimal value (`1.005` → `1.01`), matching the SQL
  `round` named in the AR-1 record §4.13. Intermediate totals are never rounded here.
- Unit precision is a maximum with trailing zeros trimmed: kg, lb and kg·reps 2; g, cm and in 1;
  m, km and mi 2; kcal, s and min 0. Missing values show `—`, never 0.
- Dates read day, month, year in both languages: `27 Oct 2026` and `27 अक्तू॰ 2026`;
  `मंगलवार, 27 अक्तूबर 2026`. Times are 12-hour in the record's IANA zone (`7:05 pm`).
  Wall-clock parts come from `Intl.DateTimeFormat('en-CA', { timeZone, hourCycle: 'h23' })`, as
  `packages/domain/src/dates.ts` already does. Names come from tables, so output matches on Hermes,
  JSC and Node.
- Hindi unit symbols follow the catalog's house style (`कमर (सेमी)`): किग्रा, ग्रा, सेमी, इंच, कैलोरी,
  मिनट, सेकंड. The G14.hi reviewer confirms them.

## 2. User-facing literal scan

`apps/mobile/scripts/copy-literal-scan.cjs`, separate from the colour and font guard in
`scripts/test-design-rules.cjs`. It parses every `.ts`/`.tsx` under `src/`, except `__tests__`, with the
TypeScript compiler. It reports text containing a letter in any script (`\p{L}`) when that text reaches
the screen as a literal:

- JSX text;
- literals in user-facing props (`label`, `title`, `placeholder`, `accessibilityLabel`, `action`, ...);
- literals rendered from JSX expressions, following `?:`, `&&`, `||`, `??`, `+` and template text;
- user-facing keys in option objects (`options={{ title }}`) and spread props;
- arguments to display calls (`Alert.alert`, `setError`, `setMessage`, `navigation.setOptions`, ...),
  including the user-facing keys of objects and arrays of objects in those arguments
  (`Alert.alert(t('a'), t('b'), [{ text: 'Delete' }])`, `setOptions({ title: 'Home' })`);
- any of the above held in a `const` in the same file and reached through its name, including alias
  chains (`const label = 'Save'; <AppButton label={label} />`).

It never follows call arguments, so `t('key')` passes. It never follows a condition, and it reads an
object only at user-facing keys, so `const key = 'save'; t(key)`, `const isEdit = mode === 'edit'`
and `{ value: 'light', label: 'light' }` used as `t(choice.label)` all pass.

**Name resolution (added 27 Oct for review finding M3; UNRUN).** Lexical, within one file. Walking out
from the name, the nearest binding wins:
- only a plain `const name = value` is followed;
- a parameter, `let`, `var` (hoisted to its function or file), destructuring, import, function, class,
  enum, namespace, catch or loop binding of the same name stops the search with no finding;
- a name bound twice in one scope is treated as opaque.

Each const is expanded at most once per display site, so cyclic and self-referencing aliases end, and
the work per site is bounded by the number of consts in the file. A finding reached through a const is
reported at the name's position on the display site, not at the const.

**Known limits, precisely.** The scan sees literals, not data. It does not see:
1. **Values that aren't a same-file `const`.** Parameters, including `.map` callback parameters over a
   literal array: `label={v}` in CustomExerciseScreen:29-30 shows `resistance`, `per_hand`, ...
   (SC-2). Also `let`/`var`, destructured consts (`const { label } = COPY`), imports (there is no
   cross-file resolver), class fields and `this.x`.
2. **Property and element access.** `COPY.save`, `COPY['save']`, `LABELS[kind]`,
   `{exercise.loadBasis}`, `{role}` from `useGym()` in GymHomeScreens and GymMembersScreen (G17.app).
3. **Calls.** Helper functions that return literals (`label={labelFor(x)}`), `.join(' · ')` and
   `String(x)`. Arguments of any call that isn't a display call. This is the rule that keeps `t('key')`
   safe.
4. **Objects outside the read positions.** User-facing keys are read only in two places:
   - objects passed to a non-user-facing JSX prop or a JSX spread, directly or through a same-file
     const;
   - objects, and arrays of objects, passed to a display call.

   Not read:
   - arrays of objects in JSX props (`options={[{ label: 'Kg' }]}`);
   - object spreads inside a read object (`{ ...BASE, title }`);
   - nested objects (`{ params: { title } }`);
   - computed keys, methods and getters.
5. **Display calls are recognised by name only.** These are `alert`, `announceForAccessibility`,
   `setError`, `setMessage`, `setNotice`, `setOptions` and `setToast`, matched on the callee name
   (so any `x.alert(...)` counts). Others, such as `Alert.prompt`, `ToastAndroid.show` or a custom
   `notify`, are not checked.
6. **User-facing props come from a fixed list** (`label`, `title`, `accessibilityLabel`, ...). For a
   custom prop name outside it, such as `heading="Today"`, the value itself is never reported. Only an
   object value is read, and then only at its user-facing keys.
7. **One finding per const per display site.** A const reached twice within one expression, as in
   `{ok ? label : label}`, is reported once.
8. **Text with no letter in any script is ignored by design** (`—`, `·`, `₹`, digits).
9. **Error text thrown in data or domain code and shown through `e.message`.** For example:
   - `'Could not save'` in `src/data/gym-outbox.ts:23`;
   - `'Could not sync'` in `src/data/member-store.ts:60`;
   - `'Workout is not active'` in `member-store.ts:100,110,123`;
   - `'Completed workout required'` in `member-store.ts:161`.

   Owners: MB-1, SC-7, as in the handoff.

**Predicted effect of the M3 rules on today's tree (by reading, UNRUN): no new finding.** There is no
`Alert.alert` or `setOptions` call in `src/`. No display call takes a name, object or array argument.
Every bare name in a display position resolves to one of:
- a parameter;
- a `useState` or hook destructuring;
- a call result;
- a const without a lettered literal (ReceiptScreen `issued`, FreezeScreen `soldAllowance`).

AppearanceScreen's `choices` (`label: 'system'`, keys) is never in a read position. If the first run
shows a finding anyway, its owner fixes the source. It cannot be baselined, because the baseline can
no longer grow (below).

**Baseline.** `scripts/copy-literal-baseline.json` has 13 entries, all in screens owned by other lanes:

| File | Entries | Owner |
|---|---|---|
| `src/features/training/WorkoutScreen.tsx` (logger) | 7 | SC-1 |
| `src/features/food/FoodScreen.tsx` | 3 | SC-4 |
| `src/features/settings/ProfileScreen.tsx` (language endonyms) | 2 | SC-6 |
| `src/features/gym/GymPlansScreen.tsx` (`· v{version}`) | 1 | G17.app |

The check is shrink only: a literal the baseline does not list fails, and so does a baseline entry
that no longer matches. Literals in S4's own screens were migrated instead of baselined: Plates,
Programme, History, EditSet and Schedule under training, Today, and Progress and NewGoal under
progress.

**Shrink-only enforcement (added 27 Oct for review finding M4; UNRUN).**
- Findings now match entries on file, **kind** and text, counting duplicates.
- `copy-literals.test.ts` pins the original 13 `(file, kind, text, owner)` tuples in its own source,
  apart from the JSON. Through the scanner's `baselineProblems`, it requires the JSON to be a
  **multiset subset** of them.
  - Entries may be deleted as owners migrate them.
  - An entry swapped in after a removal, a kind swap, an owner change or an extra duplicate fails,
    whatever the count.
- The same policy, pinned in the test, also checks:
  - the entry shape: exactly four non-empty fields, a `src/` path, a known kind, normalised text
    with a letter;
  - known owners: SC-1, SC-4, SC-6, G17.app;
  - `G14.app` may never own an entry;
  - the screens G14.app migrated may hold none: PlatesScreen, EditSetScreen, ProgrammeScreen,
    HistoryScreen, ScheduleScreen, `features/today/`, `features/progress/` and `lib/i18n/`.
- A fixed hash of the JSON was not used, because it would also block legitimate removals.
- The CLI run alone (`node scripts/copy-literal-scan.cjs`) checks findings against the JSON but does
  not know the pin. `pnpm check` runs the Jest test, which does.

The 13 entries were predicted by reading every screen file and applying the rules by hand. The
TypeScript test asserts the tree produces exactly these findings. If the prediction is wrong, the first
run fails and names the finding. Including `kind` in the match makes a wrong predicted kind fail too.
The 27 Oct re-read of FoodScreen:20,25, GymPlansScreen:21, ProfileScreen:23 and
WorkoutScreen:43,54,56,91,92 found every predicted kind consistent with the rules. That is still
reading, not a run.

## 3. Language preference: audit of the existing persistence

| Layer | Today on `main` | Source |
|---|---|---|
| Server column | `profiles.locale text not null default 'en' check (locale in ('en','hi'))` | `supabase/migrations/20261017161031_member_core.sql:11` |
| Server write | `authenticated` may update the named profile columns, including `locale` | `20261017161225_member_operations.sql:115`, `20261017162313_explicit_api_grants.sql:6` |
| Onboarding | `complete_onboarding(p_locale)` validates `en`/`hi`, but the client sends `'en'` regardless of device language | `20261017164336_validated_contracts.sql:77`; `apps/mobile/src/features/auth/OnboardingScreen.tsx:15` |
| Client read | `loadProfile()` casts `data.locale as 'en' \| 'hi'` without validation | `apps/mobile/src/data/api.ts:25` |
| Client write | ProfileScreen updates `profiles.locale` directly, then calls `setCurrentLocale` and caches the profile | `apps/mobile/src/features/settings/ProfileScreen.tsx:17-19` |
| Device | Only the signed-in, profile-scoped cache draft `__profile`. Nothing before sign-in | `apps/mobile/src/data/MemberProvider.tsx:55` |
| Contract | AR-1 record §5: "Identity and profile ... get and update profile and preferences" is **Partial, owner MB-1**. Profile updates carry no revision (§4.7). `packages/domain` has no locale schema | `docs/architecture/003-architecture-freeze.md:770, 1005` |

**Conclusion.** No frozen profile-preferences contract exists yet, so G14.app did not build against
one. The device side is implemented: `LanguageProvider` saves every `setCurrentLocale` call, which
MemberProvider makes on profile load and ProfileScreen makes on save. That gives local persistence
without touching `src/data` or the profile screen. The profile-contract half of box 3 stays unproved
until MB-1 publishes the contract (SP3).

### Contract request to MB-1 (S8)

1. Export `localeSchema = z.enum(['en', 'hi'])` from `packages/domain` and use it in a published
   profile and preferences schema, with a contract-version bump (AR-1 rule).
2. Publish the preferences update as a versioned command, or document the direct column update as
   the contract. Either way it needs:
   - identity from the session;
   - a locale outside `en`/`hi` rejected with the documented error code;
   - a stated concurrency rule (base revision or last write wins);
   - the response returns the updated profile.
3. Parse `locale` with that schema in `loadProfile` instead of casting (`src/data/api.ts:25`).
4. State the precedence rule G14.app implements:
   - before sign-in and offline, the device language applies;
   - after a successful profile load, the account's language wins and is saved on the device.
   Decide whether a language change made offline is queued in the outbox or blocked with a message.
5. Add an integration test:
   - set `hi`;
   - reload the profile and get `hi`;
   - another user cannot read or update it (this joins MB-1's cross-user test).

Once that is published, the profile round-trip test belongs with G14.app (a retry) or SC-6.

## 4. Commands that turn this into proof

From the repo root, with the rtk prefix:

```bash
rtk pnpm install --frozen-lockfile
rtk pnpm --filter @fitlog/mobile exec jest --runInBand src/lib/i18n
rtk pnpm --filter @fitlog/mobile typecheck
rtk pnpm --filter @fitlog/mobile lint
rtk proxy node apps/mobile/scripts/copy-literal-scan.cjs
rtk pnpm check
rtk pnpm --filter @fitlog/mobile exec expo export --platform ios --platform android --output-dir .expo/export-native
```

Run the mutation checks listed in the handoff, then record each result line there.
