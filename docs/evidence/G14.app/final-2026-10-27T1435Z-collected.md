## G14.app M3/M4 source review (independent, source-only)

I used only Read and Grep. No permission denial happened. I did not run the launcher script at the end of your message, because it uses a shell. Every test, typecheck, lint, CLI, CLDR and mutation check is still **UNRUN**, and nothing below is runtime proof.

**Counts:** Critical 0 · High 0 · Medium 0 · Low 5 (labelled N1–N5 so they don't collide with the earlier L1–L3).

**Dispositions (source-only):**
- **M3 is corrected in source and accepted on reading.** All three minimum fixes from the 1335Z review are present: following a same-file const, reading display-call objects and arrays at user-facing keys, and treating `setOptions` as a display call. Each has a planted test.
- **M4 is corrected in source and accepted on reading.**
- **Both stay OPEN** until the focused Jest run and the M3/M4 mutation rows are recorded and independently re-reviewed.

## Findings

**N1 · Low · `apps/mobile/scripts/copy-literal-scan.cjs:245-254`, with `docs/evidence/G14.app/i18n-spine-notes.md:85-94`**
- **Defect:** `userFacingKeys` follows only `?:`, so an object behind `&&`, `||` or `??` is never read. `rendered` does follow those operators (`:219-227`), and the "Known limits" list doesn't mention this gap.
- **Scenario:** each of these gives no finding:
  - `<Header {...(isEdit && { action: 'Edit' })} />`
  - `const extra = isEdit && { action: 'Edit' }; <Header {...extra} />`
  - `options={ready && { title: 'Home' }}`

  In each case the BinaryExpression falls through to the `!ts.isObjectLiteralExpression` return at `:254`. Today's tree uses only the ternary form (GymMembersScreen:52, ProgrammeScreen:28), so nothing is missed today. But the handoff's claim that the limits are "stated precisely" (handoff.md:53) is incomplete.
- **Fix:** add a binary branch to `userFacingKeys` that matches `rendered` (the right side of `&&`, both sides of `||` and `??`), plus one planted case. Or list it as limit 4.

**N2 · Low · `apps/mobile/src/lib/i18n/__tests__/copy-literals.test.ts:289-290` and `:309,314`, with `TodayScreen.tsx:44`**
- **Defect:** both real-screen tests plant a sibling element inside `{!!error && …}`, which makes the scratch screen invalid TSX.
- **Scenario:**
  - Line 44 becomes `{!!error && <AppText tone="error">{error}</AppText><AppText>{plantedTitle}</AppText>}`. That is TS2657, "JSX expressions must have one parent element".
  - The tests pass only because TypeScript's parser recovers by wrapping the stray sibling in a synthetic comma BinaryExpression, and `scanSource` ignores parse diagnostics.
  - So "fails a real screen…" never proves detection on a screen that compiles. A change in that recovery on a TS upgrade would break both tests for reasons unrelated to the scan.
- **Fix:** use the whole line-44 expression `{!!error && <AppText tone="error">{error}</AppText>}` as the anchor and append the plant after it, or wrap the plant in `<>…</>`.

**N3 · Low · `copy-literals.test.ts:167-184` (behaviour at `copy-literal-scan.cjs:112-114,188-193`)**
- **Defect:** the implementation resolves aliases at the declaration's lexical scope, which is correct: `follow` passes `declaration.initializer`, and its names resolve from their own parents. But no test pins this, and none covers shadowing by a function, class or enum.
- **Scenario:** either of these regressions passes every current test:
  - a refactor that resolves initializer names from the display site's scope chain, which would make `const alias = title;` (module) used in `function P({ title }) { return <Header title={alias} />; }` report nothing instead of "Module title";
  - dropping FunctionDeclaration, ClassDeclaration or EnumDeclaration from `statementBindings`.
- **Fix:** add that alias case, plus `function Fn() { function title() { return ''; } return <Header title={title} />; }` (expect no finding), to the shadowing test.

**N4 · Low · `docs/plan/runs/G14.app/handoff.md:153` and `:129`**
- **Defect:** the "baseline shrink-only" mutation row names a test that doesn't kill the mutant, and its procedures either don't isolate the mutation or require editing the frozen JSON.
- **Scenario:**
  - With the stale loop at `scan.cjs:339-346` removed, "has no user-facing literal beyond…" still passes on the unchanged tree (`stale` is always `[]`, and findings = baseline = 13).
  - "Deleting one migrated literal's baseline line" produces `unexpected`, not `stale`, so the test fails with or without the mutation.
  - "Adding a bogus entry" requires editing the JSON that M4 freezes.
  - The mutant is actually killed by "rejects a kind swap…" (test:371 asserts `stale: [entry]`).
  - Separately, gate row :129 lists the CLI without saying it doesn't enforce the M4 pin.
- **Fix:** point the row at the kind-swap test and drop the JSON-edit procedures. Note on :129 that only Jest enforces the pin. The scanner header (`:26-30,33-34`) and the notes (`:155-156`) already say this correctly.
- **JSON description:** `copy-literal-baseline.json:2` puts "Shrink only" next to the CLI's behaviour. That is acceptable given the clarifications above. **Do not edit the JSON.**

**N5 · Low (maintainability) · `copy-literal-scan.cjs:170-297`**
- **Defect:** `scanSource` is now 128 lines with six nested closures, well over the ~50-line bar.
- **Scenario:** future rule changes (N1, for example) land in one large closure scope, which is harder to test in isolation.
- **Fix:** move `follow`, `rendered` and `userFacingKeys` to module scope, taking a `{ source, constantFor, report }` context. Not blocking.

## Checked, no finding

**Resolver** (`:82-168`), traced:
- The nearest binding wins, and only a plain `const` with an initializer is followed.
- Parameters, destructuring, `let`, `using`, for-of/for-in (no initializer), catch, imports, functions, classes, enums and named function expressions are all opaque.
- `var` hoists to its function body or file and stops at nested functions and classes.
- A name bound twice in one scope is opaque.

**Cycles and crashes:**
- The per-site `seen` set stops `loopA↔loopB`, `selfish = selfish` and `tail↔tailAlias`.
- `rendered` never calls `userFacingKeys`, and `userFacingKeys` reads only one level of an object, so the work stays linear with no blow-up.
- No crash path found. TypeScript `~6.0.3` (package.json:66) provides `isSatisfiesExpression` and `NodeFlags.Using`.

**Display calls:**
- The two separate sites (`:286-289`) prevent double reports and keep the `keepButtons` "Keep" finding.
- `style`, `onPress`, `headerShown`, `animation` and router `params` are excluded. The shorthand `{ title }` is followed.

**Tests:** I hand-traced all 6 M3 tests, the real-screen M3 test and all 8 M4 tests against the scanner. Expected kinds, texts, lines and order all match, and each planned M3/M4 mutation row except N4 is killed by the test it names.

**M4 policy:**
- The test pins the 13 original tuples itself (test:46-60), separately from the JSON.
- `baselineProblems` (`:376-398`) does a true multiset subset check on file, kind, text and owner. Shape is checked first.
- Forbidden and unknown owners are rejected, and migrated paths include Plates, EditSet, Programme, History, Schedule, `today/`, `progress/` and `lib/i18n/`.
- Shrink, same-count substitution, kind swap, owner swap, duplicate growth and malformed input are all exercised.

**Bytes and kinds:**
- My own Grep matched `हिन्दी`, `×` and `·` identically across the JSON, the pin and ProfileScreen, WorkoutScreen and GymPlansScreen.
- All 13 kinds re-derived: FoodScreen:20,25; GymPlansScreen:21; ProfileScreen:23; WorkoutScreen:43,54,56,91,92.

**Zero new findings:** confirmed by reading, and I found no source that contradicts it:
- There is no `Alert.alert` or `setOptions` call anywhere.
- Every display-call argument is `''`, `t()`, `e.message` or a ternary of those.
- No same-file const holding a lettered literal reaches a display position. MomentumAsset `variant`, ThemeProvider `scheme`/`platform` and ReceiptScreen `html` are never read.
- Bare names in display positions are props, `useState` values or map parameters.

**CLI vs Jest:** the CLI checks findings against the JSON only. The pin is enforced only through Jest: root `check` → `test` → mobile `test:ci` → `testMatch`.

**Still unverified:** whether `jest-expo` loads `.cjs` through `jest.requireActual`. Nothing else in the tree does this.

## Carried forward (open, not re-reviewed)

| Finding | Owner |
|---|---|
| M1 | G14.app |
| M2 | G14.app, with G14.hi for the wording |
| M5 | G14.app, S3/SC-5 and MB-1. **The S3 mount stays on hold** until the three agree one locale policy |
| M6 | SC-2, with G14.app for the shared parser design |
| L1 | G14.app |
| L2 | MB-1 and G14.app |
| L3 | G14.app (read timeout optional) |

No Done-when box is met, there is no Done claim, and nothing is accepted at runtime.

## Recommended next phase

One shell-enabled verification phase for G14.app:
1. Optionally fix N2 and N4 first, if edits are authorised; they're a test-anchor change and a doc row. N1 and N3 can wait.
2. Run `rtk pnpm install --frozen-lockfile`, then the focused `copy-literals.test.ts`, then `src/lib/i18n`, typecheck, lint and the CLI.
3. Run the M3/M4 mutation rows, with the shrink-only row repointed, and record each output line.
4. Get an independent review of that run evidence.

M1, M2, L1 and L3 come in a separate bounded phase after M3/M4 are green.
