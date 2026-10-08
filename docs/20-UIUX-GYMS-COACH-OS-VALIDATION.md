# Coach OS native implementation note

This note records the current Expo implementation of the second gym design direction. [The direction brief](19-UIUX-GYMS-COACH-OS.md) and [editable Figma file](https://www.figma.com/design/lMwyxjm3xVG4IvAZ920wMf) describe the intended member, trainer and owner experience. They do not establish production readiness. The earlier blue browser study remains historical; its validation results do not validate this native revision.

## Implemented in source

- [Mobile tokens](../apps/mobile/src/theme/tokens.ts) now use graphite/lime dark surfaces and warm light surfaces with a dark olive action. Hanken Grotesk supplies body, headings and data; its regular/medium faces are loaded alongside existing weights. Inter stays loaded for legacy uses.
- Shared `Text` labels use quieter tracking without forced uppercase. `Card` keeps tonal layering and reserves elevation for hero cards. `ScreenScaffold` has a larger header/back control and a gym-workspace entry; `TabBar` has a taller rail, raised circular add action and an active top marker. The root stack uses the platform default transition.
- Home, Train, Nutrition and Progress include the shared [CoachPrompt](../apps/mobile/src/features/coach/CoachPrompt.tsx). Their actions enter existing quick-action, session-start, food-add and measurement-log routes. Home guidance and Train’s primary task precede the concept helper. The existing logger receives shared theme changes; this pass does not rebuild its set-entry hierarchy into the Figma focused logger.
- [Gym workspace](../apps/mobile/app/gym/index.tsx) provides Member, Trainer and Owner selectors, role summaries, navigation rows and helper cards. Values are synthetic and labeled **Preview**. Member coaching opens Train; gym check-in/card/challenge rows and trainer/owner operational actions show an explicit preview notice. Register, payments, receipts, roster, assignment and reports are not connected gym workflows in this pass.
- The shared minimum control target is 48dp, with 56dp logger actions. Shared buttons respond to the system Reduce Motion preference by removing press scaling while retaining state feedback; this is source-level behavior, not device accessibility certification.
- [PRODUCT.md](../apps/mobile/PRODUCT.md), [DESIGN.md](../apps/mobile/DESIGN.md) and the mobile `.impeccable/design.json` record the product constraints and working native direction. These files describe both current choices and intended behavior; their existence is not proof that every contract is implemented.

## Role coverage and AI contract

All three roles are represented in the Figma direction and native workspace preview. Functional native additions are concentrated on the member roots and shared shell. Equal visual attention must not be mistaken for equal backend or end-to-end completion.

The helper uses **Concept** or **Suggestion** and **Review before saving** labels. It routes the member into an existing reviewable flow; it does not generate a new AI response or autonomously mutate records. Trainer copy says Owner Pro and approval required. Owner copy says nothing is sent automatically. Production AI must preserve explicit confirmation for plan changes, nutrition records, payments, receipts and external messages; suggestions must respect sharing permissions and remain secondary to local workout entry. Pro entitlement enforcement and gym authorization are not implemented by these preview labels.

## Verification and limits

The lead implementation run reported:

| Command | Result |
|---|---|
| `rtk proxy pnpm --filter @fitlog/mobile typecheck` | Passed. |
| `rtk proxy pnpm --filter @fitlog/mobile test --runInBand src/theme/__tests__/contrast.test.ts app/__tests__/dashboardRequests.test.tsx` | 2 suites / 23 tests passed. |
| `rtk proxy pnpm --filter @fitlog/mobile test --runInBand app/__tests__/homeGuidance.test.tsx app/__tests__/nutritionScreens.test.tsx app/__tests__/shellScreens.test.tsx` | 3 suites / 54 tests passed. |
| Final: `rtk proxy pnpm --filter @fitlog/mobile test --runInBand src/theme/__tests__/contrast.test.ts app/__tests__/homeGuidance.test.tsx app/__tests__/nutritionScreens.test.tsx app/__tests__/shellScreens.test.tsx` | After reviewer feedback, 4 suites / 75 tests passed; React `act` warnings were reported. Typecheck also passed again. |
| `rtk proxy pnpm --filter @fitlog/mobile test --runInBand` | All 143 suites / 1,434 tests passed. Jest retained an existing asynchronous handle after reporting completion and was interrupted with SIGINT; the process did not exit cleanly. |

The full run preceded the final feedback adjustments; final typecheck and the 75-test targeted run verified those adjustments. Targeted coverage includes contrast, dashboard requests, home guidance, nutrition screens and shell regressions. These results do not substitute for fresh rendered-device review.

Native screenshot/device validation was unavailable in this workspace and has not been established for this revision. No browser screenshot was used as native validation. The supplied Android captures predate these source changes, and browser-study captures prove only that study. Before calling the native layout validated, inspect fresh app renders in both themes, large system text, narrow Android widths, safe-area/keyboard states and each role on the reference device. No native performance, screen-reader, user-research, live gym API, financial-write or full Hindi validation is established by this note.

The Figma spring sheets, AI reveals and commit haptics remain a motion plan. This pass adds Reduce Motion support to shared button presses and uses platform navigation; it does not constitute the full Reanimated implementation. The open PRD decisions and equal-role English/Hindi pilot tasks in the direction and product documents still apply.
