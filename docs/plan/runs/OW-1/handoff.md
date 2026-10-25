# Handoff — OW-1 · Record the selected Momentum direction and its Figma gaps        attempt 2 · v2/develop (bootstrap, uncommitted) · base 846fd1f

> **Bootstrap correction, not a goal-worktree run.** Prepared 25 October 2026 by the Claude execution
> worker under the Codex orchestrator, after independent verification of attempt 1 accepted box 1
> (through tracker UI-01) and failed box 2 (the iOS list lacked most member screen families). This pass
> edited only `docs/evidence/OW-1/figma-gaps.md` and this handoff. It ran no commands, used no git, did
> not delegate and opened no external service, Figma included. `status.json`, GOALS.md, the tracker,
> ACCEPTANCE.md and code are unchanged.

**Outcome claimed.** Documentary evidence for both Done-when boxes is submitted for independent
verification. Neither box is verified in this attempt, and nothing is on `main`.

Line references are `file:line` in this checkout. `tracker` is `docs/09-PROJECT-TRACKER.md`;
`docs/22` is `docs/22-UI-MOMENTUM.md`.

## Done when

| Box (verbatim from GOALS.md:114–115) | Status | Evidence |
|-----|-----|----------|
| The tracker decision log has an owner-dated entry: Momentum is the only UI direction and the trainer UI is retired | Documentary evidence submitted for verification | tracker:57 UI-01 |
| `docs/evidence/OW-1/figma-gaps.md` lists every frame still to draw (O-23, O-24, Hindi, iOS), each with the goal that needs it | Documentary evidence submitted for verification (corrected after the failed check) | [figma-gaps.md](../../../evidence/OW-1/figma-gaps.md) |

### Box 1

> The tracker decision log has an owner-dated entry: Momentum is the only UI direction and the trainer UI is retired

- tracker:57, **UI-01**, dated "2026-10-17 (consolidated 25 Oct)": "Momentum is the only UI direction;
  trainer UI T-01–T-05 is retired. Retain volt lime, dark/light/system, the five-tab member shell and
  the operational staff shell."
- UI-01 consolidates owner choices that were already recorded. It approves nothing new. Its Why column
  reads: "Documentary consolidation of the existing owner-backed TECH-01 and PROD-01 decisions, PRD §19
  and DEC-01; this records their scope without claiming a new owner approval on 25 Oct". The sources:
  - TECH-01 (tracker:56, 2026-10-17): "Owner explicitly confirmed Expo + TypeScript, retaining Momentum
    and shared theme tokens".
  - PROD-01 (tracker:44, 2026-10-11), with tracker:61: "The product owner selected trainer removal".
- UI-01 was already in the tracker when this attempt began. This attempt did not edit the tracker.

### Box 2

> `docs/evidence/OW-1/figma-gaps.md` lists every frame still to draw (O-23, O-24, Hindi, iOS), each with the goal that needs it

**What this attempt changed in the register.**
- **§4 iOS, rewritten as 29 rows.** Each row names the goal that builds the screens and the box that
  proves them on an iOS release build: QA-4 1 for member screens (QA-4 2 for VoiceOver over the logger,
  the diary and settings), PL-8 1–2 and G15.app 2 for the device journeys, and G23 1 for gym screens.
- **The families the verifier found missing are now listed:**
  - A-01, A-07a–f, A-08–A-10 (SC-5)
  - B-02–B-05 (SC-3)
  - C-01–C-09, D-01–D-04 (SC-2)
  - E-01, E-02, E-05–E-07, E-09, E-12, E-13 (SC-2)
  - F-01–F-07 (SC-2; AP-2 for F-04)
  - G-01–G-07, I-01–I-06, J-01–J-04 (SC-3)
  - H-02, H-04, H-05, H-10–H-16 (SC-4)
  - H-06, H-07, H-18 (AI-3)
- **The gym rows are split by the goal that builds them:** G16.app, G17.app, G18.app, G19.app,
  G20.app, G21.app and G22.app.
- **No current iOS frame is invented.** The three page-04 iOS frames (B-01, E-03, E-11, from 4 October)
  stay recorded as historical coverage. Only 3 rows are partly documented (shell, Today, logger loop),
  1 has the mapping table only (kit), and 25 are still to draw.
- **Other omissions found by comparing PRD §19.1–19.2 and docs/22 §3.1:**
  - The member shell's quick actions and active-session recovery affordance (PRD:1200–1201).
  - The gym-join expired, wrong-phone and already-linked states (PRD:1223), in both the Hindi and iOS
    tables.
  - Today's gym cards (PRD:1224): a Hindi row, iOS-24 and a §6 note. No card owns them.
  - Pro pending, verifying and restore states (PRD:1233).
  - Native share-sheet and photo-picker patterns.
  - O-01 moved to the G16.app staff-shell row.
- **Summary counts updated.** Hindi now has 14 member families and 13 gym rows. iOS now has 29 rows.
  O-23 (10 rows), O-24 (9 rows plus 2 remaining N-06 states) and the 7 retired-entry checks are
  unchanged.
- **Citations.**
  - Tracker citations shifted by the UI-01 insertion are corrected: 60→61, 94→95, 96–97→97–98,
    100→101, 103→104.
  - docs/22:107–108 is corrected to 108–109.
  - UI-01 (tracker:57) is cited in the header, §0 and §5.

**Bounds.** The register is built from local documents only. Rows marked "partly documented" rest on
the tracker's 11 October statement that the node links were verified (tracker:101). Any row marked
"still to draw" may already exist in the file (docs/22:88). P2 and gated screens are excluded on
purpose, and the register lists them.

## Acceptance evidence

| Ledger row | Run | Result | Row written here? |
|------------|-----|--------|-------------------|
| DEC-01 · brand assets cleared (OW-1, DS-6 · MS-5; ACCEPTANCE:115) | None; records only | No result | No. DS-6 is the last prover |
| DEC-13 · member scope, no trainer or coaching (OW-1, QA-3 · MS-3; ACCEPTANCE:131) | None; records only | No result | No. QA-3 is the last prover |

## Gates

| Gate | Result |
|------|--------|
| `pnpm check` | Passes on the current dirty bootstrap checkout, as run and reported by the Codex orchestrator. This worker did not run it. No fresh result from `main` is claimed |
| `node scripts/plan/build.mjs --check` | Not run. This attempt did not change GOALS.md or ACCEPTANCE.md |

## Pending

- **Independent verification** of both boxes by `goal-verifier`.
- **Integration onto `main`.** A goal is Done only after verification and the merge to `main`
  (GOALS.md:58). QA-1 needs OW-1 (GOALS.md:138), and the reset exists only on `v2/develop` until QA-1
  lands it (docs/23 §6). The orchestrator decides how OW-1's evidence reaches `main`.
- **Status and commit.** `status.json` is untouched, and both files remain uncommitted.

## Follow-ups outside OW-1's boxes (not blockers)

- A live Figma audit that adds node links for rows that already exist (register §7, step 1).
- Drawing the remaining frames (register §7, step 2).
- Handing the register to the designer, which the card's Outcome describes (GOALS.md:103–105).

## Found for other goals

- **QA-2 (docs/22 is in scope, GOALS.md:206).**
  - docs/22:147–149 says O-23 and O-24 are "not claimed to exist yet", against the linked O-23 frames at
    docs/22:93.
  - The retired page has two names (docs/22:80 against docs/22:144, 258).
  - docs/22:34–35 repeats a garbled phrase.
- **Plan owner.**
  - G21.app's PRD line (GOALS.md:1433) still says O-23 is "to be drawn".
  - Today's gym cards (PRD:1224, MVP-G) have no owning build card.
- **Builders.** Each goal named in the register's §1–§4 owns the rows that cite it.

## Decisions forced

None.

## Traps hit

- **Shifted tracker lines.** Inserting UI-01 at tracker:57 moved every later tracker line down by one.
  Citations from attempt 1 pointed at the wrong rows.
- **docs/22 contradicts itself on O-23.** The register follows the dated, linked live table and flags
  the conflict.
- **Historical D47 instructions** in `owner-packs/OW-1.md` and the INBOX snapshot predate the reset
  (INBOX.md:24). They were not followed.
